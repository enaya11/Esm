import { Module } from '@nestjs/common';
import { TonPaymentService } from './ton-payment/ton-payment.service';
import { SolanaPaymentService } from './solana-payment/solana-payment.service';

@Module({
  providers: [TonPaymentService, SolanaPaymentService]
})
export class PaymentModule {}
