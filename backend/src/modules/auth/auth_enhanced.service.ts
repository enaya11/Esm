import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios from 'axios';

import { User } from '../../entities/user.entity';
import { UserActivity, ActivityType } from '../../entities/user-activity.entity';
import { Referral } from '../../entities/referral.entity';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthEnhancedService {
  private readonly logger = new Logger(AuthEnhancedService.name);
  private readonly botToken = '7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA';

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

  /**
   * تسجيل الدخول عبر تليجرام مع التحقق المحسن
   */
  async telegramLogin(telegramData: any, ipAddress?: string, userAgent?: string) {
    try {
      this.logger.log(`محاولة تسجيل دخول عبر تليجرام للمستخدم: ${telegramData.telegram_id}`);

      // التحقق من صحة البيانات
      if (!telegramData.telegram_id) {
        throw new BadRequestException('معرف التليجرام مطلوب');
      }

      // البحث عن المستخدم أو إنشاؤه
      let user = await this.userRepository.findOne({
        where: { telegramId: telegramData.telegram_id.toString() },
      });

      if (user) {
        // تحديث بيانات المستخدم الموجود
        user = await this.updateExistingUser(user, telegramData);
        this.logger.log(`تم تحديث بيانات المستخدم الموجود: ${user.telegramId}`);
      } else {
        // إنشاء مستخدم جديد
        user = await this.createNewUser(telegramData);
        this.logger.log(`تم إنشاء مستخدم جديد: ${user.telegramId}`);
        
        // إرسال رسالة ترحيب عبر البوت
        await this.sendWelcomeMessage(telegramData.telegram_id, telegramData.first_name);
      }

      // إنشاء JWT token
      const payload: JwtPayload = {
        sub: user.id,
        telegramId: user.telegramId,
        username: user.username,
      };

      const accessToken = this.jwtService.sign(payload);

      // تسجيل نشاط تسجيل الدخول
      await this.logUserActivity(
        user.id,
        ActivityType.LOGIN,
        ipAddress,
        userAgent,
        { method: 'telegram' }
      );

      // إرسال إشعار تسجيل دخول ناجح عبر البوت
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

    } catch (error) {
      this.logger.error(`خطأ في تسجيل الدخول عبر تليجرام: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * تحديث بيانات المستخدم الموجود
   */
  private async updateExistingUser(user: User, telegramData: any): Promise<User> {
    // تحديث البيانات الأساسية
    user.username = telegramData.username || user.username;
    user.firstName = telegramData.first_name || user.firstName;
    user.lastName = telegramData.last_name || user.lastName;
    user.languageCode = telegramData.language_code || user.languageCode;
    user.lastLoginAt = new Date();
    user.isActive = true;

    return await this.userRepository.save(user);
  }

  /**
   * إنشاء مستخدم جديد
   */
  private async createNewUser(telegramData: any): Promise<User> {
    const user = new User();
    user.telegramId = telegramData.telegram_id.toString();
    user.username = telegramData.username;
    user.firstName = telegramData.first_name;
    user.lastName = telegramData.last_name;
    user.languageCode = telegramData.language_code || 'ar';
    user.totalCoins = 100; // مكافأة التسجيل
    user.miningRate = 1.0;
    user.level = 1;
    user.referralCode = this.generateReferralCode();
    user.registeredAt = new Date();
    user.lastLoginAt = new Date();
    user.isActive = true;

    const savedUser = await this.userRepository.save(user);

    // معالجة الإحالة إذا وجدت
    if (telegramData.referral_code) {
      await this.processReferral(savedUser, telegramData.referral_code);
    }

    return savedUser;
  }

  /**
   * معالجة الإحالة
   */
  private async processReferral(newUser: User, referralCode: string) {
    try {
      const referrer = await this.userRepository.findOne({
        where: { referralCode: referralCode },
      });

      if (referrer && referrer.id !== newUser.id) {
        // إنشاء سجل الإحالة
        const referral = new Referral();
        referral.referrerId = referrer.id;
        referral.referredId = newUser.id;
        referral.rewardAmount = 50; // مكافأة الإحالة
        referral.createdAt = new Date();

        await this.referralRepository.save(referral);

        // إضافة المكافأة للمُحيل
        referrer.totalCoins += 50;
        await this.userRepository.save(referrer);

        // إرسال إشعار للمُحيل
        await this.sendReferralNotification(
          referrer.telegramId,
          newUser.firstName || newUser.username,
          50
        );

        this.logger.log(`تمت معالجة إحالة جديدة: ${referrer.telegramId} -> ${newUser.telegramId}`);
      }
    } catch (error) {
      this.logger.error(`خطأ في معالجة الإحالة: ${error.message}`);
    }
  }

  /**
   * تسجيل نشاط المستخدم
   */
  private async logUserActivity(
    userId: string,
    activityType: ActivityType,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ) {
    try {
      const activity = new UserActivity();
      activity.userId = userId.toString();
      activity.activityType = activityType;
      if (ipAddress) activity.ipAddress = ipAddress;
      if (userAgent) activity.userAgent = userAgent;
      activity.metadata = metadata;
      activity.createdAt = new Date();

      await this.activityRepository.save(activity);
    } catch (error) {
      this.logger.error(`خطأ في تسجيل النشاط: ${error.message}`);
    }
  }

  /**
   * إنشاء كود إحالة فريد
   */
  private generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * إرسال رسالة ترحيب عبر البوت
   */
  private async sendWelcomeMessage(telegramId: number, firstName: string) {
    try {
      const message = `🎉 مرحباً ${firstName}!\n\nتم تسجيل حسابك بنجاح في SmartCoin!\n\n💰 حصلت على 100 عملة SM كمكافأة تسجيل\n🚀 ابدأ التعدين الآن واحصل على المزيد من العملات!`;
      
      await this.sendTelegramMessage(telegramId, message);
    } catch (error) {
      this.logger.error(`خطأ في إرسال رسالة الترحيب: ${error.message}`);
    }
  }

  /**
   * إرسال إشعار تسجيل دخول ناجح
   */
  private async sendLoginSuccessNotification(telegramId: number) {
    try {
      const message = `✅ تم تسجيل دخولك بنجاح!\n\n🚀 يمكنك الآن الوصول إلى جميع ميزات SmartCoin`;
      
      await this.sendTelegramMessage(telegramId, message);
    } catch (error) {
      this.logger.error(`خطأ في إرسال إشعار تسجيل الدخول: ${error.message}`);
    }
  }

  /**
   * إرسال إشعار الإحالة
   */
  private async sendReferralNotification(telegramId: string, referralName: string, bonus: number) {
    try {
      const message = `👥 إحالة جديدة!\n\n🎉 انضم ${referralName} عبر رابط الإحالة الخاص بك\n💰 حصلت على ${bonus} عملة SM كمكافأة\n\n🔗 شارك رابطك مع المزيد من الأصدقاء!`;
      
      await this.sendTelegramMessage(telegramId, message);
    } catch (error) {
      this.logger.error(`خطأ في إرسال إشعار الإحالة: ${error.message}`);
    }
  }

  /**
   * إرسال رسالة عبر تليجرام
   */
  private async sendTelegramMessage(telegramId: string | number, message: string) {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      await axios.post(url, {
        chat_id: telegramId,
        text: message,
        parse_mode: 'Markdown'
      });
      
    } catch (error) {
      this.logger.error(`خطأ في إرسال رسالة تليجرام: ${error.message}`);
    }
  }

  /**
   * تسجيل الخروج
   */
  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    try {
      // تسجيل نشاط تسجيل الخروج
      await this.logUserActivity(
        userId,
        ActivityType.LOGOUT,
        ipAddress,
        userAgent
      );

      this.logger.log(`تم تسجيل خروج المستخدم: ${userId}`);

      return {
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      };

    } catch (error) {
      this.logger.error(`خطأ في تسجيل الخروج: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * الحصول على ملف المستخدم
   */
  async getUserProfile(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['referrals', 'activities']
      });

      if (!user) {
        throw new UnauthorizedException('المستخدم غير موجود');
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

    } catch (error) {
      this.logger.error(`خطأ في الحصول على ملف المستخدم: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * التحقق من صحة التوكن
   */
  async verifyToken(payload: JwtPayload) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('المستخدم غير موجود أو غير نشط');
      }

      return user;

    } catch (error) {
      this.logger.error(`خطأ في التحقق من التوكن: ${error.message}`, error.stack);
      throw new UnauthorizedException('توكن غير صالح');
    }
  }

  /**
   * الحصول على إحصائيات المستخدم
   */
  async getUserStats(telegramId: string) {
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

      // حساب عدد مرات التعدين
      const miningCount = user.activities?.filter(
        activity => activity.activityType === ActivityType.MINING
      ).length || 0;

      // حساب المهام المكتملة
      const completedTasks = user.activities?.filter(
        activity => activity.activityType === ActivityType.TASK_COMPLETED
      ).length || 0;

      return {
        balance: user.totalCoins,
        mining_count: miningCount,
        completed_tasks: completedTasks,
        referrals: user.referrals?.length || 0,
        level: user.level
      };

    } catch (error) {
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

  /**
   * إرسال إشعار التعدين
   */
  async sendMiningNotification(telegramId: string | number, amount: number) {
    try {
      const message = `🔨 تم التعدين بنجاح!\n\n💰 حصلت على ${amount} عملة SM\n\n🚀 استمر في التعدين يومياً للحصول على المزيد!`;
      
      await this.sendTelegramMessage(telegramId, message);
    } catch (error) {
      this.logger.error(`خطأ في إرسال إشعار التعدين: ${error.message}`);
    }
  }

  /**
   * إرسال إشعار إكمال المهمة
   */
  async sendTaskCompletionNotification(telegramId: string | number, taskName: string, reward: number) {
    try {
      const message = `🎯 مهمة مكتملة!\n\n✅ أكملت مهمة: ${taskName}\n💰 حصلت على ${reward} عملة SM\n\n🏆 تابع إكمال المهام للحصول على المزيد من المكافآت!`;
      
      await this.sendTelegramMessage(telegramId, message);
    } catch (error) {
      this.logger.error(`خطأ في إرسال إشعار إكمال المهمة: ${error.message}`);
    }
  }
}

