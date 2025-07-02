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
exports.AuthEnhancedController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const auth_enhanced_service_1 = require("./auth_enhanced.service");
const user_entity_1 = require("../../entities/user.entity");
const get_user_decorator_1 = require("../../common/decorators/get-user.decorator");
let AuthEnhancedController = class AuthEnhancedController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async telegramLogin(telegramData, req) {
        try {
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            if (!telegramData.telegram_id) {
                throw new common_1.BadRequestException('معرف التليجرام مطلوب');
            }
            return await this.authService.telegramLogin(telegramData, ipAddress, userAgent);
        }
        catch (error) {
            throw error;
        }
    }
    async getProfile(user) {
        return await this.authService.getUserProfile(user.id);
    }
    async logout(user, req) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        return await this.authService.logout(user.id, ipAddress, userAgent);
    }
    async verifyToken(user) {
        return {
            valid: true,
            user: {
                id: user.id,
                telegramId: user.telegramId,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                totalCoins: user.totalCoins,
                miningRate: user.miningRate,
                level: user.level,
                referralCode: user.referralCode,
            },
        };
    }
    async getUserStats(telegramId) {
        return await this.authService.getUserStats(telegramId);
    }
    async sendMiningNotification(data) {
        try {
            await this.authService.sendMiningNotification(data.telegramId.toString(), data.amount);
            return { success: true, message: 'تم إرسال إشعار التعدين بنجاح' };
        }
        catch (error) {
            return { success: false, message: 'فشل في إرسال الإشعار' };
        }
    }
    async sendTaskNotification(data) {
        try {
            await this.authService.sendTaskCompletionNotification(data.telegramId.toString(), data.taskName, data.reward);
            return { success: true, message: 'تم إرسال إشعار المهمة بنجاح' };
        }
        catch (error) {
            return { success: false, message: 'فشل في إرسال الإشعار' };
        }
    }
    async testTelegram(data) {
        try {
            await this.authService["sendTelegramMessage"](data.telegramId.toString(), data.message);
            return { success: true, message: 'تم إرسال رسالة الاختبار بنجاح' };
        }
        catch (error) {
            return { success: false, message: 'فشل في إرسال رسالة الاختبار', error: error.message };
        }
    }
    async getUserByTelegramId(telegramId) {
        try {
            const profile = await this.authService.getUserStats(telegramId);
            return { success: true, user: profile };
        }
        catch (error) {
            return { success: false, message: 'المستخدم غير موجود' };
        }
    }
};
exports.AuthEnhancedController = AuthEnhancedController;
__decorate([
    (0, common_1.Post)('telegram-login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'تسجيل الدخول عبر تليجرام المحسن' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم تسجيل الدخول بنجاح' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'بيانات غير صالحة' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'فشل في المصادقة' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "telegramLogin", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'الحصول على ملف المستخدم الشخصي' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم الحصول على البيانات بنجاح' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'غير مصرح' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'تسجيل الخروج' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم تسجيل الخروج بنجاح' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, Object]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('verify'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'التحقق من صحة التوكن' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'التوكن صالح' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'التوكن غير صالح' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "verifyToken", null);
__decorate([
    (0, common_1.Get)('stats/:telegramId'),
    (0, swagger_1.ApiOperation)({ summary: 'الحصول على إحصائيات المستخدم' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم الحصول على الإحصائيات بنجاح' }),
    __param(0, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Post)('mining-notification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'إرسال إشعار التعدين' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم إرسال الإشعار بنجاح' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "sendMiningNotification", null);
__decorate([
    (0, common_1.Post)('task-notification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'إرسال إشعار إكمال المهمة' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم إرسال الإشعار بنجاح' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "sendTaskNotification", null);
__decorate([
    (0, common_1.Post)('test-telegram'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'اختبار الاتصال مع تليجرام' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم الاختبار بنجاح' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "testTelegram", null);
__decorate([
    (0, common_1.Get)('user/:telegramId'),
    (0, swagger_1.ApiOperation)({ summary: 'البحث عن مستخدم بمعرف التليجرام' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم العثور على المستخدم' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'المستخدم غير موجود' }),
    __param(0, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthEnhancedController.prototype, "getUserByTelegramId", null);
exports.AuthEnhancedController = AuthEnhancedController = __decorate([
    (0, swagger_1.ApiTags)('المصادقة المحسنة'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_enhanced_service_1.AuthEnhancedService])
], AuthEnhancedController);
//# sourceMappingURL=auth_enhanced.controller.js.map