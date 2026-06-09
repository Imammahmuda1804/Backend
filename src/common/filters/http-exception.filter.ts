import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Memformat error HTTP menjadi response standar.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const { request, response } = this.getHttpContext(host);
    const message = this.getExceptionMessage(exception);
    const errorResponse = this.buildErrorResponse(status, message, request);

    this.logException(status, request, message, exception);
    response.status(status).json(errorResponse);
  }

  private getHttpContext(host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    return {
      response: ctx.getResponse<Response>(),
      request: ctx.getRequest<Request>(),
    };
  }

  private getExceptionMessage(exception: HttpException) {
    const exceptionResponse = exception.getResponse();
    if (typeof exceptionResponse === 'string') return exceptionResponse;

    return (
      (exceptionResponse as { message?: string | string[] }).message ||
      exception.message
    );
  }

  private buildErrorResponse(
    status: number,
    message: string | string[],
    request: Request,
  ) {
    return {
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: HttpStatus[status] || 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private logException(
    status: number,
    request: Request,
    message: string | string[],
    exception: HttpException,
  ) {
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${JSON.stringify(message)}`,
      );
    }
  }
}
