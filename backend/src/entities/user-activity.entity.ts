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

export enum ActivityType {
  ACCOUNT_CREATED = 'account_created',
  LOGIN = 'login',
  LOGOUT = 'logout',
  COINS_CLAIMED = 'coins_claimed',
  PACKAGE_PURCHASED = 'package_purchased',
  PACKAGE_ACTIVATED = 'package_activated',
  REFERRAL_MADE = 'referral_made',
  REFERRAL_BONUS_RECEIVED = 'referral_bonus_received',
  TASK_COMPLETED = 'task_completed',
  WITHDRAWAL_REQUESTED = 'withdrawal_requested',
  WITHDRAWAL_COMPLETED = 'withdrawal_completed',
  SECURITY_EVENT = 'security_event',
  ADMIN_ACTION = 'admin_action',
}

@Entity('user_activities')
@Index(['userId'])
@Index(['activityType'])
@Index(['createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'activity_type', type: 'enum', enum: ActivityType })
  activityType: ActivityType;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'amount', type: 'decimal', precision: 18, scale: 8, nullable: true })
  amount: number; // للأنشطة المتعلقة بالمبالغ

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string; // معرف مرجعي (مثل معرف الطلب أو المعاملة)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // العلاقات
  @ManyToOne(() => User, user => user.activities)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // الطرق المساعدة
  getActivityIcon(): string {
    const icons = {
      [ActivityType.ACCOUNT_CREATED]: '🎉',
      [ActivityType.LOGIN]: '🔐',
      [ActivityType.LOGOUT]: '👋',
      [ActivityType.COINS_CLAIMED]: '💰',
      [ActivityType.PACKAGE_PURCHASED]: '📦',
      [ActivityType.PACKAGE_ACTIVATED]: '✅',
      [ActivityType.REFERRAL_MADE]: '👥',
      [ActivityType.REFERRAL_BONUS_RECEIVED]: '🎁',
      [ActivityType.TASK_COMPLETED]: '✔️',
      [ActivityType.WITHDRAWAL_REQUESTED]: '💸',
      [ActivityType.WITHDRAWAL_COMPLETED]: '✅',
      [ActivityType.SECURITY_EVENT]: '🔒',
      [ActivityType.ADMIN_ACTION]: '⚙️',
    };

    return icons[this.activityType] || '📝';
  }

  getActivityTitle(): string {
    const titles = {
      [ActivityType.ACCOUNT_CREATED]: 'تم إنشاء الحساب',
      [ActivityType.LOGIN]: 'تسجيل دخول',
      [ActivityType.LOGOUT]: 'تسجيل خروج',
      [ActivityType.COINS_CLAIMED]: 'مطالبة بالعملات',
      [ActivityType.PACKAGE_PURCHASED]: 'شراء باقة',
      [ActivityType.PACKAGE_ACTIVATED]: 'تفعيل باقة',
      [ActivityType.REFERRAL_MADE]: 'إحالة جديدة',
      [ActivityType.REFERRAL_BONUS_RECEIVED]: 'مكافأة إحالة',
      [ActivityType.TASK_COMPLETED]: 'إكمال مهمة',
      [ActivityType.WITHDRAWAL_REQUESTED]: 'طلب سحب',
      [ActivityType.WITHDRAWAL_COMPLETED]: 'اكتمال السحب',
      [ActivityType.SECURITY_EVENT]: 'حدث أمني',
      [ActivityType.ADMIN_ACTION]: 'إجراء إداري',
    };

    return titles[this.activityType] || 'نشاط غير معروف';
  }

  isRecentActivity(): boolean {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);
    
    return diffHours <= 24; // نشاط حديث إذا كان خلال آخر 24 ساعة
  }

  isCriticalActivity(): boolean {
    const criticalActivities = [
      ActivityType.SECURITY_EVENT,
      ActivityType.WITHDRAWAL_REQUESTED,
      ActivityType.ADMIN_ACTION,
    ];

    return criticalActivities.includes(this.activityType);
  }

  getFormattedAmount(): string {
    if (!this.amount) return '';
    
    return `${this.amount.toFixed(2)} عملة`;
  }

  getTimeAgo(): string {
    const now = new Date();
    const diffTime = now.getTime() - this.createdAt.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    
    return this.createdAt.toLocaleDateString('ar-SA');
  }
}

