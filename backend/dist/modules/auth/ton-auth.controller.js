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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TonAuthController = void 0;
const common_1 = require("@nestjs/common");
const ton_auth_service_1 = require("./ton-auth.service");
let TonAuthController = class TonAuthController {
    tonAuthService;
    constructor(tonAuthService) {
        this.tonAuthService = tonAuthService;
    }
    async verifyTonSignature(data) {
        try {
            const result = await this.tonAuthService.verifyTonSignature(data);
            if (!result.success) {
                throw new common_1.HttpException(result.message || 'فشل التحقق من التوقيع', common_1.HttpStatus.BAD_REQUEST);
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'حدث خطأ أثناء التحقق من التوقيع', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleTonConnect(data) {
        try {
            const result = await this.tonAuthService.handleTonConnect(data);
            if (!result.success) {
                throw new common_1.HttpException(result.message || 'فشل معالجة اتصال TON', common_1.HttpStatus.BAD_REQUEST);
            }
            return result;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'حدث خطأ أثناء معالجة اتصال TON', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateSession(data) {
        return { success: true };
    }
};
exports.TonAuthController = TonAuthController;
__decorate([
    (0, common_1.Post)('verify-ton-signature'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TonAuthController.prototype, "verifyTonSignature", null);
__decorate([
    (0, common_1.Post)('ton-connect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TonAuthController.prototype, "handleTonConnect", null);
__decorate([
    (0, common_1.Post)('validate-session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TonAuthController.prototype, "validateSession", null);
exports.TonAuthController = TonAuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [ton_auth_service_1.TonAuthService])
], TonAuthController);
//# sourceMappingURL=ton-auth.controller.js.map