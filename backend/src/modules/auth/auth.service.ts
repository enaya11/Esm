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
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly botToken: string;
  private readonly otpStore = new Map<string, { code: string; expiresAt: number; userId: string }>(); // In-memory OTP store

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
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')!;
    if (!this.botToken) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not defined in configuration.');
      throw new Error('TELEGRAM_BOT_TOKEN is not defined.');
    }
  }

  /**
   * Validates Telegram login data and authenticates the user.
   */
  async telegramLogin(
    telegramAuthDto: TelegramAuthDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.logger.log(`Attempting Telegram login for user: ${telegramAuthDto.username || telegramAuthDto.id}`);

    const { id, auth_date, hash, ...data } = telegramAuthDto;

    // Verify the data received from Telegram
    const checkString = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(this.botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (hmac !== hash) {
      this.logger.warn(`Invalid Telegram hash for user ID: ${id}`);
      throw new UnauthorizedException('بيانات تيليجرام غير صالحة.');
    }

    // Check if the authentication data is too old (e.g., 1 hour)
    if (Date.now() / 1000 - Number(auth_date) > 3600) { // Explicitly cast auth_date to Number
      this.logger.warn(`Outdated Telegram auth data for user ID: ${id}`);
      throw new UnauthorizedException('بيانات المصادقة منتهية الصلاحية.');
    }

    let user = await this.userRepository.findOne({ where: { telegramId: id.toString() } });

    if (user) {
      // Update existing user
      user = await this.updateExistingUser(user, telegramAuthDto);
      this.logger.log(`Existing user logged in: ${user.telegramId}`);
    } else {
      // Create new user
      user = await this.createNewUser(telegramAuthDto);
      this.logger.log(`New user registered via Telegram: ${user.telegramId}`);
      await this.sendWelcomeMessage(user.telegramId, user.firstName || user.username);
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      username: user.username,
    };
    const accessToken = this.jwtService.sign(payload);

    // Log login activity
    await this.logUserActivity(
      user.id,
      ActivityType.LOGIN,
      ipAddress,
      userAgent,
      { method: 'telegram' }
    );

    // Send login success notification via bot
    await this.sendLoginSuccessNotification(user.telegramId);

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

  /**
   * يولد رمز OTP ويرسله إلى المستخدم عبر تيليجرام.
   */
  async generateTelegramOtp(telegramIdentifier: string) {
    this.logger.log(`محاولة توليد OTP للمعرف: ${telegramIdentifier}`);

    // Find user by username or telegramId (assuming telegramIdentifier can be either)
    let user = await this.userRepository.findOne({
      where: [
        { username: telegramIdentifier },
        { telegramId: telegramIdentifier },
      ],
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود. يرجى بدء المحادثة مع البوت أولاً.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

    this.otpStore.set(telegramIdentifier, { code: otp, expiresAt, userId: user.id });
    this.logger.log(`تم توليد OTP للمستخدم ${telegramIdentifier}: ${otp}`);

    try {
      await this.sendTelegramMessage(user.telegramId, `رمز التحقق الخاص بك هو: ${otp}\n\nهذا الرمز صالح لمدة 5 دقائق.`);
      this.logger.log(`تم إرسال OTP إلى المستخدم ${telegramIdentifier}`);
      return { success: true, message: 'تم إرسال رمز التحقق بنجاح.' };
    } catch (error) {
      this.logger.error(`فشل إرسال OTP إلى ${telegramIdentifier}: ${error.message}`);
      throw new BadRequestException('فشل إرسال رمز التحقق. يرجى التأكد من أنك بدأت المحادثة مع البوت.');
    }
  }

  /**
   * يتحقق من رمز OTP ويسجل دخول المستخدم.
   */
  async verifyTelegramOtp(telegramIdentifier: string, otp: string, ipAddress?: string, userAgent?: string) {
    this.logger.log(`محاولة التحقق من OTP للمعرف: ${telegramIdentifier}`);

    const storedOtpData = this.otpStore.get(telegramIdentifier);

    if (!storedOtpData || storedOtpData.code !== otp) {
      throw new BadRequestException('رمز التحقق غير صحيح.');
    }

    if (Date.now() > storedOtpData.expiresAt) {
      this.otpStore.delete(telegramIdentifier); // Clear expired OTP
      throw new BadRequestException('رمز التحقق منتهي الصلاحية.');
    }

    // OTP is valid, proceed with login/registration
    let user = await this.userRepository.findOne({
      where: { id: storedOtpData.userId },
    });

    if (!user) {
      // This case should ideally not happen if userId from otpStore is reliable
      throw new UnauthorizedException('المستخدم غير موجود.');
    }

    // Update user's last login time and active status
    user.lastLoginAt = new Date();
    user.isActive = true;
    await this.userRepository.save(user);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      username: user.username,
    };
    const accessToken = this.jwtService.sign(payload);

    // Log login activity
    await this.logUserActivity(
      user.id,
      ActivityType.LOGIN,
      ipAddress,
      userAgent,
      { method: 'telegram-otp' }
    );

    // Clear the used OTP
    this.otpStore.delete(telegramIdentifier);

    // Send login success notification via bot
    await this.sendLoginSuccessNotification(user.telegramId);

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
  private async sendWelcomeMessage(telegramId: string | number, firstName: string) {
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
  private async sendLoginSuccessNotification(telegramId: string | number) {
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
  private async sendReferralNotification(telegramId: string | number, referralName: string, bonus: number) {
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
  public async sendTelegramMessage(chatId: string | number, message: string) {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      await axios.post(url, {
        chat_id: chatId,
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
