import { TonAuthService } from './ton-auth.service';
export declare class TonAuthController {
    private readonly tonAuthService;
    constructor(tonAuthService: TonAuthService);
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
    validateSession(data: {
        session_id: string;
    }): Promise<{
        success: boolean;
    }>;
}
