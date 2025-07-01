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
exports.ActivatedPackage = exports.PackageStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var PackageStatus;
(function (PackageStatus) {
    PackageStatus["ACTIVE"] = "active";
    PackageStatus["EXPIRED"] = "expired";
    PackageStatus["CANCELLED"] = "cancelled";
})(PackageStatus || (exports.PackageStatus = PackageStatus = {}));
let ActivatedPackage = class ActivatedPackage {
    id;
    userId;
    packageId;
    orderId;
    miningRate;
    expiresAt;
    status;
    totalMined;
    daysActive;
    activatedAt;
    updatedAt;
    user;
    isActive() {
        return this.status === PackageStatus.ACTIVE && !this.isExpired();
    }
    isExpired() {
        return new Date() > this.expiresAt;
    }
    getRemainingDays() {
        if (this.isExpired())
            return 0;
        const now = new Date();
        const diffTime = this.expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
    getPackageInfo() {
        const packages = {
            1: {
                name: 'باقة أساسية',
                rate: 20,
                price: 1,
                duration: 30,
                description: 'مثالية للمبتدئين',
                features: ['20 عملة يومياً', 'دعم فني أساسي', 'صالحة لمدة 30 يوم']
            },
            2: {
                name: 'باقة متوسطة',
                rate: 35,
                price: 2,
                duration: 30,
                description: 'للمستخدمين النشطين',
                features: ['35 عملة يومياً', 'دعم فني متقدم', 'مكافآت إضافية', 'صالحة لمدة 30 يوم']
            },
            3: {
                name: 'باقة متقدمة',
                rate: 50,
                price: 5,
                duration: 30,
                description: 'للمحترفين',
                features: ['50 عملة يومياً', 'دعم فني VIP', 'مكافآت حصرية', 'أولوية في المهام', 'صالحة لمدة 30 يوم']
            },
        };
        return packages[this.packageId] || null;
    }
    calculateDailyEarnings() {
        return this.miningRate;
    }
    calculateTotalPotentialEarnings() {
        const remainingDays = this.getRemainingDays();
        return this.miningRate * remainingDays;
    }
    getProgressPercentage() {
        const packageInfo = this.getPackageInfo();
        if (!packageInfo)
            return 0;
        const totalDays = packageInfo.duration;
        const elapsedDays = totalDays - this.getRemainingDays();
        return Math.min(100, (elapsedDays / totalDays) * 100);
    }
    shouldAutoExpire() {
        return this.isExpired() && this.status === PackageStatus.ACTIVE;
    }
};
exports.ActivatedPackage = ActivatedPackage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ActivatedPackage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], ActivatedPackage.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'package_id' }),
    __metadata("design:type", Number)
], ActivatedPackage.prototype, "packageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id' }),
    __metadata("design:type", String)
], ActivatedPackage.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mining_rate' }),
    __metadata("design:type", Number)
], ActivatedPackage.prototype, "miningRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], ActivatedPackage.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PackageStatus, default: PackageStatus.ACTIVE }),
    __metadata("design:type", String)
], ActivatedPackage.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_mined', type: 'decimal', precision: 18, scale: 8, default: 0 }),
    __metadata("design:type", Number)
], ActivatedPackage.prototype, "totalMined", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'days_active', default: 0 }),
    __metadata("design:type", Number)
], ActivatedPackage.prototype, "daysActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'activated_at' }),
    __metadata("design:type", Date)
], ActivatedPackage.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ActivatedPackage.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.activatedPackages),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ActivatedPackage.prototype, "user", void 0);
exports.ActivatedPackage = ActivatedPackage = __decorate([
    (0, typeorm_1.Entity)('activated_packages'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['expiresAt'])
], ActivatedPackage);
//# sourceMappingURL=activated-package.entity.js.map