import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  tonAddress?: string;

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

