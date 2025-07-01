import { User } from './user.entity';
export declare class Referral {
    id: number;
    referrerId: string;
    referredId: string;
    rewardGiven: boolean;
    rewardAmount: number;
    level: number;
    bonusPercentage: number;
    totalEarned: number;
    isActive: boolean;
    createdAt: Date;
    referrer: User;
    referred: User;
    calculateReward(baseAmount: number): number;
    getLevelInfo(): any;
    canEarnFromReferred(): boolean;
    getAgeInDays(): number;
    isNewReferral(): boolean;
}
