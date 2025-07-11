import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateOtpDto {
    @IsString()
    @IsNotEmpty()
    telegramIdentifier: string; // Can be username or phone number
}