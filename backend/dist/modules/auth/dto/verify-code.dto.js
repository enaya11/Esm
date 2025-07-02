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
exports.VerifyCodeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class VerifyCodeDto {
    code;
    telegramId;
    username;
    firstName;
    lastName;
    languageCode;
}
exports.VerifyCodeDto = VerifyCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'رمز التحقق المرسل من بوت تليجرام',
        example: 'ABC12345',
        minLength: 8,
        maxLength: 8,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(8, 8, { message: 'رمز التحقق يجب أن يكون 8 أحرف بالضبط' }),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'معرف المستخدم في تليجرام (اختياري)',
        example: 123456789,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], VerifyCodeDto.prototype, "telegramId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'اسم المستخدم في تليجرام (اختياري)',
        example: 'john_doe',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'الاسم الأول (اختياري)',
        example: 'أحمد',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'الاسم الأخير (اختياري)',
        example: 'محمد',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'كود اللغة (اختياري)',
        example: 'ar',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "languageCode", void 0);
//# sourceMappingURL=verify-code.dto.js.map