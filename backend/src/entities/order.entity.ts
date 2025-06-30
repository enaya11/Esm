import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { ConfirmedTransaction } from './confirmed-transaction.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum Currency {
  TON = 'TON',
  SOL = 'SOL',
}

@Entity('orders')
@Index(['userId'])
@Index(['status'])
@Index(['expiresAt'])
export class Order {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'package_id' })
  packageId: number;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 10, scale: 2 })
  amountUsd: number;

  @Column({ name: 'amount_crypto', type: 'decimal', precision: 18, scale: 8 })
  amountCrypto: number;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column({ name: 'wallet_address' })
  walletAddress: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'transaction_hash', nullable: true })
  transactionHash: string;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // العلاقات
  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => ConfirmedTransaction, transaction => transaction.order)
  confirmedTransaction: ConfirmedTransaction;

  // الطرق المساعدة
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  canBeConfirmed(): boolean {
    return this.status === OrderStatus.PENDING && !this.isExpired();
  }

  getPackageInfo() {
    const packages = {
      1: { name: 'باقة أساسية', rate: 20, price: 1, duration: 30 },
      2: { name: 'باقة متوسطة', rate: 35, price: 2, duration: 30 },
      3: { name: 'باقة متقدمة', rate: 50, price: 5, duration: 30 },
    };

    return packages[this.packageId] || null;
  }

  getRemainingTime(): number {
    if (this.isExpired()) return 0;
    
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }
}

