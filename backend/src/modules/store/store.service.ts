import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Wallet } from '../../entities/wallet.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import { ActivatedPackage } from '../../entities/activated-package.entity';
import { AuthService } from '../auth/auth.service';
import { TonPaymentService } from '../payment/ton-payment/ton-payment.service';
import { SolanaPaymentService } from '../payment/solana-payment/solana-payment.service';
import * as crypto from 'crypto';

@Injectable()
export class StoreService {
    private readonly logger = new Logger(StoreService.name);
    private readonly miningPackages = [
        { id: 'package1', name: 'باقة أساسية', rate: 20, priceUSD: 1, priceTON: 0.32, priceSOL: 0.0075 },
        { id: 'package2', name: 'باقة متوسطة', rate: 35, priceUSD: 2, priceTON: 0.64, priceSOL: 0.015 },
        { id: 'package3', name: 'باقة متقدمة', rate: 50, priceUSD: 5, priceTON: 1.6, priceSOL: 0.0375 },
    ];
    private readonly giftCards = [
        { id: 'google_play_10', name: 'بطاقة Google Play', valueUSD: 10, priceSM: 500 },
        { id: 'amazon_10', name: 'بطاقة Amazon', valueUSD: 10, priceSM: 500 },
        { id: 'google_play_25', name: 'بطاقة Google Play', valueUSD: 25, priceSM: 1200 },
        { id: 'amazon_25', name: 'بطاقة Amazon', valueUSD: 25, priceSM: 1200 },
        { id: 'google_play_50', name: 'بطاقة Google Play', valueUSD: 50, priceSM: 2300 },
        { id: 'amazon_50', name: 'بطاقة Amazon', valueUSD: 50, priceSM: 2300 },
    ];
    private readonly giftCardsUnlockDays = 40; // Days after launchDate for gift cards to unlock
    private readonly launchDate = new Date('2025-05-01T00:00:00Z'); // Example launch date

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(ActivatedPackage)
        private readonly activatedPackageRepository: Repository<ActivatedPackage>,
        private readonly authService: AuthService,
        private readonly tonPaymentService: TonPaymentService,
        private readonly solanaPaymentService: SolanaPaymentService,
    ) { }

    /**
     * Get all available mining packages and gift cards.
     */
    async getPackages() {
        const now = new Date();
        const unlockDate = new Date(this.launchDate);
        unlockDate.setDate(unlockDate.getDate() + this.giftCardsUnlockDays);
        const areGiftCardsLocked = now < unlockDate;

        const remainingTime = areGiftCardsLocked ? Math.max(0, unlockDate.getTime() - now.getTime()) : 0;

        return {
            miningPackages: this.miningPackages,
            giftCards: this.giftCards.map(card => ({
                ...card,
                isLocked: areGiftCardsLocked,
                remainingUnlockTimeMs: remainingTime,
            })),
        };
    }

    /**
     * Purchase a mining package.
     */
    async purchaseMiningPackage(userId: string, packageId: string, currency: 'TON' | 'SOL') {
        this.logger.log(`User ${userId} attempting to purchase mining package ${packageId} with ${currency}`);

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('المستخدم غير موجود.');
        }

        const packageDetails = this.miningPackages.find(pkg => pkg.id === packageId);
        if (!packageDetails) {
            throw new BadRequestException('حزمة تعدين غير صالحة.');
        }

        const amountUSD = packageDetails.priceUSD;
        let paymentAddress: string;
        let amountCrypto: number;

        if (currency === 'TON') {
            paymentAddress = this.tonPaymentService.tonWalletAddress;
            amountCrypto = packageDetails.priceTON;
        } else if (currency === 'SOL') {
            paymentAddress = this.solanaPaymentService.solanaWalletAddress;
            amountCrypto = packageDetails.priceSOL;
        } else {
            throw new BadRequestException('عملة دفع غير مدعومة.');
        }

        // Create a pending order in the database
        const order = this.orderRepository.create({
            userId: user.id,
            itemType: 'mining_package',
            itemId: packageId,
            amountUSD: amountUSD,
            paymentCurrency: currency,
            paymentAmountCrypto: amountCrypto,
            paymentAddress: paymentAddress,
            status: OrderStatus.PENDING, // Use enum
            transactionId: this.generateUniqueTransactionId(), // Generate unique ID for tracking
            createdAt: new Date(),
        } as Order);
        await this.orderRepository.save(order);

        // Send payment instructions to the user via Telegram bot
        const message = `✅ تم إنشاء طلب شراء لحزمة "${packageDetails.name}".\n\nيرجى تحويل ${amountCrypto.toFixed(4)} ${currency} إلى العنوان التالي لإتمام الشراء:\n\`${paymentAddress}\`\n\nمعرف الطلب: \`${order.transactionId}\`\n\nسيتم تفعيل الباقة تلقائياً بعد تأكيد الدفع.`;
        await this.authService.sendTelegramMessage(user.telegramId, message);

        return {
            success: true,
            message: 'تم إنشاء طلب الشراء بنجاح. يرجى إتمام الدفع.',
            orderId: order.id,
            transactionId: order.transactionId,
            paymentDetails: {
                currency,
                amount: amountCrypto,
                address: paymentAddress,
            },
        };
    }

    /**
     * Confirm a mining package payment.
     */
    async confirmMiningPackagePayment(userId: string, transactionId: string) {
        this.logger.log(`User ${userId} attempting to confirm mining package payment for transaction ID: ${transactionId}`);

        const order = await this.orderRepository.findOne({ where: { transactionId, userId, status: OrderStatus.PENDING } });
        if (!order) {
            throw new NotFoundException('الطلب غير موجود أو تم تأكيده بالفعل.');
        }

        let isPaymentVerified = false;
        if (order.paymentCurrency === 'TON') {
            isPaymentVerified = await this.tonPaymentService.verifyTonPayment(order.transactionId, order.paymentAmountCrypto);
        } else if (order.paymentCurrency === 'SOL') {
            isPaymentVerified = await this.solanaPaymentService.verifySolanaPayment(order.transactionId, order.paymentAmountCrypto);
        } else {
            throw new BadRequestException('عملة دفع غير مدعومة لهذا الطلب.');
        }

        if (!isPaymentVerified) {
            // Optionally, update order status to FAILED or keep PENDING for retry
            // For now, we'll just throw an error
            throw new BadRequestException('لم يتم تأكيد الدفع بعد أو فشل التحقق.');
        }

        // Payment confirmed, activate package and update order status
        order.status = OrderStatus.COMPLETED;
        order.updatedAt = new Date();
        await this.orderRepository.save(order);

        const user = await this.userRepository.findOne({ where: { id: userId } });
        const packageDetails = this.miningPackages.find(pkg => pkg.id === order.itemId);

        if (user && packageDetails) {
            const activatedPackage = this.activatedPackageRepository.create({
                userId: user.id,
                packageId: packageDetails.id,
                miningRate: packageDetails.rate,
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month duration
            });
            await this.activatedPackageRepository.save(activatedPackage);

            // Send success notification via Telegram bot
            const message = `🎉 تم تفعيل حزمة التعدين "${packageDetails.name}" بنجاح!`;
            await this.authService.sendTelegramMessage(user.telegramId, message);
        }

        return {
            success: true,
            message: 'تم تأكيد الدفع وتفعيل حزمة التعدين بنجاح.',
        };
    }

    /**
     * Purchase a gift card using internal SmartCoin balance.
     */
    async purchaseGiftCard(userId: string, giftCardId: string) {
        this.logger.log(`User ${userId} attempting to purchase gift card ${giftCardId}`);

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('المستخدم غير موجود.');
        }

        const giftCardDetails = this.giftCards.find(card => card.id === giftCardId);
        if (!giftCardDetails) {
            throw new BadRequestException('بطاقة هدية غير صالحة.');
        }

        // Check if gift cards are locked
        const now = new Date();
        const unlockDate = new Date(this.launchDate);
        unlockDate.setDate(unlockDate.getDate() + this.giftCardsUnlockDays);
        if (now < unlockDate) {
            throw new BadRequestException('بطاقات الهدايا مقفلة حالياً. يرجى الانتظار حتى تاريخ الإطلاق.');
        }

        // Check user's balance
        const userWallet = await this.walletRepository.findOne({ where: { userId: user.id } });
        if (!userWallet || userWallet.balance < giftCardDetails.priceSM) {
            throw new BadRequestException('رصيد SmartCoin غير كافٍ لشراء هذه البطاقة.');
        }

        // Deduct balance
        userWallet.balance -= giftCardDetails.priceSM;
        await this.walletRepository.save(userWallet);

        // Generate and store gift card code
        const giftCode = this.generateGiftCardCode();
        // In a real application, you would store this code securely and mark it as used.
        // For now, we'll just return it.
        this.logger.log(`Generated gift card code for ${user.username}: ${giftCode}`);

        // Record the purchase as an order
        const order = this.orderRepository.create({
            userId: user.id,
            itemType: 'gift_card',
            itemId: giftCardId,
            amountUSD: giftCardDetails.valueUSD,
            paymentCurrency: 'SM',
            paymentAmountCrypto: giftCardDetails.priceSM,
            status: OrderStatus.COMPLETED, // Use enum
            transactionId: this.generateUniqueTransactionId(),
            metadata: { giftCode: giftCode },
            createdAt: new Date(),
        } as Order); // Cast to Order
        await this.orderRepository.save(order);

        // Send success notification via Telegram bot
        const message = `🎉 تم شراء بطاقة "${giftCardDetails.name}" بنجاح!\n\nرمز البطاقة: \`${giftCode}\`\n\nاستمتع بهديتك!`;
        await this.authService.sendTelegramMessage(user.telegramId, message);

        return {
            success: true,
            message: 'تم شراء بطاقة الهدية بنجاح.',
            giftCode: giftCode,
            newBalance: userWallet.balance,
        };
    }

    /**
     * Generate a unique transaction ID.
     */
    private generateUniqueTransactionId(): string {
        return `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    }

    /**
     * Generate a gift card code.
     */
    private generateGiftCardCode(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) {
                code += '-';
            }
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return code;
    }
}