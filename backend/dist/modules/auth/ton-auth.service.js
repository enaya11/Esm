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
exports.TonAuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const nacl = require("tweetnacl");
const rxjs_1 = require("rxjs");
const user_entity_1 = require("../../entities/user.entity");
const wallets_service_1 = require("../wallets/wallets.service");
let TonAuthService = class TonAuthService {
    httpService;
    userRepository;
    walletsService;
    jwtService;
    configService;
    constructor(httpService, userRepository, walletsService, jwtService, configService) {
        this.httpService = httpService;
        this.userRepository = userRepository;
        this.walletsService = walletsService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async verifyTonSignature(data) {
        try {
            if (!data.walletAddress || !data.publicKey || !data.signature || !data.payload) {
                return { success: false, message: 'بيانات غير كاملة' };
            }
            const isValidAddress = this.validateTonAddress(data.walletAddress);
            if (!isValidAddress) {
                return { success: false, message: 'عنوان محفظة غير صالح' };
            }
            const isValidPublicKey = this.validatePublicKey(data.publicKey);
            if (!isValidPublicKey) {
                return { success: false, message: 'مفتاح عام غير صالح' };
            }
            const isValidSignature = await this.verifySignature(data.signature, data.publicKey, data.payload);
            if (!isValidSignature) {
                return { success: false, message: 'توقيع غير صالح' };
            }
            let user = await this.userRepository.findOne({
                where: { tonWalletAddress: data.walletAddress },
            });
            if (!user) {
                user = new user_entity_1.User();
                user.tonWalletAddress = data.walletAddress;
                user.publicKey = data.publicKey;
                user.username = `ton_user_${data.walletAddress.substring(0, 8)}`;
                user.loginMethod = 'ton';
                user.registeredAt = new Date();
                user.lastLoginAt = new Date();
                user.isActive = true;
                user.totalCoins = 0;
                user.miningRate = 0;
                user.level = 1;
                user.referralCode = this.generateReferralCode();
                await this.userRepository.save(user);
                await this.walletsService.createWallet(user.id, data.walletAddress);
            }
            else {
                user.lastLoginAt = new Date();
                user.isActive = true;
                await this.userRepository.save(user);
            }
            const payload = {
                sub: user.id,
                telegramId: user.telegramId,
                username: user.username,
            };
            const accessToken = this.jwtService.sign(payload);
            return {
                success: true,
                message: 'تم التحقق من التوقيع بنجاح',
                user: {
                    id: user.id,
                    tonWalletAddress: user.tonWalletAddress,
                    username: user.username,
                    totalCoins: user.totalCoins,
                },
                token: accessToken,
            };
        }
        catch (error) {
            console.error('خطأ في التحقق من توقيع TON:', error);
            return { success: false, message: 'حدث خطأ أثناء التحقق من التوقيع' };
        }
    }
    generateReferralCode() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    validateTonAddress(address) {
        if (!address.startsWith('EQ') && !address.startsWith('UQ')) {
            return false;
        }
        if (address.length !== 48) {
            return false;
        }
        const validChars = /^[A-Za-z0-9_-]+$/;
        if (!validChars.test(address)) {
            return false;
        }
        return true;
    }
    validatePublicKey(publicKey) {
        if (publicKey.length !== 64) {
            return false;
        }
        const validChars = /^[A-Fa-f0-9]+$/;
        if (!validChars.test(publicKey)) {
            return false;
        }
        return true;
    }
    async verifySignature(signature, publicKey, payload) {
        try {
            const publicKeyBytes = Buffer.from(publicKey, 'hex');
            const signatureBytes = Buffer.from(signature, 'base64');
            const message = this.createMessageForSigning(payload);
            const messageBytes = Buffer.from(message);
            return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
        }
        catch (error) {
            console.error('خطأ في التحقق من التوقيع:', error);
            return false;
        }
    }
    createMessageForSigning(payload) {
        const prefix = 'ton-connect';
        const domain = payload.domain || 'smartcoin-app.com';
        const timestamp = payload.timestamp || Date.now().toString();
        const sessionId = payload.sessionId || '';
        return `${prefix}:${domain}:${timestamp}:${sessionId}`;
    }
    generateAuthToken(user) {
        const payload = {
            id: user.id,
            walletAddress: user.walletAddress,
            timestamp: Date.now(),
        };
        const secret = process.env.JWT_SECRET || 'smartcoin-secret-key';
        const token = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        return `${token}.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
    }
    async getWalletInfo(address) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://toncenter.com/api/v2/getAddressInformation?address=${address}`));
            return response.data;
        }
        catch (error) {
            console.error('خطأ في الحصول على معلومات المحفظة:', error);
            return null;
        }
    }
    async handleTonConnect(data) {
        try {
            if (!data.walletAddress || !data.publicKey) {
                return { success: false, message: 'بيانات غير كاملة' };
            }
            let user = await this.userRepository.findOne({
                where: { tonWalletAddress: data.walletAddress },
            });
            if (!user) {
                user = new user_entity_1.User();
                user.tonWalletAddress = data.walletAddress;
                user.publicKey = data.publicKey;
                user.username = `ton_user_${data.walletAddress.substring(0, 8)}`;
                user.loginMethod = 'ton';
                user.registeredAt = new Date();
                user.lastLoginAt = new Date();
                user.isActive = true;
                user.totalCoins = 0;
                user.miningRate = 0;
                user.level = 1;
                user.referralCode = this.generateReferralCode();
                await this.userRepository.save(user);
                await this.walletsService.createWallet(user.id, data.walletAddress);
            }
            else {
                user.lastLoginAt = new Date();
                user.isActive = true;
                await this.userRepository.save(user);
            }
            const payload = {
                sub: user.id,
                telegramId: user.telegramId,
                username: user.username,
            };
            const accessToken = this.jwtService.sign(payload);
            return {
                success: true,
                message: 'تم الاتصال بالمحفظة بنجاح',
                user: {
                    id: user.id,
                    tonWalletAddress: user.tonWalletAddress,
                    username: user.username,
                    totalCoins: user.totalCoins,
                },
                token: accessToken,
            };
        }
        catch (error) {
            console.error('خطأ في معالجة اتصال TON:', error);
            return { success: false, message: 'حدث خطأ أثناء معالجة الاتصال' };
        }
    }
};
exports.TonAuthService = TonAuthService;
exports.TonAuthService = TonAuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        typeorm_2.Repository,
        wallets_service_1.WalletsService,
        jwt_1.JwtService,
        config_1.ConfigService])
], TonAuthService);
//# sourceMappingURL=ton-auth.service.js.map