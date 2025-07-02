import { HttpService } from '@nestjs/axios';
export declare class TonAuthService {
    private readonly httpService;
    constructor(httpService: HttpService);
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
    }>;
}
