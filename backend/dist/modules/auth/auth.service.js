"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const axios_1 = require("axios");
const user_entity_1 = require("../../entities/user.entity");
const user_activity_entity_1 = require("../../entities/user-activity.entity");
const referral_entity_1 = require("../../entities/referral.entity");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    activityRepository;
    referralRepository;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    botToken;
    constructor(userRepository, activityRepository, referralRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
        this.referralRepository = referralRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (!this.botToken) {
            this.logger.error('TELEGRAM_BOT_TOKEN is not defined in configuration.');
            throw new Error('TELEGRAM_BOT_TOKEN is not defined.');
        }
    }
    async telegramLogin(telegramData, ipAddress, userAgent) {
        try {
            this.logger.log(`محاولة تسجيل دخول عبر تليجرام للمستخدم: ${telegramData.telegram_id}`);
            if (!telegramData.telegram_id) {
                throw new common_1.BadRequestException('معرف التليجرام مطلوب');
            }
            let user = await this.userRepository.findOne({
                where: { telegramId: telegramData.telegram_id.toString() },
            });
            if (user) {
                user = await this.updateExistingUser(user, telegramData);
                this.logger.log(`تم تحديث بيانات المستخدم الموجود: ${user.telegramId}`);
            }
            else {
                user = await this.createNewUser(telegramData);
                this.logger.log(`تم إنشاء مستخدم جديد: ${user.telegramId}`);
                await this.sendWelcomeMessage(telegramData.telegram_id, telegramData.first_name);
            }
            const payload = {
                sub: user.id,
                telegramId: user.telegramId,
                username: user.username,
            };
            const accessToken = this.jwtService.sign(payload);
            await this.logUserActivity(user.id, user_activity_entity_1.ActivityType.LOGIN, ipAddress, userAgent, { method: 'telegram' });
            await this.sendLoginSuccessNotification(telegramData.telegram_id);
            return {
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                token: accessToken,
                user: {
                    id: user.id,
                    telegramId: user.telegramId,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    totalCoins: user.totalCoins,
                    miningRate: user.miningRate,
                    level: user.level,
                    referralCode: user.referralCode,
                },
            };
        }
        catch (error) {
            this.logger.error(`خطأ في تسجيل الدخول عبر تليجرام: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateExistingUser(user, telegramData) {
        user.username = telegramData.username || user.username;
        user.firstName = telegramData.first_name || user.firstName;
        user.lastName = telegramData.last_name || user.lastName;
        user.languageCode = telegramData.language_code || user.languageCode;
        user.lastLoginAt = new Date();
        user.isActive = true;
        return await this.userRepository.save(user);
    }
    async createNewUser(telegramData) {
        const user = new user_entity_1.User();
        user.telegramId = telegramData.telegram_id.toString();
        user.username = telegramData.username;
        user.firstName = telegramData.first_name;
        user.lastName = telegramData.last_name;
        user.languageCode = telegramData.language_code || 'ar';
        user.totalCoins = 100;
        user.miningRate = 1.0;
        user.level = 1;
        user.referralCode = this.generateReferralCode();
        user.registeredAt = new Date();
        user.lastLoginAt = new Date();
        user.isActive = true;
        const savedUser = await this.userRepository.save(user);
        if (telegramData.referral_code) {
            await this.processReferral(savedUser, telegramData.referral_code);
        }
        return savedUser;
    }
    async processReferral(newUser, referralCode) {
        try {
            const referrer = await this.userRepository.findOne({
                where: { referralCode: referralCode },
            });
            if (referrer && referrer.id !== newUser.id) {
                const referral = new referral_entity_1.Referral();
                referral.referrerId = referrer.id;
                referral.referredId = newUser.id;
                referral.rewardAmount = 50;
                referral.createdAt = new Date();
                await this.referralRepository.save(referral);
                referrer.totalCoins += 50;
                await this.userRepository.save(referrer);
                await this.sendReferralNotification(referrer.telegramId, newUser.firstName || newUser.username, 50);
                this.logger.log(`تمت معالجة إحالة جديدة: ${referrer.telegramId} -> ${newUser.telegramId}`);
            }
        }
        catch (error) {
            this.logger.error(`خطأ في معالجة الإحالة: ${error.message}`);
        }
    }
    async logUserActivity(userId, activityType, ipAddress, userAgent, metadata) {
        try {
            const activity = new user_activity_entity_1.UserActivity();
            activity.userId = userId.toString();
            activity.activityType = activityType;
            if (ipAddress)
                activity.ipAddress = ipAddress;
            if (userAgent)
                activity.userAgent = userAgent;
            activity.metadata = metadata;
            activity.createdAt = new Date();
            await this.activityRepository.save(activity);
        }
        catch (error) {
            this.logger.error(`خطأ في تسجيل النشاط: ${error.message}`);
        }
    }
    generateReferralCode() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    async sendWelcomeMessage(telegramId, firstName) {
        try {
            const message = `🎉 مرحباً ${firstName}!\n\nتم تسجيل حسابك بنجاح في SmartCoin!\n\n💰 حصلت على 100 عملة SM كمكافأة تسجيل\n🚀 ابدأ التعدين الآن واحصل على المزيد من العملات!`;
            await this.sendTelegramMessage(telegramId, message);
        }
        catch (error) {
            this.logger.error(`خطأ في إرسال رسالة الترحيب: ${error.message}`);
        }
    }
    async sendLoginSuccessNotification(telegramId) {
        try {
            const message = `✅ تم تسجيل دخولك بنجاح!\n\n🚀 يمكنك الآن الوصول إلى جميع ميزات SmartCoin`;
            await this.sendTelegramMessage(telegramId, message);
        }
        catch (error) {
            this.logger.error(`خطأ في إرسال إشعار تسجيل الدخول: ${error.message}`);
        }
    }
    async sendReferralNotification(telegramId, referralName, bonus) {
        try {
            const message = `👥 إحالة جديدة!\n\n🎉 انضم ${referralName} عبر رابط الإحالة الخاص بك\n💰 حصلت على ${bonus} عملة SM كمكافأة\n\n🔗 شارك رابطك مع المزيد من الأصدقاء!`;
            await this.sendTelegramMessage(telegramId, message);
        }
        catch (error) {
            this.logger.error(`خطأ في إرسال إشعار الإحالة: ${error.message}`);
        }
    }
    async sendTelegramMessage(telegramId, message) {
        try {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            await axios_1.default.post(url, {
                chat_id: telegramId,
                text: message,
                parse_mode: 'Markdown'
            });
        }
        catch (error) {
            this.logger.error(`خطأ في إرسال رسالة تليجرام: ${error.message}`);
        }
    }
    async logout(userId, ipAddress, userAgent) {
        try {
            await this.logUserActivity(userId, user_activity_entity_1.ActivityType.LOGOUT, ipAddress, userAgent);
            this.logger.log(`تم تسجيل خروج المستخدم: ${userId}`);
            return {
                success: true,
                message: 'تم تسجيل الخروج بنجاح'
            };
        }
        catch (error) {
            this.logger.error(`خطأ في تسجيل الخروج: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getUserProfile(userId) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['referrals', 'activities']
            });
            if (!user) {
                throw new common_1.UnauthorizedException('المستخدم غير موجود');
            }
            return {
                id: user.id,
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                totalCoins: user.totalCoins,
                miningRate: user.miningRate,
                level: user.level,
                referralCode: user.referralCode,
                registeredAt: user.registeredAt,
                lastLoginAt: user.lastLoginAt,
                isActive: user.isActive,
                referralCount: user.referrals?.length || 0,
            };
        }
        catch (error) {
            this.logger.error(`خطأ في الحصول على ملف المستخدم: ${error.message}`, error.stack);
            throw error;
        }
    }
    async verifyToken(payload) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: payload.sub, isActive: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('المستخدم غير موجود أو غير نشط');
            }
            return user;
        }
        catch (error) {
            this.logger.error(`خطأ في التحقق من التوكن: ${error.message}`, error.stack);
            throw new common_1.UnauthorizedException('توكن غير صالح');
        }
    }
    async getUserStats(telegramId) {
        try {
            const user = await this.userRepository.findOne({
                where: { telegramId: telegramId },
                relations: ['referrals', 'activities']
            });
            if (!user) {
                return {
                    balance: 0,
                    mining_count: 0,
                    completed_tasks: 0,
                    referrals: 0,
                    level: 1
                };
            }
            const miningCount = user.activities?.filter(activity => activity.activityType === user_activity_entity_1.ActivityType.MINING).length || 0;
            const completedTasks = user.activities?.filter(activity => activity.activityType === user_activity_entity_1.ActivityType.TASK_COMPLETED).length || 0;
            return {
                balance: user.totalCoins,
                mining_count: miningCount,
                completed_tasks: completedTasks,
                referrals: user.referrals?.length || 0,
                level: user.level
            };
        }
        catch (error) {
            this.logger.error(`خطأ في الحصول على إحصائيات المستخدم: ${error.message}`);
            return {
                balance: 0,
                mining_count: 0,
                completed_tasks: 0,
                referrals: 0,
                level: 1
            };
        }
    }
    async sendMiningNotification(telegramId, amount) {
        try {
            const message = `🔨 تم التعدين بنجاح!\n\n💰 حصلت على ${amount} عملة SM\n\n🚀 استمر في التعدين يومياً للحصول على المزيد!`;
            await this.sendTelegramMessage(telegramId, message);
        }
        catch (error) {
            this.logger.error(`خطأ في إرسال إشعار التعدين: ${error.message}`);
        }
    }
    async sendTaskCompletionNotification(telegramId, taskName, reward) {
        try {
            const message = `🎯 مهمة مكتملة!\n\n✅ أكملت مهمة: ${taskName}\n💰 حصلت على ${reward} عملة SM\n\n🏆 تابع إكمال المهام للحصول على المزيد من المكافآت!`;
            await this.sendTelegramMessage(telegramId, message);
        }
        catch (error) {
            this.logger.error(`خطأ في إرسال إشعار إكمال المهمة: ${error.message}`);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_activity_entity_1.UserActivity)),
    __param(2, (0, typeorm_1.InjectRepository)(referral_entity_1.Referral)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map