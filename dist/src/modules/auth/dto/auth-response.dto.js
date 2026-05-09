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
exports.RegisterResponseDto = exports.LoginResponseDto = exports.AuthUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuthUserDto {
    id;
    name;
    email;
    role;
}
exports.AuthUserDto = AuthUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], AuthUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@mail.com' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USER', enum: ['ADMIN', 'USER'] }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "role", void 0);
class LoginResponseDto {
    access_token;
    refresh_token;
    user;
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JWT access token' }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "access_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JWT refresh token' }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "refresh_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data user', type: AuthUserDto }),
    __metadata("design:type", AuthUserDto)
], LoginResponseDto.prototype, "user", void 0);
class RegisterResponseDto {
    id;
    name;
    email;
    role;
}
exports.RegisterResponseDto = RegisterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], RegisterResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@mail.com' }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USER' }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "role", void 0);
//# sourceMappingURL=auth-response.dto.js.map