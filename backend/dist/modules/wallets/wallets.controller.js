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
exports.WalletsController = void 0;
const common_1 = require("@nestjs/common");
const wallets_service_1 = require("./wallets.service");
const create_wallet_dto_1 = require("./dto/create-wallet.dto");
const update_wallet_dto_1 = require("./dto/update-wallet.dto");
const passport_1 = require("@nestjs/passport");
let WalletsController = class WalletsController {
    walletsService;
    constructor(walletsService) {
        this.walletsService = walletsService;
    }
    async createWallet(createWalletDto) {
        try {
            const wallet = await this.walletsService.createWallet(createWalletDto.userId, createWalletDto.tonAddress);
            return {
                success: true,
                wallet,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'فشل في إنشاء محفظة جديدة', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWalletByUserId(userId) {
        try {
            const wallet = await this.walletsService.getWalletByUserId(userId);
            if (!wallet) {
                throw new common_1.HttpException('المحفظة غير موجودة', common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                wallet,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'فشل في الحصول على محفظة المستخدم', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWalletByTonAddress(tonAddress) {
        try {
            const wallet = await this.walletsService.getWalletByTonAddress(tonAddress);
            if (!wallet) {
                throw new common_1.HttpException('المحفظة غير موجودة', common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                wallet,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'فشل في الحصول على محفظة بواسطة عنوان TON', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateWallet(userId, updateWalletDto) {
        try {
            const wallet = await this.walletsService.updateWallet(userId, updateWalletDto);
            return {
                success: true,
                wallet,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'فشل في تحديث محفظة المستخدم', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateBalance(userId, body) {
        try {
            const wallet = await this.walletsService.updateBalance(userId, body.amount);
            return {
                success: true,
                wallet,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'فشل في تحديث رصيد المحفظة', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(passport_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_wallet_dto_1.CreateWalletDto]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "createWallet", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, common_1.UseGuards)(passport_1.AuthGuard),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletByUserId", null);
__decorate([
    (0, common_1.Get)('ton/:tonAddress'),
    (0, common_1.UseGuards)(passport_1.AuthGuard),
    __param(0, (0, common_1.Param)('tonAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletByTonAddress", null);
__decorate([
    (0, common_1.Put)('user/:userId'),
    (0, common_1.UseGuards)(passport_1.AuthGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_wallet_dto_1.UpdateWalletDto]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "updateWallet", null);
__decorate([
    (0, common_1.Put)('user/:userId/balance'),
    (0, common_1.UseGuards)(passport_1.AuthGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "updateBalance", null);
exports.WalletsController = WalletsController = __decorate([
    (0, common_1.Controller)('wallets'),
    __metadata("design:paramtypes", [wallets_service_1.WalletsService])
], WalletsController);
//# sourceMappingURL=wallets.controller.js.map