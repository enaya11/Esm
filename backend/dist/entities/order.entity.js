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
exports.Order = exports.Currency = exports.OrderStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const confirmed_transaction_entity_1 = require("./confirmed-transaction.entity");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["EXPIRED"] = "expired";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var Currency;
(function (Currency) {
    Currency["TON"] = "TON";
    Currency["SOL"] = "SOL";
})(Currency || (exports.Currency = Currency = {}));
let Order = class Order {
    id;
    userId;
    packageId;
    amountUsd;
    amountCrypto;
    currency;
    walletAddress;
    status;
    transactionHash;
    confirmedAt;
    expiresAt;
    createdAt;
    updatedAt;
    user;
    confirmedTransaction;
    isExpired() {
        return new Date() > this.expiresAt;
    }
    canBeConfirmed() {
        return this.status === OrderStatus.PENDING && !this.isExpired();
    }
    getPackageInfo() {
        const packages = {
            1: { name: 'باقة أساسية', rate: 20, price: 1, duration: 30 },
            2: { name: 'باقة متوسطة', rate: 35, price: 2, duration: 30 },
            3: { name: 'باقة متقدمة', rate: 50, price: 5, duration: 30 },
        };
        return packages[this.packageId] || null;
    }
    getRemainingTime() {
        if (this.isExpired())
            return 0;
        return Math.max(0, this.expiresAt.getTime() - Date.now());
    }
};
exports.Order = Order;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], Order.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'package_id' }),
    __metadata("design:type", Number)
], Order.prototype, "packageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_usd', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "amountUsd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_crypto', type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", Number)
], Order.prototype, "amountCrypto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: Currency }),
    __metadata("design:type", String)
], Order.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'wallet_address' }),
    __metadata("design:type", String)
], Order.prototype, "walletAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_hash', nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "transactionHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Order.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], Order.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.orders),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => confirmed_transaction_entity_1.ConfirmedTransaction, transaction => transaction.order),
    __metadata("design:type", confirmed_transaction_entity_1.ConfirmedTransaction)
], Order.prototype, "confirmedTransaction", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['expiresAt'])
], Order);
//# sourceMappingURL=order.entity.js.map