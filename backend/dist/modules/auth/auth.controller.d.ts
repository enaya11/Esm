import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { User } from '../../entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    telegramAuth(telegramAuthDto: TelegramAuthDto, req: any): Promise<any>;
    verifyTelegramCode(verifyCodeDto: VerifyCodeDto, req: any): Promise<any>;
    checkVerificationCode(code: string): Promise<any>;
    telegramWebhook(update: any, req: any): Promise<any>;
    getProfile(user: User): Promise<any>;
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
    getPlatformStats(): Promise<any>;
    registerFromBot(userData: any, req: any): Promise<any>;
}
