"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_custom_1 = require("passport-custom");
const auth_service_1 = require("../auth.service");
let TelegramStrategy = class TelegramStrategy extends (0, passport_1.PassportStrategy)(passport_custom_1.Strategy, 'telegram') {
    authService;
    constructor(authService) {
        super();
        this.authService = authService;
    }
    async validate(req) {
        const telegramAuthDto = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        return await this.authService.telegramLogin(telegramAuthDto, ipAddress, userAgent);
    }
};
exports.TelegramStrategy = TelegramStrategy;
exports.TelegramStrategy = TelegramStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], TelegramStrategy);
//# sourceMappingURL=telegram.strategy.js.map