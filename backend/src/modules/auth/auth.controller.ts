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
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { GenerateOtpDto } from './dto/generate-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { User } from '../../entities/user.entity';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('المصادقة')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('telegram/generate-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إنشاء رمز تحقق لتسجيل الدخول عبر تليجرام' })
  @ApiResponse({ status: 200, description: 'تم إرسال رمز التحقق بنجاح' })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  async generateTelegramOtp(@Body() generateOtpDto: GenerateOtpDto) {
    return await this.authService.generateTelegramOtp(generateOtpDto.telegramIdentifier);
  }

  @Post('telegram/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'التحقق من رمز OTP لتسجيل الدخول عبر تليجرام' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح' })
  @ApiResponse({ status: 400, description: 'رمز تحقق غير صالح أو منتهي الصلاحية' })
  async verifyTelegramOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    return await this.authService.verifyTelegramOtp(
      verifyOtpDto.telegramIdentifier,
      verifyOtpDto.otp,
      ipAddress,
      userAgent,
    );
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

  @Get('stats/:telegramId')
  @ApiOperation({ summary: 'الحصول على إحصائيات مستخدم معين' })
  @ApiResponse({ status: 200, description: 'إحصائيات المستخدم' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  async getUserStats(@Param('telegramId') telegramId: string) {
    return await this.authService.getUserStats(telegramId);
  }
}

