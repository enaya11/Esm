import { IsString, IsNotEmpty } from 'class-validator';

export class PurchaseGiftCardDto {
    @IsString()
    @IsNotEmpty()
    giftCardId: string;
}