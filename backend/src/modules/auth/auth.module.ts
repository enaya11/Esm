import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TelegramStrategy } from './strategies/telegram.strategy';

import { User } from '../../entities/user.entity';
import { UserActivity } from '../../entities/user-activity.entity';
import { Referral } from '../../entities/referral.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserActivity, Referral]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TelegramStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}

