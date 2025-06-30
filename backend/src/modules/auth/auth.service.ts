import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { User } from '../../entities/user.entity';
import { UserActivity, ActivityType } from '../../entities/user-activity.entity';
import { Referral } from '../../entities/referral.entity';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,

    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  // مصادقة المستخدم عبر تليجرام
  async authenticateWithTelegram(
    telegramAuthDto: TelegramAuthDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      if (!this.verifyTelegramAuth(telegramAuthDto)) {
        throw new UnauthorizedException('بيانات مصادقة تليجرام غير صالحة');
      }

      let user = await this.userRepository.findOne({
        where: { telegramId: telegramAuthDto.id },
      });

      if (user) {
        user = await this.updateExistingUser(user, telegramAuthDto);
      } else {
        user = await this.createNewUser(telegramAuthDto);
      }

      await this.logActivity(
        user.id,
        ActivityType.LOGIN,
        'تسجيل دخول عبر تليجرام',
        { telegramId: telegramAuthDto.id },
        ipAddress,
        userAgent,
      );

      const token = await this.generateJwtToken(user);

      this.logger.log(`تم تسجيل دخول المستخدم بنجاح: ${user.id}`);

      return {
        user: this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      this.logger.error(`خطأ في مصادقة تليجرام: ${error.message}`);
      throw error;
    }
  }

  // التحقق من صحة JWT token
  async validateJwtPayload(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('مستخدم غير موجود أو غير نشط');
    }

    return user;
  }

  // تسجيل خروج المستخدم
  async logout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logActivity(
      userId,
      ActivityType.LOGOUT,
      'تسجيل خروج',
      {},
      ipAddress,
      userAgent,
    );
    this.logger.log(`تم تسجيل خروج المستخدم: ${userId}`);
  }

  // الحصول على ملف المستخدم الشخصي
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['activatedPackages', 'referrals'],
    });

    if (!user) {
      throw new BadRequestException('مستخدم غير موجود');
    }

    const referralStats = await this.getReferralStats(userId);

    return {
      user: this.sanitizeUser(user),
      referralStats,
    };
  }

  // التحقق من صحة بيانات مصادقة تليجرام
  private verifyTelegramAuth(authData: TelegramAuthDto): boolean {
    try {
      const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
      if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is missing!');

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
    } catch (error) {
      this.logger.error(`خطأ في التحقق من مصادقة تليجرام: ${error.message}`);
      return false;
    }
  }

  // تحديث معلومات المستخدم الموجود
  private async updateExistingUser(
    user: User,
    telegramAuthDto: TelegramAuthDto,
  ): Promise<User> {
    user.username = telegramAuthDto.username ?? user.username ?? '';
    user.firstName = telegramAuthDto.first_name ?? user.firstName ?? '';
    user.lastName = telegramAuthDto.last_name ?? user.lastName ?? '';
    user.languageCode = telegramAuthDto.language_code ?? user.languageCode;
    user.isPremium = telegramAuthDto.is_premium ?? user.isPremium;
    user.lastLogin = new Date();
    return await this.userRepository.save(user);
  }

  // إنشاء مستخدم جديد
  private async createNewUser(telegramAuthDto: TelegramAuthDto): Promise<User> {
    const user = new User();
    user.telegramId = telegramAuthDto.id;
    user.username = telegramAuthDto.username ?? '';
    user.firstName = telegramAuthDto.first_name ?? '';
    user.lastName = telegramAuthDto.last_name ?? '';
    user.languageCode = telegramAuthDto.language_code ?? 'ar';
    user.isPremium = telegramAuthDto.is_premium ?? false;
    user.referralCode = this.generateReferralCode();
    user.lastLogin = new Date();

    const savedUser = await this.userRepository.save(user);

    await this.logActivity(
      savedUser.id,
      ActivityType.ACCOUNT_CREATED,
      'تم إنشاء حساب جديد عبر تليجرام',
      { telegramId: telegramAuthDto.id },
    );

    if (telegramAuthDto.start_parameter) {
      await this.processReferral(savedUser.id, telegramAuthDto.start_parameter);
    }

    this.logger.log(`تم إنشاء مستخدم جديد: ${savedUser.id}`);

    return savedUser;
  }

  // معالجة الإحالة
  private async processReferral(
    newUserId: string,
    referralCode: string,
  ): Promise<void> {
    try {
      const referrer = await this.userRepository.findOne({
        where: { referralCode },
      });

      if (referrer && referrer.id !== newUserId) {
        const referral = new Referral();
        referral.referrerId = referrer.id;
        referral.referredId = newUserId;

        const rewardAmount = this.configService.get<number>('REFERRAL_BONUS');
        if (rewardAmount === undefined) {
          throw new Error('REFERRAL_BONUS is not defined in environment variables');
        }

        referral.rewardAmount = rewardAmount;
        referral.rewardGiven = true;
        await this.referralRepository.save(referral);

        referrer.totalCoins += referral.rewardAmount;
        await this.userRepository.save(referrer);

        await this.userRepository.update(newUserId, { referredBy: referrer.id });

        await this.logActivity(
          referrer.id,
          ActivityType.REFERRAL_BONUS_RECEIVED,
          'تم استلام مكافأة إحالة',
          { referredUserId: newUserId, amount: referral.rewardAmount },
        );

        await this.logActivity(
          newUserId,
          ActivityType.REFERRAL_MADE,
          'تم الانضمام عبر إحالة',
          { referrerId: referrer.id },
        );

        this.logger.log(`تم معالجة إحالة: ${referrer.id} -> ${newUserId}`);
      }
    } catch (error) {
      this.logger.error(`خطأ في معالجة الإحالة: ${error.message}`);
    }
  }

  // إنشاء JWT token
  private async generateJwtToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      username: user.username,
    };
    return this.jwtService.sign(payload);
  }

  // إنشاء كود إحالة فريد
  private generateReferralCode(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${randomPart}`.toUpperCase();
  }

  // تسجيل نشاط المستخدم
  private async logActivity(
    userId: string,
    activityType: ActivityType,
    description: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
    amount?: number,
    referenceId?: string,
  ): Promise<void> {
    try {
      const activity = new UserActivity();
      activity.userId = userId;
      activity.activityType = activityType;
      activity.description = description;
      activity.metadata = metadata;

      // حل مشكلة القيم الاختيارية
      if (ipAddress) activity.ipAddress = ipAddress;
      if (userAgent) activity.userAgent = userAgent;
      if (amount) activity.amount = amount;
      if (referenceId) activity.referenceId = referenceId;

      await this.activityRepository.save(activity);
    } catch (error) {
      this.logger.error(`خطأ في تسجيل النشاط: ${error.message}`);
    }
  }

  // الحصول على إحصائيات الإحالات
  private async getReferralStats(userId: string) {
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

  // تنظيف بيانات المستخدم للإرسال
  private sanitizeUser(user: User) {
    const { ...sanitizedUser } = user;
    return sanitizedUser;
  }
}