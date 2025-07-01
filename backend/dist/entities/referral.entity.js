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
exports.Referral = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let Referral = class Referral {
    id;
    referrerId;
    referredId;
    rewardGiven;
    rewardAmount;
    level;
    bonusPercentage;
    totalEarned;
    isActive;
    createdAt;
    referrer;
    referred;
    calculateReward(baseAmount) {
        return (baseAmount * this.bonusPercentage) / 100;
    }
    getLevelInfo() {
        const levels = {
            1: { name: 'إحالة مباشرة', percentage: 10, color: '#FFD700' },
            2: { name: 'إحالة من الدرجة الثانية', percentage: 5, color: '#C0C0C0' },
            3: { name: 'إحالة من الدرجة الثالثة', percentage: 2, color: '#CD7F32' },
        };
        return levels[this.level] || { name: 'إحالة غير معروفة', percentage: 0, color: '#666666' };
    }
    canEarnFromReferred() {
        return this.isActive && this.rewardGiven;
    }
    getAgeInDays() {
        const now = new Date();
        const diffTime = now.getTime() - this.createdAt.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    isNewReferral() {
        return this.getAgeInDays() <= 7;
    }
};
exports.Referral = Referral;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Referral.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referrer_id' }),
    __metadata("design:type", String)
], Referral.prototype, "referrerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referred_id' }),
    __metadata("design:type", String)
], Referral.prototype, "referredId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_given', default: false }),
    __metadata("design:type", Boolean)
], Referral.prototype, "rewardGiven", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_amount', type: 'decimal', precision: 18, scale: 8, default: 0 }),
    __metadata("design:type", Number)
], Referral.prototype, "rewardAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'level', default: 1 }),
    __metadata("design:type", Number)
], Referral.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bonus_percentage', type: 'decimal', precision: 5, scale: 2, default: 10.00 }),
    __metadata("design:type", Number)
], Referral.prototype, "bonusPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_earned', type: 'decimal', precision: 18, scale: 8, default: 0 }),
    __metadata("design:type", Number)
], Referral.prototype, "totalEarned", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Referral.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Referral.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'referrer_id' }),
    __metadata("design:type", user_entity_1.User)
], Referral.prototype, "referrer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'referred_id' }),
    __metadata("design:type", user_entity_1.User)
], Referral.prototype, "referred", void 0);
exports.Referral = Referral = __decorate([
    (0, typeorm_1.Entity)('referrals'),
    (0, typeorm_1.Index)(['referrerId']),
    (0, typeorm_1.Index)(['referredId']),
    (0, typeorm_1.Index)(['createdAt'])
], Referral);
//# sourceMappingURL=referral.entity.js.map