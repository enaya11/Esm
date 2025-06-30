import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('referrals')
@Index(['referrerId'])
@Index(['referredId'])
@Index(['createdAt'])
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'referrer_id' })
  referrerId: string;

  @Column({ name: 'referred_id' })
  referredId: string;

  @Column({ name: 'reward_given', default: false })
  rewardGiven: boolean;

  @Column({ name: 'reward_amount', type: 'decimal', precision: 18, scale: 8, default: 0 })
  rewardAmount: number;

  @Column({ name: 'level', default: 1 })
  level: number; // مستوى الإحالة (1 = مباشر، 2 = من الدرجة الثانية، إلخ)

  @Column({ name: 'bonus_percentage', type: 'decimal', precision: 5, scale: 2, default: 10.00 })
  bonusPercentage: number; // نسبة المكافأة

  @Column({ name: 'total_earned', type: 'decimal', precision: 18, scale: 8, default: 0 })
  totalEarned: number; // إجمالي ما تم كسبه من هذه الإحالة

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // العلاقات
  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referred_id' })
  referred: User;

  // الطرق المساعدة
  calculateReward(baseAmount: number): number {
    return (baseAmount * this.bonusPercentage) / 100;
  }

  getLevelInfo() {
    const levels = {
      1: { name: 'إحالة مباشرة', percentage: 10, color: '#FFD700' },
      2: { name: 'إحالة من الدرجة الثانية', percentage: 5, color: '#C0C0C0' },
      3: { name: 'إحالة من الدرجة الثالثة', percentage: 2, color: '#CD7F32' },
    };

    return levels[this.level] || { name: 'إحالة غير معروفة', percentage: 0, color: '#666666' };
  }

  canEarnFromReferred(): boolean {
    return this.isActive && this.rewardGiven;
  }

  getAgeInDays(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isNewReferral(): boolean {
    return this.getAgeInDays() <= 7; // جديد إذا كان أقل من أسبوع
  }
}

