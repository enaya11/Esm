import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { ActivatedPackage } from './activated-package.entity';
import { Referral } from './referral.entity';
import { UserActivity } from './user-activity.entity';

@Entity('users')
@Index(['telegramId'], { unique: true })
@Index(['referralCode'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'telegram_id', type: 'bigint', unique: true, nullable: true })
  telegramId: number;

  @Column({ nullable: true })
  username: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ name: 'language_code', default: 'ar' })
  languageCode: string;

  @Column({ name: 'is_premium', default: false })
  isPremium: boolean;

  @Column({ name: 'login_method', default: 'telegram' })
  loginMethod: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'referral_code', unique: true, nullable: true })
  referralCode: string;

  @Column({ name: 'referred_by', nullable: true })
  referredBy: string;

  @Column({ name: 'total_coins', type: 'decimal', precision: 18, scale: 8, default: 0 })
  totalCoins: number;

  @Column({ name: 'mining_rate', default: 10 })
  miningRate: number;

  @Column({ name: 'last_claim', type: 'timestamp', nullable: true })
  lastClaim: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // العلاقات
  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => ActivatedPackage, package_ => package_.user)
  activatedPackages: ActivatedPackage[];

  @OneToMany(() => Referral, referral => referral.referrer)
  referrals: Referral[];

  @OneToMany(() => UserActivity, activity => activity.user)
  activities: UserActivity[];

  // الطرق المساعدة
  getFullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  canClaim(): boolean {
    if (!this.lastClaim) return true;
    
    const now = new Date();
    const lastClaim = new Date(this.lastClaim);
    const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastClaim >= 24; // يمكن المطالبة كل 24 ساعة
  }

  calculateClaimAmount(): number {
    const baseAmount = this.miningRate;
    const hoursMultiplier = this.getHoursSinceLastClaim();
    
    // الحد الأقصى 24 ساعة
    const maxHours = Math.min(hoursMultiplier, 24);
    
    return Math.floor(baseAmount * maxHours);
  }

  private getHoursSinceLastClaim(): number {
    if (!this.lastClaim) return 24; // إذا لم يطالب من قبل، اعطه 24 ساعة
    
    const now = new Date();
    const lastClaim = new Date(this.lastClaim);
    
    return (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
  }
}

