import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsOptional, IsNumber } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({
    description: 'رمز التحقق المرسل من بوت تليجرام',
    example: 'ABC12345',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'رمز التحقق يجب أن يكون 8 أحرف بالضبط' })
  code: string;

  @ApiProperty({
    description: 'معرف المستخدم في تليجرام (اختياري)',
    example: 123456789,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  telegramId?: number;

  @ApiProperty({
    description: 'اسم المستخدم في تليجرام (اختياري)',
    example: 'john_doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'الاسم الأول (اختياري)',
    example: 'أحمد',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'الاسم الأخير (اختياري)',
    example: 'محمد',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'كود اللغة (اختياري)',
    example: 'ar',
    required: false,
  })
  @IsOptional()
  @IsString()
  languageCode?: string;
}

