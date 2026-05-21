"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
const env_validation_1 = require("./env.validation");
exports.envConfig = {
    isGlobal: true,
    envFilePath: '.env',
    validate: env_validation_1.validateEnv,
};
//# sourceMappingURL=env.config.js.map