import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// إعدادات قاعدة البيانات
import { getDatabaseConfig } from './config/database.config';

// الوحدات
import { AuthModule } from './modules/auth/auth.module';
import { WalletsModule } from './modules/wallets/wallets.module';

// الكيانات
import { User } from './entities/user.entity';
import { Order } from './entities/order.entity';
import { ConfirmedTransaction } from './entities/confirmed-transaction.entity';
import { ActivatedPackage } from './entities/activated-package.entity';
import { Referral } from './entities/referral.entity';
import { UserActivity } from './entities/user-activity.entity';
import { Wallet } from './entities/wallet.entity';

@Module({
  imports: [
    // إعدادات التطبيق
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // قاعدة البيانات
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Order, ConfirmedTransaction, ActivatedPackage, Referral, UserActivity, Wallet]),

    // حماية من الهجمات (Rate Limiting) - الإصلاح هنا
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        return {
          throttlers: [
            {
              ttl: Number(configService.get('RATE_LIMIT_TTL')) || 60,
              limit: Number(configService.get('RATE_LIMIT_LIMIT')) || 100,
            },
          ],
        };
      },
      inject: [ConfigService],
    }),

    // وحدات التطبيق
    AuthModule,
    WalletsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }