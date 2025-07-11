import { User } from './user.entity';
export declare class Wallet {
    id: string;
    userId: string;
    tonAddress: string;
    internalAddress: string;
    publicKey: string;
    privateKey: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
