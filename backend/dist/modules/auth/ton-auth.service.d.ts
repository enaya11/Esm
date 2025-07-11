import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { WalletsService } from '../wallets/wallets.service';
export declare class TonAuthService {
    private readonly httpService;
    private readonly userRepository;
    private readonly walletsService;
    private readonly jwtService;
    private readonly configService;
    constructor(httpService: HttpService, userRepository: Repository<User>, walletsService: WalletsService, jwtService: JwtService, configService: ConfigService);
    verifyTonSignature(data: {
        walletAddress: string;
        publicKey: string;
        signature: string;
        payload: any;
    }): Promise<{
        success: boolean;
        user?: any;
        token?: string;
        message?: string;
    }>;
    private generateReferralCode;
    private validateTonAddress;
    private validatePublicKey;
    private verifySignature;
    private createMessageForSigning;
    private generateAuthToken;
    getWalletInfo(address: string): Promise<any>;
    handleTonConnect(data: {
        walletAddress: string;
        publicKey: string;
        timestamp: number;
    }): Promise<{
        success: boolean;
        user?: any;
        message?: string;
        token?: string;
    }>;
}
