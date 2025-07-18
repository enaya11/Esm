"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const ton_auth_controller_1 = require("./ton-auth.controller");
const ton_auth_service_1 = require("./ton-auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const telegram_strategy_1 = require("./strategies/telegram.strategy");
const wallets_module_1 = require("../wallets/wallets.module");
const user_entity_1 = require("../../entities/user.entity");
const user_activity_entity_1 = require("../../entities/user-activity.entity");
const referral_entity_1 = require("../../entities/referral.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, user_activity_entity_1.UserActivity, referral_entity_1.Referral]),
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            axios_1.HttpModule,
            wallets_module_1.WalletsModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController, ton_auth_controller_1.TonAuthController],
        providers: [auth_service_1.AuthService, ton_auth_service_1.TonAuthService, jwt_strategy_1.JwtStrategy, telegram_strategy_1.TelegramStrategy],
        exports: [auth_service_1.AuthService, ton_auth_service_1.TonAuthService, jwt_strategy_1.JwtStrategy, passport_1.PassportModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map