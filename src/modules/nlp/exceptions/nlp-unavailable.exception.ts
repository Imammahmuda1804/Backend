import { HttpException, HttpStatus } from '@nestjs/common';

export class NlpServiceUnavailableException extends HttpException {
  constructor(message: string = 'NLP Service is currently unavailable') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
