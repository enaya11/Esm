import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  /**
   * إنشاء محفظة جديدة
   */
  @Post()
  @UseGuards(AuthGuard)
  async createWallet(@Body() createWalletDto: CreateWalletDto) {
    try {
      const wallet = await this.walletsService.createWallet(
        createWalletDto.userId,
        createWalletDto.tonAddress,
      );
      
      return {
        success: true,
        wallet,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'فشل في إنشاء محفظة جديدة',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * الحصول على محفظة المستخدم
   */
  @Get('user/:userId')
  @UseGuards(AuthGuard)
  async getWalletByUserId(@Param('userId') userId: string) {
    try {
      const wallet = await this.walletsService.getWalletByUserId(userId);
      
      if (!wallet) {
        throw new HttpException(
          'المحفظة غير موجودة',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return {
        success: true,
        wallet,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'فشل في الحصول على محفظة المستخدم',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * الحصول على محفظة بواسطة عنوان TON
   */
  @Get('ton/:tonAddress')
  @UseGuards(AuthGuard)
  async getWalletByTonAddress(@Param('tonAddress') tonAddress: string) {
    try {
      const wallet = await this.walletsService.getWalletByTonAddress(tonAddress);
      
      if (!wallet) {
        throw new HttpException(
          'المحفظة غير موجودة',
          HttpStatus.NOT_FOUND,
        );
      }
      
      return {
        success: true,
        wallet,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'فشل في الحصول على محفظة بواسطة عنوان TON',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * تحديث محفظة المستخدم
   */
  @Put('user/:userId')
  @UseGuards(AuthGuard)
  async updateWallet(
    @Param('userId') userId: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    try {
      const wallet = await this.walletsService.updateWallet(userId, updateWalletDto);
      
      return {
        success: true,
        wallet,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'فشل في تحديث محفظة المستخدم',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * تحديث رصيد المحفظة
   */
  @Put('user/:userId/balance')
  @UseGuards(AuthGuard)
  async updateBalance(
    @Param('userId') userId: string,
    @Body() body: { amount: number },
  ) {
    try {
      const wallet = await this.walletsService.updateBalance(userId, body.amount);
      
      return {
        success: true,
        wallet,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'فشل في تحديث رصيد المحفظة',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

