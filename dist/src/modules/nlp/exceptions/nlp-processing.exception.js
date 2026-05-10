"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpProcessingException = void 0;
const common_1 = require("@nestjs/common");
class NlpProcessingException extends common_1.HttpException {
    constructor(message = 'Error processing data in NLP pipeline') {
        super(message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.NlpProcessingException = NlpProcessingException;
//# sourceMappingURL=nlp-processing.exception.js.map