import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateWalletDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  tonAddress: string;

  @IsOptional()
  @IsString()
  internalAddress?: string;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  privateKey?: string;

  @IsOptional()
  @IsNumber()
  balance?: number;
}

