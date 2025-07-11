import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TonPaymentService {
    private readonly logger = new Logger(TonPaymentService.name);
    private readonly tonApiKey: string;
    private readonly tonApiEndpoint: string;
    private readonly _tonWalletAddress: string;

    constructor(private readonly configService: ConfigService) {
        this.tonApiKey = this.configService.get<string>('TON_API_KEY')!;
        this.tonApiEndpoint = this.configService.get<string>('TON_API_ENDPOINT')!;
        this._tonWalletAddress = this.configService.get<string>('TON_WALLET_ADDRESS')!;

        if (!this.tonApiKey || !this.tonApiEndpoint || !this._tonWalletAddress) {
            this.logger.error('TON API credentials or wallet address are not configured.');
            throw new Error('TON API credentials or wallet address are not configured.');
        }
    }

    public get tonWalletAddress(): string {
        return this._tonWalletAddress;
    }

    async verifyTonPayment(transactionId: string, expectedAmount: number): Promise<boolean> {
        this.logger.log(`Verifying TON payment for transaction ID: ${transactionId}`);
        try {
            const response = await axios.post(`${this.tonApiEndpoint}/getTransactions`, {
                address: this._tonWalletAddress,
                limit: 10, // Check recent transactions
                hash: transactionId, // Assuming transactionId is the hash
            }, {
                headers: {
                    'X-API-Key': this.tonApiKey,
                },
            });

            const transactions = response.data.result;
            if (!transactions || transactions.length === 0) {
                this.logger.warn(`No TON transactions found for hash: ${transactionId}`);
                return false;
            }

            const relevantTransaction = transactions.find(tx =>
                tx.in_msg &&
                tx.in_msg.source === this.tonWalletAddress && // Assuming source is the recipient
                parseFloat(tx.in_msg.value) / 1e9 >= expectedAmount // TON is in nanoTONs
            );

            if (relevantTransaction) {
                this.logger.log(`TON payment verified for transaction ID: ${transactionId}`);
                return true;
            } else {
                this.logger.warn(`TON payment not found or amount mismatch for transaction ID: ${transactionId}`);
                return false;
            }
        } catch (error) {
            this.logger.error(`Error verifying TON payment for transaction ID ${transactionId}: ${error.message}`);
            return false;
        }
    }
}
