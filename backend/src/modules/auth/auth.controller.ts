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
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { User } from '../../entities/user.entity';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('المصادقة')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('telegram-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول/التسجيل عبر تليجرام (للبوت والواجهة الأمامية)' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول/التسجيل بنجاح' })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  async telegramLogin(@Body() telegramAuthDto: TelegramAuthDto, @Req() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    return await this.authService.telegramLogin(
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

