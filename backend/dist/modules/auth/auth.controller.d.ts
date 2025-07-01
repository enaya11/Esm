import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { User } from '../../entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    telegramAuth(telegramAuthDto: TelegramAuthDto, req: any): Promise<{
        user: {
            id: string;
            telegramId: number;
            username: string;
            firstName: string;
            lastName: string;
            languageCode: string;
            isPremium: boolean;
            loginMethod: string;
            isActive: boolean;
            referralCode: string;
            referredBy: string;
            totalCoins: number;
            miningRate: number;
            lastClaim: Date;
            lastLogin: Date;
            createdAt: Date;
            updatedAt: Date;
            orders: import("../../entities/order.entity").Order[];
            activatedPackages: import("../../entities/activated-package.entity").ActivatedPackage[];
            referrals: import("../../entities/referral.entity").Referral[];
            activities: import("../../entities/user-activity.entity").UserActivity[];
        };
        token: string;
    }>;
    getProfile(user: User): Promise<{
        user: {
            id: string;
            telegramId: number;
            username: string;
            firstName: string;
            lastName: string;
            languageCode: string;
            isPremium: boolean;
            loginMethod: string;
            isActive: boolean;
            referralCode: string;
            referredBy: string;
            totalCoins: number;
            miningRate: number;
            lastClaim: Date;
            lastLogin: Date;
            createdAt: Date;
            updatedAt: Date;
            orders: import("../../entities/order.entity").Order[];
            activatedPackages: import("../../entities/activated-package.entity").ActivatedPackage[];
            referrals: import("../../entities/referral.entity").Referral[];
            activities: import("../../entities/user-activity.entity").UserActivity[];
        };
        referralStats: {
            totalReferrals: number;
            totalRewards: number;
            weeklyReferrals: number;
            monthlyReferrals: number;
            recentReferrals: import("../../entities/referral.entity").Referral[];
        };
    }>;
    logout(user: User, req: any): Promise<{
        message: string;
    }>;
    verifyToken(user: User): Promise<{
        valid: boolean;
        user: {
            id: string;
            telegramId: number;
            username: string;
            firstName: string;
            lastName: string;
            totalCoins: number;
            miningRate: number;
        };
    }>;
}
