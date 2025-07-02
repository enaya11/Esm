import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TonAuthService } from './ton-auth.service';

@Controller('auth')
export class TonAuthController {
  constructor(private readonly tonAuthService: TonAuthService) {}

  /**
   * التحقق من توقيع محفظة TON
   */
  @Post('verify-ton-signature')
  async verifyTonSignature(
    @Body()
    data: {
      walletAddress: string;
      publicKey: string;
      signature: string;
      payload: any;
    },
  ) {
    try {
      const result = await this.tonAuthService.verifyTonSignature(data);
      
      if (!result.success) {
        throw new HttpException(
          result.message || 'فشل التحقق من التوقيع',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'حدث خطأ أثناء التحقق من التوقيع',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * معالجة اتصال محفظة TON
   */
  @Post('ton-connect')
  async handleTonConnect(
    @Body()
    data: {
      walletAddress: string;
      publicKey: string;
      timestamp: number;
    },
  ) {
    try {
      const result = await this.tonAuthService.handleTonConnect(data);
      
      if (!result.success) {
        throw new HttpException(
          result.message || 'فشل معالجة اتصال TON',
          HttpStatus.BAD_REQUEST,
        );
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'حدث خطأ أثناء معالجة اتصال TON',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * التحقق من صحة جلسة المصادقة
   */
  @Post('validate-session')
  async validateSession(
    @Body()
    data: {
      session_id: string;
    },
  ) {
    // هذه الدالة يمكن تنفيذها لاحقاً للتحقق من صحة الجلسة
    return { success: true };
  }
}

