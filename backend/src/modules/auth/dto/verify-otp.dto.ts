import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    telegramIdentifier: string;

    @IsString()
    @IsNotEmpty()
    otp: string;
}