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
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = require("crypto");
const wallet_entity_1 = require("../../entities/wallet.entity");
let WalletsService = class WalletsService {
    walletRepository;
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }
    async createWallet(userId, tonAddress) {
        try {
            const internalAddress = this.generateInternalAddress();
            const { publicKey, privateKey } = this.generateWalletKeys();
            const newWallet = this.walletRepository.create({
                userId,
                tonAddress,
                internalAddress,
                publicKey,
                privateKey: this.encryptPrivateKey(privateKey),
                balance: 0,
            });
            return await this.walletRepository.save(newWallet);
        }
        catch (error) {
            console.error('خطأ في إنشاء محفظة جديدة:', error);
            throw new Error('فشل في إنشاء محفظة جديدة');
        }
    }
    async getWalletByUserId(userId) {
        try {
            return await this.walletRepository.findOne({ where: { userId } });
        }
        catch (error) {
            console.error('خطأ في الحصول على محفظة المستخدم:', error);
            throw new Error('فشل في الحصول على محفظة المستخدم');
        }
    }
    async getWalletByTonAddress(tonAddress) {
        try {
            return await this.walletRepository.findOne({ where: { tonAddress } });
        }
        catch (error) {
            console.error('خطأ في الحصول على محفظة بواسطة عنوان TON:', error);
            throw new Error('فشل في الحصول على محفظة بواسطة عنوان TON');
        }
    }
    async updateWallet(userId, updateWalletDto) {
        try {
            const wallet = await this.walletRepository.findOne({ where: { userId } });
            if (!wallet) {
                throw new Error('المحفظة غير موجودة');
            }
            Object.assign(wallet, updateWalletDto);
            return await this.walletRepository.save(wallet);
        }
        catch (error) {
            console.error('خطأ في تحديث محفظة المستخدم:', error);
            throw new Error('فشل في تحديث محفظة المستخدم');
        }
    }
    async updateBalance(userId, amount) {
        try {
            const wallet = await this.walletRepository.findOne({ where: { userId } });
            if (!wallet) {
                throw new Error('المحفظة غير موجودة');
            }
            wallet.balance += amount;
            return await this.walletRepository.save(wallet);
        }
        catch (error) {
            console.error('خطأ في تحديث رصيد المحفظة:', error);
            throw new Error('فشل في تحديث رصيد المحفظة');
        }
    }
    generateInternalAddress() {
        const prefix = 'SC';
        const randomBytes = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now().toString(36);
        return `${prefix}_${randomBytes}_${timestamp}`;
    }
    generateWalletKeys() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });
        return {
            publicKey,
            privateKey,
        };
    }
    encryptPrivateKey(privateKey) {
        const secret = process.env.ENCRYPTION_KEY || 'smartcoin-encryption-key';
        const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(secret).digest(), Buffer.alloc(16, 0));
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decryptPrivateKey(encryptedPrivateKey) {
        const secret = process.env.ENCRYPTION_KEY || 'smartcoin-encryption-key';
        const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(secret).digest(), Buffer.alloc(16, 0));
        let decrypted = decipher.update(encryptedPrivateKey, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map