"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerProfileImageOptions = exports.multerCsvOptions = exports.multerImageOptions = exports.csvFileFilter = exports.imageFileFilter = void 0;
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const multer_1 = require("multer");
const fs = __importStar(require("fs"));
const uploadDir = './uploads/destinations';
const profileDir = './uploads/profiles';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
}
const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return callback(new common_1.BadRequestException('Only image files are allowed'), false);
    }
    callback(null, true);
};
exports.imageFileFilter = imageFileFilter;
const csvFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
        return callback(new common_1.BadRequestException('Only CSV or Excel files are allowed'), false);
    }
    callback(null, true);
};
exports.csvFileFilter = csvFileFilter;
exports.multerImageOptions = {
    fileFilter: exports.imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
    storage: (0, multer_1.diskStorage)({
        destination: uploadDir,
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = (0, path_1.extname)(file.originalname);
            callback(null, `${uniqueSuffix}${ext}`);
        },
    }),
};
exports.multerCsvOptions = {
    fileFilter: exports.csvFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
};
exports.multerProfileImageOptions = {
    fileFilter: exports.imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
    storage: (0, multer_1.diskStorage)({
        destination: profileDir,
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = (0, path_1.extname)(file.originalname);
            callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
    }),
};
//# sourceMappingURL=multer.config.js.map