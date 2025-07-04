import { Document } from 'mongoose';
export declare class Wallet extends Document {
    userId: string;
    tonAddress: string;
    internalAddress: string;
    publicKey: string;
    privateKey: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WalletSchema: import("mongoose").Schema<Wallet, import("mongoose").Model<Wallet, any, any, any, Document<unknown, any, Wallet, any> & Wallet & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Wallet, Document<unknown, {}, import("mongoose").FlatRecord<Wallet>, {}> & import("mongoose").FlatRecord<Wallet> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
