"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerProfileImageOptions = exports.multerCsvOptions = exports.multerImageOptions = exports.csvFileFilter = exports.imageFileFilter = void 0;
const common_1 = require("@nestjs/common");
const multer_1 = require("multer");
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
    storage: (0, multer_1.memoryStorage)(),
};
exports.multerCsvOptions = {
    fileFilter: exports.csvFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
};
exports.multerProfileImageOptions = {
    fileFilter: exports.imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
    storage: (0, multer_1.memoryStorage)(),
};
//# sourceMappingURL=multer.config.js.map