import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { User } from '../../entities/user.entity';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('المصادقة')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول عبر تليجرام' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
  @ApiResponse({ status: 401, description: 'بيانات مصادقة غير صالحة' })
  async telegramAuth(@Body() telegramAuthDto: TelegramAuthDto, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return await this.authService.authenticateWithTelegram(
      telegramAuthDto,
      ipAddress,
      userAgent,
    );
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'التحقق من رمز التحقق من تليجرام' })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح وتسجيل الدخول' })
  @ApiResponse({ status: 401, description: 'رمز التحقق غير صحيح أو منتهي الصلاحية' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async verifyTelegramCode(@Body() verifyCodeDto: VerifyCodeDto, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return await this.authService.verifyTelegramCode(
      verifyCodeDto,
      ipAddress,
      userAgent,
    );
  }

  @Get('check-code')
  @ApiOperation({ summary: 'فحص حالة رمز التحقق' })
  @ApiQuery({ name: 'code', description: 'رمز التحقق', required: true })
  @ApiResponse({ status: 200, description: 'حالة الرمز' })
  async checkVerificationCode(@Query('code') code: string) {
    return await this.authService.checkVerificationCodeStatus(code);
  }

  @Post('telegram-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'استقبال تحديثات من بوت تليجرام' })
  @ApiResponse({ status: 200, description: 'تم معالجة التحديث بنجاح' })
  async telegramWebhook(@Body() update: any, @Req() req: any) {
    return await this.authService.handleTelegramWebhook(update);
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
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    await this.authService.logout(user.id, ipAddress, userAgent);

    return { message: 'تم تسجيل الخروج بنجاح' };
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
        level: user.level || 1,
        referralCode: user.referralCode,
        isActive: user.isActive,
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'إحصائيات المنصة العامة' })
  @ApiResponse({ status: 200, description: 'إحصائيات المنصة' })
  async getPlatformStats() {
    return await this.authService.getPlatformStats();
  }

  @Post('register-from-bot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل مستخدم جديد من البوت' })
  @ApiResponse({ status: 200, description: 'تم التسجيل بنجاح' })
  @ApiResponse({ status: 400, description: 'خطأ في البيانات' })
  async registerFromBot(@Body() userData: any, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return await this.authService.registerUserFromBot(
      userData,
      ipAddress,
      userAgent,
    );
  }
}

