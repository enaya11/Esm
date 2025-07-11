import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
export declare class WalletsController {
    private readonly walletsService;
    constructor(walletsService: WalletsService);
    createWallet(createWalletDto: CreateWalletDto): Promise<{
        success: boolean;
        wallet: import("../../entities/wallet.entity").Wallet;
    }>;
    getWalletByUserId(userId: string): Promise<{
        success: boolean;
        wallet: import("../../entities/wallet.entity").Wallet;
    }>;
    getWalletByTonAddress(tonAddress: string): Promise<{
        success: boolean;
        wallet: import("../../entities/wallet.entity").Wallet;
    }>;
    updateWallet(userId: string, updateWalletDto: UpdateWalletDto): Promise<{
        success: boolean;
        wallet: import("../../entities/wallet.entity").Wallet;
    }>;
    updateBalance(userId: string, body: {
        amount: number;
    }): Promise<{
        success: boolean;
        wallet: import("../../entities/wallet.entity").Wallet;
    }>;
}
