import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../entities/user.entity';
import { PurchaseMiningPackageDto } from './dto/purchase-mining-package.dto';
import { PurchaseGiftCardDto } from './dto/purchase-gift-card.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('المتجر')
@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @Get('packages')
    @ApiOperation({ summary: 'الحصول على جميع حزم التعدين وبطاقات الهدايا المتاحة' })
    @ApiResponse({ status: 200, description: 'تم استرجاع الحزم بنجاح' })
    async getPackages() {
        return this.storeService.getPackages();
    }

    @Post('purchase-mining-package')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'شراء حزمة تعدين' })
    @ApiResponse({ status: 200, description: 'تم بدء عملية الشراء بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة أو رصيد غير كافٍ' })
    @ApiResponse({ status: 401, description: 'غير مصرح' })
    async purchaseMiningPackage(
        @GetUser() user: User,
        @Body() purchaseMiningPackageDto: PurchaseMiningPackageDto,
    ) {
        return this.storeService.purchaseMiningPackage(
            user.id,
            purchaseMiningPackageDto.packageId,
            purchaseMiningPackageDto.currency,
        );
    }

    @Post('purchase-gift-card')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'شراء بطاقة هدية' })
    @ApiResponse({ status: 200, description: 'تم شراء بطاقة الهدية بنجاح' })
    @ApiResponse({ status: 400, description: 'بيانات غير صالحة أو رصيد غير كافٍ' })
    @ApiResponse({ status: 401, description: 'غير مصرح' })
    async purchaseGiftCard(
        @GetUser() user: User,
        @Body() purchaseGiftCardDto: PurchaseGiftCardDto,
    ) {
        return this.storeService.purchaseGiftCard(
            user.id,
            purchaseGiftCardDto.giftCardId,
        );
    }

    @Post('confirm-payment')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'تأكيد دفع حزمة التعدين' })
    @ApiResponse({ status: 200, description: 'تم تأكيد الدفع وتفعيل الباقة بنجاح' })
    @ApiResponse({ status: 400, description: 'فشل التحقق من الدفع أو بيانات غير صالحة' })
    @ApiResponse({ status: 401, description: 'غير مصرح' })
    @ApiResponse({ status: 404, description: 'الطلب غير موجود' })
    async confirmPayment(
        @GetUser() user: User,
        @Body() confirmPaymentDto: ConfirmPaymentDto,
    ) {
        return this.storeService.confirmMiningPackagePayment(
            user.id,
            confirmPaymentDto.transactionId,
        );
    }
}