import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum PackageStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('activated_packages')
@Index(['userId'])
@Index(['status'])
@Index(['expiresAt'])
export class ActivatedPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'package_id' })
  packageId: number;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'mining_rate' })
  miningRate: number;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'enum', enum: PackageStatus, default: PackageStatus.ACTIVE })
  status: PackageStatus;

  @Column({ name: 'total_mined', type: 'decimal', precision: 18, scale: 8, default: 0 })
  totalMined: number;

  @Column({ name: 'days_active', default: 0 })
  daysActive: number;

  @CreateDateColumn({ name: 'activated_at' })
  activatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // العلاقات
  @ManyToOne(() => User, user => user.activatedPackages)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // الطرق المساعدة
  isActive(): boolean {
    return this.status === PackageStatus.ACTIVE && !this.isExpired();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  getRemainingDays(): number {
    if (this.isExpired()) return 0;
    
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  getPackageInfo() {
    const packages = {
      1: { 
        name: 'باقة أساسية', 
        rate: 20, 
        price: 1, 
        duration: 30,
        description: 'مثالية للمبتدئين',
        features: ['20 عملة يومياً', 'دعم فني أساسي', 'صالحة لمدة 30 يوم']
      },
      2: { 
        name: 'باقة متوسطة', 
        rate: 35, 
        price: 2, 
        duration: 30,
        description: 'للمستخدمين النشطين',
        features: ['35 عملة يومياً', 'دعم فني متقدم', 'مكافآت إضافية', 'صالحة لمدة 30 يوم']
      },
      3: { 
        name: 'باقة متقدمة', 
        rate: 50, 
        price: 5, 
        duration: 30,
        description: 'للمحترفين',
        features: ['50 عملة يومياً', 'دعم فني VIP', 'مكافآت حصرية', 'أولوية في المهام', 'صالحة لمدة 30 يوم']
      },
    };

    return packages[this.packageId] || null;
  }

  calculateDailyEarnings(): number {
    return this.miningRate;
  }

  calculateTotalPotentialEarnings(): number {
    const remainingDays = this.getRemainingDays();
    return this.miningRate * remainingDays;
  }

  getProgressPercentage(): number {
    const packageInfo = this.getPackageInfo();
    if (!packageInfo) return 0;

    const totalDays = packageInfo.duration;
    const elapsedDays = totalDays - this.getRemainingDays();
    
    return Math.min(100, (elapsedDays / totalDays) * 100);
  }

  shouldAutoExpire(): boolean {
    return this.isExpired() && this.status === PackageStatus.ACTIVE;
  }
}

