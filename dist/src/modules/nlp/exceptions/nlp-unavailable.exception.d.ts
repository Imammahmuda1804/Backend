import { HttpException } from '@nestjs/common';
export declare class NlpServiceUnavailableException extends HttpException {
    constructor(message?: string);
}
