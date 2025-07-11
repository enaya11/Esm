import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmPaymentDto {
    @ApiProperty({ description: 'The unique transaction ID or signature from the payment gateway' })
    @IsString()
    @IsNotEmpty()
    transactionId: string;
}