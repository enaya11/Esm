"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./modules/auth/auth.module");
const wallets_module_1 = require("./modules/wallets/wallets.module");
const user_entity_1 = require("./entities/user.entity");
const order_entity_1 = require("./entities/order.entity");
const confirmed_transaction_entity_1 = require("./entities/confirmed-transaction.entity");
const activated_package_entity_1 = require("./entities/activated-package.entity");
const referral_entity_1 = require("./entities/referral.entity");
const user_activity_entity_1 = require("./entities/user-activity.entity");
const wallet_entity_1 = require("./entities/wallet.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: database_config_1.getDatabaseConfig,
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, order_entity_1.Order, confirmed_transaction_entity_1.ConfirmedTransaction, activated_package_entity_1.ActivatedPackage, referral_entity_1.Referral, user_activity_entity_1.UserActivity, wallet_entity_1.Wallet]),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    return {
                        throttlers: [
                            {
                                ttl: Number(configService.get('RATE_LIMIT_TTL')) || 60,
                                limit: Number(configService.get('RATE_LIMIT_LIMIT')) || 100,
                            },
                        ],
                    };
                },
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            wallets_module_1.WalletsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map