import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class PurchaseMiningPackageDto {
    @IsString()
    @IsNotEmpty()
    packageId: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['TON', 'SOL'])
    currency: 'TON' | 'SOL';
}