import { Injectable, UnauthorizedException, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { User } from '../../entities/user.entity';
import { UserActivity, ActivityType } from '../../entities/user-activity.entity';
import { Referral } from '../../entities/referral.entity';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// إنتيتي جديدة لرموز التحقق
interface VerificationCode {
  id?: number;
  userId?: number;
  telegramId: string;
  code: string;
  userData?: any;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private verificationCodes: Map<string, VerificationCode> = new Map();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,

    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // تنظيف رموز التحقق المنتهية الصلاحية كل 5 دقائق
    setInterval(() => {
      this.cleanupExpiredCodes();
    }, 5 * 60 * 1000);
  }

  // مصادقة المستخدم عبر تليجرام (الطريقة القديمة)
  async authenticateWithTelegram(
    telegramAuthDto: TelegramAuthDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    try {
      if (!this.verifyTelegramAuth(telegramAuthDto)) {
        throw new UnauthorizedException('بيانات مصادقة تليجرام غير صالحة');
      }

      let user = await this.userRepository.findOne({
        where: { telegramId: telegramAuthDto.id.toString() },
      });

      if (user) {
        user = await this.updateExistingUser(user, telegramAuthDto);
      } else {
        user = await this.createNewUser(telegramAuthDto);
      }

      await this.logActivity(user.id, ActivityType.LOGIN, 'تسجيل دخول عبر تليجرام', ipAddress, userAgent);

      const payload: JwtPayload = {
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
    } catch (error) {
      this.logger.error('خطأ في مصادقة تليجرام:', error);
      throw error;
    }
  }

  // التحقق من رمز التحقق من تليجرام (الطريقة الجديدة)
  async verifyTelegramCode(
    verifyCodeDto: VerifyCodeDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
    try {
      const { code } = verifyCodeDto;

      // البحث عن رمز التحقق
      const verificationData = this.verificationCodes.get(code);

      if (!verificationData) {
        throw new UnauthorizedException('رمز التحقق غير صحيح أو غير موجود');
      }

      // التحقق من انتهاء الصلاحية
      if (new Date() > verificationData.expiresAt) {
        this.verificationCodes.delete(code);
        throw new UnauthorizedException('رمز التحقق منتهي الصلاحية');
      }

      // التحقق من الاستخدام السابق
      if (verificationData.isUsed) {
        throw new UnauthorizedException('رمز التحقق مستخدم بالفعل');
      }

      // البحث عن المستخدم أو إنشاؤه
      let user = await this.userRepository.findOne({
        where: { telegramId: verificationData.telegramId },
      });

      if (!user) {
        // إنشاء مستخدم جديد
        user = await this.createUserFromVerification(verificationData, verifyCodeDto);
      } else {
        // تحديث بيانات المستخدم الموجود
        user = await this.updateUserFromVerification(user, verificationData, verifyCodeDto);
      }

      // تحديد الرمز كمستخدم
      verificationData.isUsed = true;
      this.verificationCodes.set(code, verificationData);

      // تسجيل النشاط
      await this.logActivity(user.id, ActivityType.LOGIN, 'تسجيل دخول عبر رمز التحقق', ipAddress, userAgent);

      // إنشاء JWT
      const payload: JwtPayload = {
        sub: user.id,
        telegramId: user.telegramId,
        username: user.username,
      };

      const accessToken = this.jwtService.sign(payload);

      // حذف الرمز بعد الاستخدام
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
    } catch (error) {
      this.logger.error('خطأ في التحقق من الرمز:', error);
      throw error;
    }
  }

  // فحص حالة رمز التحقق
  async checkVerificationCodeStatus(code: string): Promise<any> {
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
      timeLeft: Math.floor(timeLeft / 1000), // بالثواني
      createdAt: verificationData.createdAt,
      expiresAt: verificationData.expiresAt,
    };
  }

  // معالجة webhook من بوت تليجرام
  async handleTelegramWebhook(update: any): Promise<any> {
    try {
      this.logger.log('تم استلام تحديث من بوت تليجرام:', JSON.stringify(update));

      // معالجة رسائل البوت
      if (update.message) {
        const message = update.message;
        const user = message.from;
        const text = message.text;

        // معالجة أمر /start أو /login
        if (text === '/start' || text === '/login') {
          return await this.handleLoginRequest(user);
        }

        // معالجة رموز التحقق المرسلة
        if (text && text.length === 8 && /^[A-Z0-9]+$/.test(text)) {
          return await this.handleVerificationCodeFromBot(user, text);
        }
      }

      return { success: true, message: 'تم معالجة التحديث' };
    } catch (error) {
      this.logger.error('خطأ في معالجة webhook:', error);
      return { success: false, error: error.message };
    }
  }

  // معالجة طلب تسجيل الدخول من البوت
  private async handleLoginRequest(telegramUser: any): Promise<any> {
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق

    const verificationData: VerificationCode = {
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

  // معالجة رمز التحقق المرسل من البوت
  private async handleVerificationCodeFromBot(telegramUser: any, code: string): Promise<any> {
    const verificationData = this.verificationCodes.get(code);

    if (verificationData && verificationData.telegramId === telegramUser.id.toString()) {
      // تحديث بيانات المستخدم في رمز التحقق
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

  // تسجيل مستخدم من البوت
  async registerUserFromBot(userData: any, ipAddress?: string, userAgent?: string): Promise<any> {
    try {
      let user = await this.userRepository.findOne({
        where: { telegramId: userData.telegramId || userData.id?.toString() },
      });

      if (!user) {
        user = await this.createNewUserFromBot(userData);
        await this.logActivity(user.id, ActivityType.ACCOUNT_CREATED, 'تسجيل مستخدم جديد من البوت', ipAddress, userAgent);
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
    } catch (error) {
      this.logger.error('خطأ في تسجيل المستخدم من البوت:', error);
      throw new BadRequestException('فشل في تسجيل المستخدم');
    }
  }

  // إنشاء مستخدم جديد من بيانات التحقق
  private async createUserFromVerification(verificationData: VerificationCode, verifyCodeDto: VerifyCodeDto): Promise<User> {
    const userData = verificationData.userData || {};

    const user = this.userRepository.create({
      telegramId: verificationData.telegramId,
      username: verifyCodeDto.username || userData.username,
      firstName: verifyCodeDto.firstName || userData.firstName,
      lastName: verifyCodeDto.lastName || userData.lastName,
      languageCode: verifyCodeDto.languageCode || userData.language_code || 'ar',
      totalCoins: 100, // مكافأة التسجيل
      miningRate: 1.0,
      level: 1,
      referralCode: this.generateReferralCode(),
      isActive: true,
      registeredAt: new Date(), // استخدام registeredAt بدلاً من registrationDate
      lastLoginAt: new Date(),
    });

    return await this.userRepository.save(user);
  }

  // تحديث مستخدم موجود من بيانات التحقق
  private async updateUserFromVerification(user: User, verificationData: VerificationCode, verifyCodeDto: VerifyCodeDto): Promise<User> {
    const userData = verificationData.userData || {};

    // تحديث البيانات إذا كانت متوفرة
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

  // إنشاء مستخدم جديد من البوت
  private async createNewUserFromBot(userData: any): Promise<User> {
    const user = this.userRepository.create({
      telegramId: userData.telegramId || userData.id?.toString(),
      username: userData.username,
      firstName: userData.firstName || userData.firstName,
      lastName: userData.lastName || userData.lastName,
      languageCode: userData.languageCode || userData.language_code || 'ar',
      totalCoins: 100, // مكافأة التسجيل
      miningRate: 1.0,
      level: 1,
      isActive: true,
      referralCode: this.generateReferralCode(),
      registeredAt: new Date(),
      lastLoginAt: new Date(),
    });

    return await this.userRepository.save(user);
  }

  // توليد رمز تحقق عشوائي
  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // توليد رمز إحالة
  private generateReferralCode(): string {
    return 'SC' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // تنظيف رموز التحقق المنتهية الصلاحية
  private cleanupExpiredCodes(): void {
    const now = new Date();
    const expiredCodes: string[] = [];

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

  // الحصول على إحصائيات المنصة
  async getPlatformStats(): Promise<any> {
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
        platformCapital: '350,000,000', // 350 مليون دولار
        supportedLanguages: ['ar', 'en'],
        features: [
          'تعدين ذكي',
          'استثمار مربح',
          'نظام إحالات',
          'مهام يومية',
          'عجلة الحظ',
        ],
      };
    } catch (error) {
      this.logger.error('خطأ في الحصول على إحصائيات المنصة:', error);
      throw new BadRequestException('فشل في الحصول على الإحصائيات');
    }
  }

  // باقي الدوال الموجودة...

  private verifyTelegramAuth(data: TelegramAuthDto): boolean {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN غير محدد');
      return true; // للتطوير فقط
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

  private async updateExistingUser(user: User, telegramAuthDto: TelegramAuthDto): Promise<User> {
    user.username = telegramAuthDto.username || user.username;
    user.firstName = telegramAuthDto.first_name || user.firstName;
    user.lastName = telegramAuthDto.last_name || user.lastName;
    user.languageCode = telegramAuthDto.language_code || user.languageCode;
    user.lastLoginAt = new Date();
    user.isActive = true;

    return await this.userRepository.save(user);
  }

  private async createNewUser(telegramAuthDto: TelegramAuthDto): Promise<User> {
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
      registeredAt: new Date(), // استخدام registeredAt بدلاً من registrationDate
      lastLoginAt: new Date(),
    });

    return await this.userRepository.save(user);
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activities', 'referrals'],
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
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

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logActivity(userId, ActivityType.LOGOUT, 'تسجيل خروج', ipAddress, userAgent);
  }

  private async logActivity(
    userId: string,
    type: ActivityType,
    description: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
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
    } catch (error) {
      this.logger.error('خطأ في تسجيل النشاط:', error);
    }
  }

  async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`خطأ في التحقق من JWT: ${error.message}`);
      return null;
    }
  }
}


