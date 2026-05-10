import { HttpException } from '@nestjs/common';
export declare class NlpProcessingException extends HttpException {
    constructor(message?: string);
}
