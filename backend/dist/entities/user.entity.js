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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
const activated_package_entity_1 = require("./activated-package.entity");
const referral_entity_1 = require("./referral.entity");
const user_activity_entity_1 = require("./user-activity.entity");
let User = class User {
    id;
    telegramId;
    username;
    firstName;
    lastName;
    languageCode;
    isPremium;
    loginMethod;
    isActive;
    referralCode;
    referredBy;
    totalCoins;
    miningRate;
    lastClaim;
    lastLogin;
    createdAt;
    updatedAt;
    orders;
    activatedPackages;
    referrals;
    activities;
    getFullName() {
        return `${this.firstName || ''} ${this.lastName || ''}`.trim();
    }
    canClaim() {
        if (!this.lastClaim)
            return true;
        const now = new Date();
        const lastClaim = new Date(this.lastClaim);
        const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastClaim >= 24;
    }
    calculateClaimAmount() {
        const baseAmount = this.miningRate;
        const hoursMultiplier = this.getHoursSinceLastClaim();
        const maxHours = Math.min(hoursMultiplier, 24);
        return Math.floor(baseAmount * maxHours);
    }
    getHoursSinceLastClaim() {
        if (!this.lastClaim)
            return 24;
        const now = new Date();
        const lastClaim = new Date(this.lastClaim);
        return (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telegram_id', type: 'bigint', unique: true, nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "telegramId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'language_code', default: 'ar' }),
    __metadata("design:type", String)
], User.prototype, "languageCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_premium', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isPremium", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'login_method', default: 'telegram' }),
    __metadata("design:type", String)
], User.prototype, "loginMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referral_code', unique: true, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "referralCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referred_by', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "referredBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_coins', type: 'decimal', precision: 18, scale: 8, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "totalCoins", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mining_rate', default: 10 }),
    __metadata("design:type", Number)
], User.prototype, "miningRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_claim', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastClaim", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_login', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, order => order.user),
    __metadata("design:type", Array)
], User.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => activated_package_entity_1.ActivatedPackage, package_ => package_.user),
    __metadata("design:type", Array)
], User.prototype, "activatedPackages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => referral_entity_1.Referral, referral => referral.referrer),
    __metadata("design:type", Array)
], User.prototype, "referrals", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_activity_entity_1.UserActivity, activity => activity.user),
    __metadata("design:type", Array)
], User.prototype, "activities", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users'),
    (0, typeorm_1.Index)(['telegramId'], { unique: true }),
    (0, typeorm_1.Index)(['referralCode'], { unique: true })
], User);
//# sourceMappingURL=user.entity.js.map