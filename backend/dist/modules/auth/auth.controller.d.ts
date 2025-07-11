import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { User } from '../../entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    telegramLogin(telegramAuthDto: TelegramAuthDto, req: any): Promise<{
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
            isActive: boolean;
        };
    }>;
    getUserStats(telegramId: string): Promise<{
        balance: number;
        mining_count: number;
        completed_tasks: number;
        referrals: number;
        level: number;
    }>;
}
