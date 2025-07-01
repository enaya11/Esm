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
exports.ConfirmedTransaction = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
let ConfirmedTransaction = class ConfirmedTransaction {
    id;
    orderId;
    transactionHash;
    fromAddress;
    toAddress;
    amount;
    currency;
    blockNumber;
    gasUsed;
    gasPrice;
    networkFee;
    confirmationCount;
    isVerified;
    confirmedAt;
    order;
    getExplorerUrl() {
        if (this.currency === order_entity_1.Currency.TON) {
            return `https://tonscan.org/tx/${this.transactionHash}`;
        }
        else if (this.currency === order_entity_1.Currency.SOL) {
            return `https://solscan.io/tx/${this.transactionHash}`;
        }
        return '';
    }
    isFullyConfirmed() {
        const requiredConfirmations = this.currency === order_entity_1.Currency.TON ? 1 : 32;
        return this.confirmationCount >= requiredConfirmations;
    }
    calculateNetAmount() {
        return this.amount - (this.networkFee || 0);
    }
};
exports.ConfirmedTransaction = ConfirmedTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ConfirmedTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id' }),
    __metadata("design:type", String)
], ConfirmedTransaction.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_hash', unique: true }),
    __metadata("design:type", String)
], ConfirmedTransaction.prototype, "transactionHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'from_address' }),
    __metadata("design:type", String)
], ConfirmedTransaction.prototype, "fromAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'to_address' }),
    __metadata("design:type", String)
], ConfirmedTransaction.prototype, "toAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", Number)
], ConfirmedTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: order_entity_1.Currency, enumName: 'currency_enum' }),
    __metadata("design:type", String)
], ConfirmedTransaction.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'block_number', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], ConfirmedTransaction.prototype, "blockNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gas_used', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], ConfirmedTransaction.prototype, "gasUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gas_price', type: 'decimal', precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], ConfirmedTransaction.prototype, "gasPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'network_fee', type: 'decimal', precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], ConfirmedTransaction.prototype, "networkFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmation_count', default: 0 }),
    __metadata("design:type", Number)
], ConfirmedTransaction.prototype, "confirmationCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_verified', default: false }),
    __metadata("design:type", Boolean)
], ConfirmedTransaction.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'confirmed_at' }),
    __metadata("design:type", Date)
], ConfirmedTransaction.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => order_entity_1.Order, order => order.confirmedTransaction),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], ConfirmedTransaction.prototype, "order", void 0);
exports.ConfirmedTransaction = ConfirmedTransaction = __decorate([
    (0, typeorm_1.Entity)('confirmed_transactions'),
    (0, typeorm_1.Index)(['transactionHash'], { unique: true }),
    (0, typeorm_1.Index)(['orderId'])
], ConfirmedTransaction);
//# sourceMappingURL=confirmed-transaction.entity.js.map