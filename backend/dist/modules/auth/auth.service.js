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
    constructor(userRepository, activityRepository, referralRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
        this.referralRepository = referralRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async authenticateWithTelegram(telegramAuthDto, ipAddress, userAgent) {
        try {
            if (!this.verifyTelegramAuth(telegramAuthDto)) {
                throw new common_1.UnauthorizedException('بيانات مصادقة تليجرام غير صالحة');
            }
            let user = await this.userRepository.findOne({
                where: { telegramId: telegramAuthDto.id },
            });
            if (user) {
                user = await this.updateExistingUser(user, telegramAuthDto);
            }
            else {
                user = await this.createNewUser(telegramAuthDto);
            }
            await this.logActivity(user.id, user_activity_entity_1.ActivityType.LOGIN, 'تسجيل دخول عبر تليجرام', { telegramId: telegramAuthDto.id }, ipAddress, userAgent);
            const token = await this.generateJwtToken(user);
            this.logger.log(`تم تسجيل دخول المستخدم بنجاح: ${user.id}`);
            return {
                user: this.sanitizeUser(user),
                token,
            };
        }
        catch (error) {
            this.logger.error(`خطأ في مصادقة تليجرام: ${error.message}`);
            throw error;
        }
    }
    async validateJwtPayload(payload) {
        const user = await this.userRepository.findOne({
            where: { id: payload.sub, isActive: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('مستخدم غير موجود أو غير نشط');
        }
        return user;
    }
    async logout(userId, ipAddress, userAgent) {
        await this.logActivity(userId, user_activity_entity_1.ActivityType.LOGOUT, 'تسجيل خروج', {}, ipAddress, userAgent);
        this.logger.log(`تم تسجيل خروج المستخدم: ${userId}`);
    }
    async getUserProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['activatedPackages', 'referrals'],
        });
        if (!user) {
            throw new common_1.BadRequestException('مستخدم غير موجود');
        }
        const referralStats = await this.getReferralStats(userId);
        return {
            user: this.sanitizeUser(user),
            referralStats,
        };
    }
    verifyTelegramAuth(authData) {
        try {
            const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
            if (!botToken)
                throw new Error('TELEGRAM_BOT_TOKEN is missing!');
            const { hash, ...dataToCheck } = authData;
            const dataCheckArr = Object.keys(dataToCheck)
                .sort()
                .map(key => `${key}=${dataToCheck[key]}`)
                .join('\n');
            const secretKey = crypto.createHash('sha256').update(botToken).digest();
            const calculatedHash = crypto
                .createHmac('sha256', secretKey)
                .update(dataCheckArr)
                .digest('hex');
            if (calculatedHash !== hash) {
                return false;
            }
            const authDate = parseInt(authData.auth_date);
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime - authDate > 86400) {
                return false;
            }
            return true;
        }
        catch (error) {
            this.logger.error(`خطأ في التحقق من مصادقة تليجرام: ${error.message}`);
            return false;
        }
    }
    async updateExistingUser(user, telegramAuthDto) {
        user.username = telegramAuthDto.username ?? user.username ?? '';
        user.firstName = telegramAuthDto.first_name ?? user.firstName ?? '';
        user.lastName = telegramAuthDto.last_name ?? user.lastName ?? '';
        user.languageCode = telegramAuthDto.language_code ?? user.languageCode;
        user.isPremium = telegramAuthDto.is_premium ?? user.isPremium;
        user.lastLogin = new Date();
        return await this.userRepository.save(user);
    }
    async createNewUser(telegramAuthDto) {
        const user = new user_entity_1.User();
        user.telegramId = telegramAuthDto.id;
        user.username = telegramAuthDto.username ?? '';
        user.firstName = telegramAuthDto.first_name ?? '';
        user.lastName = telegramAuthDto.last_name ?? '';
        user.languageCode = telegramAuthDto.language_code ?? 'ar';
        user.isPremium = telegramAuthDto.is_premium ?? false;
        user.referralCode = this.generateReferralCode();
        user.lastLogin = new Date();
        const savedUser = await this.userRepository.save(user);
        await this.logActivity(savedUser.id, user_activity_entity_1.ActivityType.ACCOUNT_CREATED, 'تم إنشاء حساب جديد عبر تليجرام', { telegramId: telegramAuthDto.id });
        if (telegramAuthDto.start_parameter) {
            await this.processReferral(savedUser.id, telegramAuthDto.start_parameter);
        }
        this.logger.log(`تم إنشاء مستخدم جديد: ${savedUser.id}`);
        return savedUser;
    }
    async processReferral(newUserId, referralCode) {
        try {
            const referrer = await this.userRepository.findOne({
                where: { referralCode },
            });
            if (referrer && referrer.id !== newUserId) {
                const referral = new referral_entity_1.Referral();
                referral.referrerId = referrer.id;
                referral.referredId = newUserId;
                const rewardAmount = this.configService.get('REFERRAL_BONUS');
                if (rewardAmount === undefined) {
                    throw new Error('REFERRAL_BONUS is not defined in environment variables');
                }
                referral.rewardAmount = rewardAmount;
                referral.rewardGiven = true;
                await this.referralRepository.save(referral);
                referrer.totalCoins += referral.rewardAmount;
                await this.userRepository.save(referrer);
                await this.userRepository.update(newUserId, { referredBy: referrer.id });
                await this.logActivity(referrer.id, user_activity_entity_1.ActivityType.REFERRAL_BONUS_RECEIVED, 'تم استلام مكافأة إحالة', { referredUserId: newUserId, amount: referral.rewardAmount });
                await this.logActivity(newUserId, user_activity_entity_1.ActivityType.REFERRAL_MADE, 'تم الانضمام عبر إحالة', { referrerId: referrer.id });
                this.logger.log(`تم معالجة إحالة: ${referrer.id} -> ${newUserId}`);
            }
        }
        catch (error) {
            this.logger.error(`خطأ في معالجة الإحالة: ${error.message}`);
        }
    }
    async generateJwtToken(user) {
        const payload = {
            sub: user.id,
            telegramId: user.telegramId,
            username: user.username,
        };
        return this.jwtService.sign(payload);
    }
    generateReferralCode() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 8);
        return `${timestamp}${randomPart}`.toUpperCase();
    }
    async logActivity(userId, activityType, description, metadata, ipAddress, userAgent, amount, referenceId) {
        try {
            const activity = new user_activity_entity_1.UserActivity();
            activity.userId = userId;
            activity.activityType = activityType;
            activity.description = description;
            activity.metadata = metadata;
            if (ipAddress)
                activity.ipAddress = ipAddress;
            if (userAgent)
                activity.userAgent = userAgent;
            if (amount)
                activity.amount = amount;
            if (referenceId)
                activity.referenceId = referenceId;
            await this.activityRepository.save(activity);
        }
        catch (error) {
            this.logger.error(`خطأ في تسجيل النشاط: ${error.message}`);
        }
    }
    async getReferralStats(userId) {
        const referrals = await this.referralRepository.find({
            where: { referrerId: userId },
            relations: ['referred'],
            order: { createdAt: 'DESC' },
        });
        const totalReferrals = referrals.length;
        const totalRewards = referrals.reduce((sum, ref) => sum + (ref.rewardAmount || 0), 0);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const weeklyReferrals = referrals.filter(ref => ref.createdAt > oneWeekAgo).length;
        const monthlyReferrals = referrals.filter(ref => ref.createdAt > oneMonthAgo).length;
        return {
            totalReferrals,
            totalRewards,
            weeklyReferrals,
            monthlyReferrals,
            recentReferrals: referrals.slice(0, 10),
        };
    }
    sanitizeUser(user) {
        const { ...sanitizedUser } = user;
        return sanitizedUser;
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