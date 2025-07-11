import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { UserActivity } from '../../entities/user-activity.entity';
import { Referral } from '../../entities/referral.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
export declare class AuthService {
    private readonly userRepository;
    private readonly activityRepository;
    private readonly referralRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly botToken;
    constructor(userRepository: Repository<User>, activityRepository: Repository<UserActivity>, referralRepository: Repository<Referral>, jwtService: JwtService, configService: ConfigService);
    telegramLogin(telegramData: any, ipAddress?: string, userAgent?: string): Promise<{
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
    private updateExistingUser;
    private createNewUser;
    private processReferral;
    private logUserActivity;
    private generateReferralCode;
    private sendWelcomeMessage;
    private sendLoginSuccessNotification;
    private sendReferralNotification;
    private sendTelegramMessage;
    logout(userId: string, ipAddress?: string, userAgent?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUserProfile(userId: string): Promise<{
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
    verifyToken(payload: JwtPayload): Promise<User>;
    getUserStats(telegramId: string): Promise<{
        balance: number;
        mining_count: number;
        completed_tasks: number;
        referrals: number;
        level: number;
    }>;
    sendMiningNotification(telegramId: string | number, amount: number): Promise<void>;
    sendTaskCompletionNotification(telegramId: string | number, taskName: string, reward: number): Promise<void>;
}
