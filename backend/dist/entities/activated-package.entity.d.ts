import { User } from './user.entity';
export declare enum PackageStatus {
    ACTIVE = "active",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare class ActivatedPackage {
    id: number;
    userId: string;
    packageId: number;
    orderId: string;
    miningRate: number;
    expiresAt: Date;
    status: PackageStatus;
    totalMined: number;
    daysActive: number;
    activatedAt: Date;
    updatedAt: Date;
    user: User;
    isActive(): boolean;
    isExpired(): boolean;
    getRemainingDays(): number;
    getPackageInfo(): any;
    calculateDailyEarnings(): number;
    calculateTotalPotentialEarnings(): number;
    getProgressPercentage(): number;
    shouldAutoExpire(): boolean;
}
