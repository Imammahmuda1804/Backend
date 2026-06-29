import { HttpException, HttpStatus } from '@nestjs/common';

export class NlpServiceException extends HttpException {
  constructor(
    message: string = 'NLP Service error',
    status: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE,
  ) {
    super(message, status);
  }
}
