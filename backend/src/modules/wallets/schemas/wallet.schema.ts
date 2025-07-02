import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Wallet extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  tonAddress: string;

  @Prop({ required: true, unique: true })
  internalAddress: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true })
  privateKey: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

