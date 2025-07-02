import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthEnhancedService } from './auth_enhanced.service';
import { User } from '../../entities/user.entity';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('المصادقة المحسنة')
@Controller('auth')
export class AuthEnhancedController {
  constructor(private readonly authService: AuthEnhancedService) {}

  @Post('telegram-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول عبر تليجرام المحسن' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  @ApiResponse({ status: 401, description: 'فشل في المصادقة' })
  async telegramLogin(@Body() telegramData: any, @Req() req: any) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // التحقق من وجود البيانات المطلوبة
      if (!telegramData.telegram_id) {
        throw new BadRequestException('معرف التليجرام مطلوب');
      }

      return await this.authService.telegramLogin(telegramData, ipAddress, userAgent);
    } catch (error) {
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على ملف المستخدم الشخصي' })
  @ApiResponse({ status: 200, description: 'تم الحصول على البيانات بنجاح' })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  async getProfile(@GetUser() user: User) {
    return await this.authService.getUserProfile(user.id);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الخروج' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الخروج بنجاح' })
  async logout(@GetUser() user: User, @Req() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return await this.authService.logout(user.id, ipAddress, userAgent);
  }

  @Get('verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'التحقق من صحة التوكن' })
  @ApiResponse({ status: 200, description: 'التوكن صالح' })
  @ApiResponse({ status: 401, description: 'التوكن غير صالح' })
  async verifyToken(@GetUser() user: User) {
    return {
      valid: true,
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

  @Get('stats/:telegramId')
  @ApiOperation({ summary: 'الحصول على إحصائيات المستخدم' })
  @ApiResponse({ status: 200, description: 'تم الحصول على الإحصائيات بنجاح' })
  async getUserStats(@Param('telegramId') telegramId: string) {
    return await this.authService.getUserStats(telegramId);
  }

  @Post('mining-notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إرسال إشعار التعدين' })
  @ApiResponse({ status: 200, description: 'تم إرسال الإشعار بنجاح' })
  async sendMiningNotification(@Body() data: { telegramId: number; amount: number }) {
    try {
      await this.authService.sendMiningNotification(data.telegramId.toString(), data.amount);
      return { success: true, message: 'تم إرسال إشعار التعدين بنجاح' };
    } catch (error) {
      return { success: false, message: 'فشل في إرسال الإشعار' };
    }
  }

  @Post('task-notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إرسال إشعار إكمال المهمة' })
  @ApiResponse({ status: 200, description: 'تم إرسال الإشعار بنجاح' })
  async sendTaskNotification(@Body() data: { telegramId: number; taskName: string; reward: number }) {
    try {
      await this.authService.sendTaskCompletionNotification(data.telegramId.toString(), data.taskName, data.reward);
      return { success: true, message: 'تم إرسال إشعار المهمة بنجاح' };
    } catch (error) {
      return { success: false, message: 'فشل في إرسال الإشعار' };
    }
  }

  @Post('test-telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'اختبار الاتصال مع تليجرام' })
  @ApiResponse({ status: 200, description: 'تم الاختبار بنجاح' })
  async testTelegram(@Body() data: { telegramId: number; message: string }) {
    try {
      // إرسال رسالة اختبار
      await this.authService["sendTelegramMessage"](data.telegramId.toString(), data.message);
      return { success: true, message: 'تم إرسال رسالة الاختبار بنجاح' };
    } catch (error) {
      return { success: false, message: 'فشل في إرسال رسالة الاختبار', error: error.message };
    }
  }

  @Get('user/:telegramId')
  @ApiOperation({ summary: 'البحث عن مستخدم بمعرف التليجرام' })
  @ApiResponse({ status: 200, description: 'تم العثور على المستخدم' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async getUserByTelegramId(@Param('telegramId') telegramId: string) {
    try {
      const profile = await this.authService.getUserStats(telegramId);
      return { success: true, user: profile };
    } catch (error) {
      return { success: false, message: 'المستخدم غير موجود' };
    }
  }
}

