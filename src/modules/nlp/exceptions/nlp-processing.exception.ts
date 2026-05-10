import { HttpException, HttpStatus } from '@nestjs/common';

export class NlpProcessingException extends HttpException {
  constructor(message: string = 'Error processing data in NLP pipeline') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
