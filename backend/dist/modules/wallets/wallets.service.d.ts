import { Repository } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity';
import { UpdateWalletDto } from './dto/update-wallet.dto';
export declare class WalletsService {
    private readonly walletRepository;
    constructor(walletRepository: Repository<Wallet>);
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
