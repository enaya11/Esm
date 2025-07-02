import { Model } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { UpdateWalletDto } from './dto/update-wallet.dto';
export declare class WalletsService {
    private readonly walletModel;
    constructor(walletModel: Model<Wallet>);
    createWallet(userId: string, tonAddress: string): Promise<Wallet>;
    getWalletByUserId(userId: string): Promise<Wallet | null>;
    getWalletByTonAddress(tonAddress: string): Promise<Wallet | null>;
    updateWallet(userId: string, updateWalletDto: UpdateWalletDto): Promise<Wallet>;
    updateBalance(userId: string, amount: number): Promise<Wallet>;
    private generateInternalAddress;
    private generateWalletKeys;
    private encryptPrivateKey;
    private decryptPrivateKey;
}
