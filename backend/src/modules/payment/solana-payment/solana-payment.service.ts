import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, TransactionResponse } from '@solana/web3.js';

@Injectable()
export class SolanaPaymentService {
    private readonly logger = new Logger(SolanaPaymentService.name);
    private readonly solanaRpcUrl: string;
    private readonly _solanaWalletAddress: string;
    private connection: Connection;

    constructor(private readonly configService: ConfigService) {
        this.solanaRpcUrl = this.configService.get<string>('SOLANA_RPC_URL')!;
        this._solanaWalletAddress = this.configService.get<string>('SOLANA_WALLET_ADDRESS')!;

        if (!this.solanaRpcUrl || !this._solanaWalletAddress) {
            this.logger.error('Solana RPC URL or wallet address are not configured.');
            throw new Error('Solana RPC URL or wallet address are not configured.');
        }
        this.connection = new Connection(this.solanaRpcUrl, 'confirmed');
    }

    public get solanaWalletAddress(): string {
        return this._solanaWalletAddress;
    }

    async verifySolanaPayment(transactionSignature: string, expectedAmount: number): Promise<boolean> {
        this.logger.log(`Verifying Solana payment for signature: ${transactionSignature}`);
        try {
            const transaction: TransactionResponse | null = await this.connection.getTransaction(transactionSignature, {
                commitment: 'confirmed',
            });

            if (!transaction) {
                this.logger.warn(`Solana transaction not found for signature: ${transactionSignature}`);
                return false;
            }

            // Check if the transaction was successful and meta exists
            if (transaction.meta?.err) {
                this.logger.warn(`Solana transaction failed for signature ${transactionSignature}: ${transaction.meta.err}`);
                return false;
            }

            if (!transaction.meta) {
                this.logger.warn(`Solana transaction meta is null for signature: ${transactionSignature}`);
                return false;
            }

            // Check recipient and amount
            const recipientPublicKey = new PublicKey(this.solanaWalletAddress);
            const postBalances = transaction.meta.postBalances;
            const preBalances = transaction.meta.preBalances;
            const accountKeys = transaction.transaction.message.accountKeys;

            const recipientIndex = accountKeys.findIndex(key => key.equals(recipientPublicKey));

            if (recipientIndex === -1) {
                this.logger.warn(`Recipient address ${this.solanaWalletAddress} not found in transaction accounts.`);
                return false;
            }

            // Calculate the change in balance for the recipient
            const balanceChange = postBalances[recipientIndex] - preBalances[recipientIndex];
            const amountSOL = balanceChange / 1e9; // Solana lamports to SOL

            if (amountSOL >= expectedAmount) {
                this.logger.log(`Solana payment verified for signature: ${transactionSignature}`);
                return true;
            } else {
                this.logger.warn(`Solana payment amount mismatch for signature ${transactionSignature}. Expected: ${expectedAmount}, Received: ${amountSOL}`);
                return false;
            }
        } catch (error) {
            this.logger.error(`Error verifying Solana payment for signature ${transactionSignature}: ${error.message}`);
            return false;
        }
    }
}
