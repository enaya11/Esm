import { User } from './user.entity';
import { ConfirmedTransaction } from './confirmed-transaction.entity';
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare enum Currency {
    TON = "TON",
    SOL = "SOL"
}
export declare class Order {
    id: string;
    userId: string;
    packageId: number;
    amountUsd: number;
    amountCrypto: number;
    currency: Currency;
    walletAddress: string;
    status: OrderStatus;
    transactionHash: string;
    confirmedAt: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    confirmedTransaction: ConfirmedTransaction;
    isExpired(): boolean;
    canBeConfirmed(): boolean;
    getPackageInfo(): any;
    getRemainingTime(): number;
}
