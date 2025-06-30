import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order, Currency } from './order.entity';

@Entity('confirmed_transactions')
@Index(['transactionHash'], { unique: true })
@Index(['orderId'])
export class ConfirmedTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'transaction_hash', unique: true })
  transactionHash: string;

  @Column({ name: 'from_address' })
  fromAddress: string;

  @Column({ name: 'to_address' })
  toAddress: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: number;

  @Column({ type: 'enum', enum: Currency, enumName: 'currency_enum' }) // ✅ التعديل المهم هنا
  currency: Currency;

  @Column({ name: 'block_number', type: 'bigint', nullable: true })
  blockNumber: number;

  @Column({ name: 'gas_used', type: 'bigint', nullable: true })
  gasUsed: number;

  @Column({ name: 'gas_price', type: 'decimal', precision: 18, scale: 8, nullable: true })
  gasPrice: number;

  @Column({ name: 'network_fee', type: 'decimal', precision: 18, scale: 8, nullable: true })
  networkFee: number;

  @Column({ name: 'confirmation_count', default: 0 })
  confirmationCount: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'confirmed_at' })
  confirmedAt: Date;

  @OneToOne(() => Order, order => order.confirmedTransaction)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  getExplorerUrl(): string {
    if (this.currency === Currency.TON) {
      return `https://tonscan.org/tx/${this.transactionHash}`;
    } else if (this.currency === Currency.SOL) {
      return `https://solscan.io/tx/${this.transactionHash}`;
    }
    return '';
  }

  isFullyConfirmed(): boolean {
    const requiredConfirmations = this.currency === Currency.TON ? 1 : 32;
    return this.confirmationCount >= requiredConfirmations;
  }

  calculateNetAmount(): number {
    return this.amount - (this.networkFee || 0);
  }
}