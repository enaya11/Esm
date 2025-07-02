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
exports.UserActivity = exports.ActivityType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var ActivityType;
(function (ActivityType) {
    ActivityType["ACCOUNT_CREATED"] = "account_created";
    ActivityType["LOGIN"] = "login";
    ActivityType["LOGOUT"] = "logout";
    ActivityType["COINS_CLAIMED"] = "coins_claimed";
    ActivityType["PACKAGE_PURCHASED"] = "package_purchased";
    ActivityType["PACKAGE_ACTIVATED"] = "package_activated";
    ActivityType["REFERRAL_MADE"] = "referral_made";
    ActivityType["REFERRAL_BONUS_RECEIVED"] = "referral_bonus_received";
    ActivityType["TASK_COMPLETED"] = "task_completed";
    ActivityType["MINING"] = "mining";
    ActivityType["WITHDRAWAL_REQUESTED"] = "withdrawal_requested";
    ActivityType["WITHDRAWAL_COMPLETED"] = "withdrawal_completed";
    ActivityType["SECURITY_EVENT"] = "security_event";
    ActivityType["ADMIN_ACTION"] = "admin_action";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
let UserActivity = class UserActivity {
    id;
    userId;
    activityType;
    description;
    metadata;
    ipAddress;
    userAgent;
    amount;
    referenceId;
    createdAt;
    user;
    getActivityIcon() {
        const icons = {
            [ActivityType.ACCOUNT_CREATED]: '🎉',
            [ActivityType.LOGIN]: '🔐',
            [ActivityType.LOGOUT]: '👋',
            [ActivityType.COINS_CLAIMED]: '💰',
            [ActivityType.PACKAGE_PURCHASED]: '📦',
            [ActivityType.PACKAGE_ACTIVATED]: '✅',
            [ActivityType.REFERRAL_MADE]: '👥',
            [ActivityType.REFERRAL_BONUS_RECEIVED]: '🎁',
            [ActivityType.TASK_COMPLETED]: '✔️',
            [ActivityType.WITHDRAWAL_REQUESTED]: '💸',
            [ActivityType.WITHDRAWAL_COMPLETED]: '✅',
            [ActivityType.SECURITY_EVENT]: '🔒',
            [ActivityType.ADMIN_ACTION]: '⚙️',
        };
        return icons[this.activityType] || '📝';
    }
    getActivityTitle() {
        const titles = {
            [ActivityType.ACCOUNT_CREATED]: 'تم إنشاء الحساب',
            [ActivityType.LOGIN]: 'تسجيل دخول',
            [ActivityType.LOGOUT]: 'تسجيل خروج',
            [ActivityType.COINS_CLAIMED]: 'مطالبة بالعملات',
            [ActivityType.PACKAGE_PURCHASED]: 'شراء باقة',
            [ActivityType.PACKAGE_ACTIVATED]: 'تفعيل باقة',
            [ActivityType.REFERRAL_MADE]: 'إحالة جديدة',
            [ActivityType.REFERRAL_BONUS_RECEIVED]: 'مكافأة إحالة',
            [ActivityType.TASK_COMPLETED]: 'إكمال مهمة',
            [ActivityType.WITHDRAWAL_REQUESTED]: 'طلب سحب',
            [ActivityType.WITHDRAWAL_COMPLETED]: 'اكتمال السحب',
            [ActivityType.SECURITY_EVENT]: 'حدث أمني',
            [ActivityType.ADMIN_ACTION]: 'إجراء إداري',
        };
        return titles[this.activityType] || 'نشاط غير معروف';
    }
    isRecentActivity() {
        const now = new Date();
        const diffTime = now.getTime() - this.createdAt.getTime();
        const diffHours = diffTime / (1000 * 60 * 60);
        return diffHours <= 24;
    }
    isCriticalActivity() {
        const criticalActivities = [
            ActivityType.SECURITY_EVENT,
            ActivityType.WITHDRAWAL_REQUESTED,
            ActivityType.ADMIN_ACTION,
        ];
        return criticalActivities.includes(this.activityType);
    }
    getFormattedAmount() {
        if (!this.amount)
            return '';
        return `${this.amount.toFixed(2)} عملة`;
    }
    getTimeAgo() {
        const now = new Date();
        const diffTime = now.getTime() - this.createdAt.getTime();
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMinutes < 1)
            return 'الآن';
        if (diffMinutes < 60)
            return `منذ ${diffMinutes} دقيقة`;
        if (diffHours < 24)
            return `منذ ${diffHours} ساعة`;
        if (diffDays < 30)
            return `منذ ${diffDays} يوم`;
        return this.createdAt.toLocaleDateString('ar-SA');
    }
};
exports.UserActivity = UserActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], UserActivity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activity_type', type: 'enum', enum: ActivityType }),
    __metadata("design:type", String)
], UserActivity.prototype, "activityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserActivity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UserActivity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', nullable: true }),
    __metadata("design:type", String)
], UserActivity.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', nullable: true }),
    __metadata("design:type", String)
], UserActivity.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount', type: 'decimal', precision: 18, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], UserActivity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', nullable: true }),
    __metadata("design:type", String)
], UserActivity.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], UserActivity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.activities),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserActivity.prototype, "user", void 0);
exports.UserActivity = UserActivity = __decorate([
    (0, typeorm_1.Entity)('user_activities'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['activityType']),
    (0, typeorm_1.Index)(['createdAt'])
], UserActivity);
//# sourceMappingURL=user-activity.entity.js.map