import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
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
      },
    };
  }
}

