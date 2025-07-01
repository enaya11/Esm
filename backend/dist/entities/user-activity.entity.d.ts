import { User } from './user.entity';
export declare enum ActivityType {
    ACCOUNT_CREATED = "account_created",
    LOGIN = "login",
    LOGOUT = "logout",
    COINS_CLAIMED = "coins_claimed",
    PACKAGE_PURCHASED = "package_purchased",
    PACKAGE_ACTIVATED = "package_activated",
    REFERRAL_MADE = "referral_made",
    REFERRAL_BONUS_RECEIVED = "referral_bonus_received",
    TASK_COMPLETED = "task_completed",
    WITHDRAWAL_REQUESTED = "withdrawal_requested",
    WITHDRAWAL_COMPLETED = "withdrawal_completed",
    SECURITY_EVENT = "security_event",
    ADMIN_ACTION = "admin_action"
}
export declare class UserActivity {
    id: number;
    userId: string;
    activityType: ActivityType;
    description: string;
    metadata: any;
    ipAddress: string;
    userAgent: string;
    amount: number;
    referenceId: string;
    createdAt: Date;
    user: User;
    getActivityIcon(): string;
    getActivityTitle(): string;
    isRecentActivity(): boolean;
    isCriticalActivity(): boolean;
    getFormattedAmount(): string;
    getTimeAgo(): string;
}
