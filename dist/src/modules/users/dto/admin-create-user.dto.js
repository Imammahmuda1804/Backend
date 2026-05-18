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
exports.AdminCreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class AdminCreateUserDto {
    name;
    email;
    password;
    role;
    status;
}
exports.AdminCreateUserDto = AdminCreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nama lengkap user', example: 'John Doe' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama tidak boleh kosong' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'Nama minimal 2 karakter' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email user', example: 'john@mail.com' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email tidak boleh kosong' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Format email tidak valid' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Password', example: 'password123' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password tidak boleh kosong' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password minimal 6 karakter' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Role user', enum: client_1.Role, example: 'ADMIN' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Role tidak boleh kosong' }),
    (0, class_validator_1.IsEnum)(client_1.Role, { message: 'Role harus ADMIN atau USER' }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status user',
        enum: ['active', 'suspended'],
        example: 'active',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Status tidak boleh kosong' }),
    (0, class_validator_1.IsIn)(['active', 'suspended'], {
        message: 'Status harus active atau suspended',
    }),
    __metadata("design:type", String)
], AdminCreateUserDto.prototype, "status", void 0);
//# sourceMappingURL=admin-create-user.dto.js.map