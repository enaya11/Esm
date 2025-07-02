import { AuthEnhancedService } from './auth_enhanced.service';
import { User } from '../../entities/user.entity';
export declare class AuthEnhancedController {
    private readonly authService;
    constructor(authService: AuthEnhancedService);
    telegramLogin(telegramData: any, req: any): Promise<{
        success: boolean;
        message: string;
        token: string;
        user: {
            id: string;
            telegramId: string;
            username: string;
            firstName: string;
            lastName: string;
            totalCoins: number;
            miningRate: number;
            level: number;
            referralCode: string;
        };
    }>;
    getProfile(user: User): Promise<{
        id: string;
        telegramId: string;
        username: string;
        firstName: string;
        lastName: string;
        totalCoins: number;
        miningRate: number;
        level: number;
        referralCode: string;
        registeredAt: Date;
        lastLoginAt: Date;
        isActive: boolean;
        referralCount: number;
    }>;
    logout(user: User, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyToken(user: User): Promise<{
        valid: boolean;
        user: {
            id: string;
            telegramId: string;
            username: string;
            firstName: string;
            lastName: string;
            totalCoins: number;
            miningRate: number;
            level: number;
            referralCode: string;
        };
    }>;
    getUserStats(telegramId: string): Promise<{
        balance: number;
        mining_count: number;
        completed_tasks: number;
        referrals: number;
        level: number;
    }>;
    sendMiningNotification(data: {
        telegramId: number;
        amount: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    sendTaskNotification(data: {
        telegramId: number;
        taskName: string;
        reward: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    testTelegram(data: {
        telegramId: number;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
    }>;
    getUserByTelegramId(telegramId: string): Promise<{
        success: boolean;
        user: {
            balance: number;
            mining_count: number;
            completed_tasks: number;
            referrals: number;
            level: number;
        };
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        user?: undefined;
    }>;
}
