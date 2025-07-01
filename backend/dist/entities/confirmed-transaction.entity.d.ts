import { Order, Currency } from './order.entity';
export declare class ConfirmedTransaction {
    id: number;
    orderId: string;
    transactionHash: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    currency: Currency;
    blockNumber: number;
    gasUsed: number;
    gasPrice: number;
    networkFee: number;
    confirmationCount: number;
    isVerified: boolean;
    confirmedAt: Date;
    order: Order;
    getExplorerUrl(): string;
    isFullyConfirmed(): boolean;
    calculateNetAmount(): number;
}
