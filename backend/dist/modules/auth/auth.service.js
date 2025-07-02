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
    verificationCodes = new Map();
    constructor(userRepository, activityRepository, referralRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
        this.referralRepository = referralRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        setInterval(() => {
            this.cleanupExpiredCodes();
        }, 5 * 60 * 1000);
    }
    async authenticateWithTelegram(telegramAuthDto, ipAddress, userAgent) {
        try {
            if (!this.verifyTelegramAuth(telegramAuthDto)) {
                throw new common_1.UnauthorizedException('بيانات مصادقة تليجرام غير صالحة');
            }
            let user = await this.userRepository.findOne({
                where: { telegramId: telegramAuthDto.id.toString() },
            });
            if (user) {
                user = await this.updateExistingUser(user, telegramAuthDto);
            }
            else {
                user = await this.createNewUser(telegramAuthDto);
            }
            await this.logActivity(user.id, user_activity_entity_1.ActivityType.LOGIN, 'تسجيل دخول عبر تليجرام', ipAddress, userAgent);
            const payload = {
                sub: user.id,
                telegramId: user.telegramId,
                username: user.username,
            };
            const accessToken = this.jwtService.sign(payload);
            return {
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                accessToken,
                user: {
                    id: user.id,
                    telegramId: user.telegramId,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    totalCoins: user.totalCoins,
                    miningRate: user.miningRate,
                    level: user.level || 1,
                    referralCode: user.referralCode,
                    isActive: user.isActive,
                },
            };
        }
        catch (error) {
            this.logger.error('خطأ في مصادقة تليجرام:', error);
            throw error;
        }
    }
    async verifyTelegramCode(verifyCodeDto, ipAddress, userAgent) {
        try {
            const { code } = verifyCodeDto;
            const verificationData = this.verificationCodes.get(code);
            if (!verificationData) {
                throw new common_1.UnauthorizedException('رمز التحقق غير صحيح أو غير موجود');
            }
            if (new Date() > verificationData.expiresAt) {
                this.verificationCodes.delete(code);
                throw new common_1.UnauthorizedException('رمز التحقق منتهي الصلاحية');
            }
            if (verificationData.isUsed) {
                throw new common_1.UnauthorizedException('رمز التحقق مستخدم بالفعل');
            }
            let user = await this.userRepository.findOne({
                where: { telegramId: verificationData.telegramId },
            });
            if (!user) {
                user = await this.createUserFromVerification(verificationData, verifyCodeDto);
            }
            else {
                user = await this.updateUserFromVerification(user, verificationData, verifyCodeDto);
            }
            verificationData.isUsed = true;
            this.verificationCodes.set(code, verificationData);
            await this.logActivity(user.id, user_activity_entity_1.ActivityType.LOGIN, 'تسجيل دخول عبر رمز التحقق', ipAddress, userAgent);
            const payload = {
                sub: user.id,
                telegramId: user.telegramId,
                username: user.username,
            };
            const accessToken = this.jwtService.sign(payload);
            setTimeout(() => {
                this.verificationCodes.delete(code);
            }, 5000);
            return {
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                accessToken,
                user: {
                    id: user.id,
                    telegramId: user.telegramId,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    totalCoins: user.totalCoins,
                    miningRate: user.miningRate,
                    level: user.level || 1,
                    referralCode: user.referralCode,
                    isActive: user.isActive,
                    isNewUser: !user.lastLoginAt,
                },
            };
        }
        catch (error) {
            this.logger.error('خطأ في التحقق من الرمز:', error);
            throw error;
        }
    }
    async checkVerificationCodeStatus(code) {
        const verificationData = this.verificationCodes.get(code);
        if (!verificationData) {
            return {
                exists: false,
                message: 'رمز التحقق غير موجود',
            };
        }
        const isExpired = new Date() > verificationData.expiresAt;
        const timeLeft = Math.max(0, verificationData.expiresAt.getTime() - new Date().getTime());
        return {
            exists: true,
            isUsed: verificationData.isUsed,
            isExpired,
            timeLeft: Math.floor(timeLeft / 1000),
            createdAt: verificationData.createdAt,
            expiresAt: verificationData.expiresAt,
        };
    }
    async handleTelegramWebhook(update) {
        try {
            this.logger.log('تم استلام تحديث من بوت تليجرام:', JSON.stringify(update));
            if (update.message) {
                const message = update.message;
                const user = message.from;
                const text = message.text;
                if (text === '/start' || text === '/login') {
                    return await this.handleLoginRequest(user);
                }
                if (text && text.length === 8 && /^[A-Z0-9]+$/.test(text)) {
                    return await this.handleVerificationCodeFromBot(user, text);
                }
            }
            return { success: true, message: 'تم معالجة التحديث' };
        }
        catch (error) {
            this.logger.error('خطأ في معالجة webhook:', error);
            return { success: false, error: error.message };
        }
    }
    async handleLoginRequest(telegramUser) {
        const code = this.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const verificationData = {
            telegramId: telegramUser.id.toString(),
            code,
            userData: telegramUser,
            createdAt: new Date(),
            expiresAt,
            isUsed: false,
        };
        this.verificationCodes.set(code, verificationData);
        this.logger.log(`تم إنشاء رمز تحقق ${code} للمستخدم ${telegramUser.id}`);
        return {
            success: true,
            code,
            expiresAt,
            message: 'تم إنشاء رمز التحقق بنجاح',
        };
    }
    async handleVerificationCodeFromBot(telegramUser, code) {
        const verificationData = this.verificationCodes.get(code);
        if (verificationData && verificationData.telegramId === telegramUser.id.toString()) {
            verificationData.userData = { ...verificationData.userData, ...telegramUser };
            this.verificationCodes.set(code, verificationData);
            return {
                success: true,
                message: 'تم التحقق من الرمز، يمكنك الآن تسجيل الدخول في الموقع',
            };
        }
        return {
            success: false,
            message: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
        };
    }
    async registerUserFromBot(userData, ipAddress, userAgent) {
        try {
            let user = await this.userRepository.findOne({
                where: { telegramId: userData.telegramId || userData.id?.toString() },
            });
            if (!user) {
                user = await this.createNewUserFromBot(userData);
                await this.logActivity(user.id, user_activity_entity_1.ActivityType.ACCOUNT_CREATED, 'تسجيل مستخدم جديد من البوت', ipAddress, userAgent);
            }
            return {
                success: true,
                message: 'تم تسجيل المستخدم بنجاح',
                user: {
                    id: user.id,
                    telegramId: user.telegramId,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    referralCode: user.referralCode,
                },
            };
        }
        catch (error) {
            this.logger.error('خطأ في تسجيل المستخدم من البوت:', error);
            throw new common_1.BadRequestException('فشل في تسجيل المستخدم');
        }
    }
    async createUserFromVerification(verificationData, verifyCodeDto) {
        const userData = verificationData.userData || {};
        const user = this.userRepository.create({
            telegramId: verificationData.telegramId,
            username: verifyCodeDto.username || userData.username,
            firstName: verifyCodeDto.firstName || userData.firstName,
            lastName: verifyCodeDto.lastName || userData.lastName,
            languageCode: verifyCodeDto.languageCode || userData.language_code || 'ar',
            totalCoins: 100,
            miningRate: 1.0,
            level: 1,
            referralCode: this.generateReferralCode(),
            isActive: true,
            registeredAt: new Date(),
            lastLoginAt: new Date(),
        });
        return await this.userRepository.save(user);
    }
    async updateUserFromVerification(user, verificationData, verifyCodeDto) {
        const userData = verificationData.userData || {};
        if (verifyCodeDto.username || userData.username) {
            user.username = verifyCodeDto.username || userData.username;
        }
        if (verifyCodeDto.firstName || userData.firstName) {
            user.firstName = verifyCodeDto.firstName || userData.firstName;
        }
        if (verifyCodeDto.lastName || userData.lastName) {
            user.lastName = verifyCodeDto.lastName || userData.lastName;
        }
        if (verifyCodeDto.languageCode || userData.language_code) {
            user.languageCode = verifyCodeDto.languageCode || userData.language_code;
        }
        user.lastLoginAt = new Date();
        user.isActive = true;
        return await this.userRepository.save(user);
    }
    async createNewUserFromBot(userData) {
        const user = this.userRepository.create({
            telegramId: userData.telegramId || userData.id?.toString(),
            username: userData.username,
            firstName: userData.firstName || userData.firstName,
            lastName: userData.lastName || userData.lastName,
            languageCode: userData.languageCode || userData.language_code || 'ar',
            totalCoins: 100,
            miningRate: 1.0,
            level: 1,
            isActive: true,
            referralCode: this.generateReferralCode(),
            registeredAt: new Date(),
            lastLoginAt: new Date(),
        });
        return await this.userRepository.save(user);
    }
    generateVerificationCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    generateReferralCode() {
        return 'SC' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    cleanupExpiredCodes() {
        const now = new Date();
        const expiredCodes = [];
        this.verificationCodes.forEach((data, code) => {
            if (now > data.expiresAt) {
                expiredCodes.push(code);
            }
        });
        expiredCodes.forEach(code => {
            this.verificationCodes.delete(code);
        });
        if (expiredCodes.length > 0) {
            this.logger.log(`تم حذف ${expiredCodes.length} رمز تحقق منتهي الصلاحية`);
        }
    }
    async getPlatformStats() {
        try {
            const totalUsers = await this.userRepository.count();
            const activeUsers = await this.userRepository.count({ where: { isActive: true } });
            const totalCoins = await this.userRepository
                .createQueryBuilder('user')
                .select('SUM(user.totalCoins)', 'total')
                .getRawOne();
            return {
                totalUsers,
                activeUsers,
                totalCoinsInCirculation: totalCoins?.total || 0,
                platformCapital: '350,000,000',
                supportedLanguages: ['ar', 'en'],
                features: [
                    'تعدين ذكي',
                    'استثمار مربح',
                    'نظام إحالات',
                    'مهام يومية',
                    'عجلة الحظ',
                ],
            };
        }
        catch (error) {
            this.logger.error('خطأ في الحصول على إحصائيات المنصة:', error);
            throw new common_1.BadRequestException('فشل في الحصول على الإحصائيات');
        }
    }
    verifyTelegramAuth(data) {
        const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
        if (!botToken) {
            this.logger.warn('TELEGRAM_BOT_TOKEN غير محدد');
            return true;
        }
        const { hash, ...authData } = data;
        const dataCheckString = Object.keys(authData)
            .sort()
            .map(key => `${key}=${authData[key]}`)
            .join('\n');
        const secretKey = crypto.createHash('sha256').update(botToken).digest();
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');
        return calculatedHash === hash;
    }
    async updateExistingUser(user, telegramAuthDto) {
        user.username = telegramAuthDto.username || user.username;
        user.firstName = telegramAuthDto.first_name || user.firstName;
        user.lastName = telegramAuthDto.last_name || user.lastName;
        user.languageCode = telegramAuthDto.language_code || user.languageCode;
        user.lastLoginAt = new Date();
        user.isActive = true;
        return await this.userRepository.save(user);
    }
    async createNewUser(telegramAuthDto) {
        const user = this.userRepository.create({
            telegramId: telegramAuthDto.id.toString(),
            username: telegramAuthDto.username,
            firstName: telegramAuthDto.first_name,
            lastName: telegramAuthDto.last_name,
            languageCode: telegramAuthDto.language_code || 'ar',
            totalCoins: 100,
            miningRate: 1.0,
            level: 1,
            referralCode: this.generateReferralCode(),
            isActive: true,
            registeredAt: new Date(),
            lastLoginAt: new Date(),
        });
        return await this.userRepository.save(user);
    }
    async getUserProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['activities', 'referrals'],
        });
        if (!user) {
            throw new common_1.NotFoundException('المستخدم غير موجود');
        }
        const referralCount = await this.referralRepository.count({
            where: { referrerId: userId },
        });
        return {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            totalCoins: user.totalCoins,
            miningRate: user.miningRate,
            level: user.level || 1,
            referralCode: user.referralCode,
            referralCount,
            registeredAt: user.registeredAt,
            lastLoginAt: user.lastLoginAt,
            isActive: user.isActive,
        };
    }
    async logout(userId, ipAddress, userAgent) {
        await this.logActivity(userId, user_activity_entity_1.ActivityType.LOGOUT, 'تسجيل خروج', ipAddress, userAgent);
    }
    async logActivity(userId, type, description, ipAddress, userAgent) {
        try {
            const activity = this.activityRepository.create({
                userId: userId,
                activityType: type,
                description,
                ipAddress,
                userAgent,
                createdAt: new Date(),
            });
            await this.activityRepository.save(activity);
        }
        catch (error) {
            this.logger.error('خطأ في تسجيل النشاط:', error);
        }
    }
    async validateJwtPayload(payload) {
        try {
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
            });
            if (!user || !user.isActive) {
                return null;
            }
            return user;
        }
        catch (error) {
            this.logger.error(`خطأ في التحقق من JWT: ${error.message}`);
            return null;
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