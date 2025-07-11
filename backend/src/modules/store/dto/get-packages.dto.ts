import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class MiningPackageDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsNumber()
    rate: number;

    @IsNumber()
    priceUSD: number;

    @IsNumber()
    priceTON: number;

    @IsNumber()
    priceSOL: number;
}

export class GiftCardDto {
    @IsString()
    id: string;

    @IsString()
    name: string;

    @IsNumber()
    valueUSD: number;

    @IsNumber()
    priceSM: number;

    @IsBoolean()
    isLocked: boolean;

    @IsOptional()
    @IsNumber()
    remainingUnlockTimeMs?: number;
}

export class GetPackagesResponseDto {
    miningPackages: MiningPackageDto[];
    giftCards: GiftCardDto[];
}