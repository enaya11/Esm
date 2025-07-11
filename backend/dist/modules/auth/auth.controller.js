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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const telegram_auth_dto_1 = require("./dto/telegram-auth.dto");
const user_entity_1 = require("../../entities/user.entity");
const get_user_decorator_1 = require("../../common/decorators/get-user.decorator");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async telegramLogin(telegramAuthDto, req) {
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        return await this.authService.telegramLogin(telegramAuthDto, ipAddress, userAgent);
    }
    async getProfile(user) {
        return await this.authService.getUserProfile(user.id);
    }
    async logout(user, req) {
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');
        await this.authService.logout(user.id, ipAddress, userAgent);
        return { message: 'تم تسجيل الخروج بنجاح' };
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
                level: user.level || 1,
                referralCode: user.referralCode,
                isActive: user.isActive,
            },
        };
    }
    async getUserStats(telegramId) {
        return await this.authService.getUserStats(telegramId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('telegram-login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'تسجيل الدخول/التسجيل عبر تليجرام (للبوت والواجهة الأمامية)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم تسجيل الدخول/التسجيل بنجاح' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'بيانات غير صالحة' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegram_auth_dto_1.TelegramAuthDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "telegramLogin", null);
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
], AuthController.prototype, "getProfile", null);
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
], AuthController.prototype, "logout", null);
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
], AuthController.prototype, "verifyToken", null);
__decorate([
    (0, common_1.Get)('stats/:telegramId'),
    (0, swagger_1.ApiOperation)({ summary: 'الحصول على إحصائيات مستخدم معين' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'إحصائيات المستخدم' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'المستخدم غير موجود' }),
    __param(0, (0, common_1.Param)('telegramId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getUserStats", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('المصادقة'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map