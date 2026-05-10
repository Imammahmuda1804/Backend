"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpServiceUnavailableException = void 0;
const common_1 = require("@nestjs/common");
class NlpServiceUnavailableException extends common_1.HttpException {
    constructor(message = 'NLP Service is currently unavailable') {
        super(message, common_1.HttpStatus.SERVICE_UNAVAILABLE);
    }
}
exports.NlpServiceUnavailableException = NlpServiceUnavailableException;
//# sourceMappingURL=nlp-unavailable.exception.js.map