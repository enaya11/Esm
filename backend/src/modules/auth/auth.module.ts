import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TonAuthController } from './ton-auth.controller';
import { TonAuthService } from './ton-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TelegramStrategy } from './strategies/telegram.strategy';
import { WalletsModule } from '../wallets/wallets.module';

import { User } from '../../entities/user.entity';
import { UserActivity } from '../../entities/user-activity.entity';
import { Referral } from '../../entities/referral.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserActivity, Referral]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    HttpModule,
    WalletsModule,
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
  controllers: [AuthController, TonAuthController],
  providers: [AuthService, TonAuthService, JwtStrategy, TelegramStrategy],
  exports: [AuthService, TonAuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }

