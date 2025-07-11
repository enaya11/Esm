import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { User } from '../../entities/user.entity';
import { Wallet } from '../../entities/wallet.entity';
import { Order } from '../../entities/order.entity';
import { ActivatedPackage } from '../../entities/activated-package.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for JWT guard

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Wallet, Order, ActivatedPackage]),
        AuthModule, // Ensure AuthModule is imported to use AuthGuard
    ],
    providers: [StoreService],
    controllers: [StoreController],
    exports: [StoreService], // Export if other modules need to interact with StoreService
})
export class StoreModule { }