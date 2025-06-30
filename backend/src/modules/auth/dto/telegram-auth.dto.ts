import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class TelegramAuthDto {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  language_code?: string;

  @IsOptional()
  @IsBoolean()
  is_premium?: boolean;

  @IsString()
  auth_date: string;

  @IsString()
  hash: string;

  @IsOptional()
  @IsString()
  start_parameter?: string; // كود الإحالة
}

