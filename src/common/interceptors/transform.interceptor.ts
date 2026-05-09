import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Response format standar
 */
export interface ApiResponse<T> {
  status: 'success';
  data: T;
}

/**
 * Transform Interceptor
 * Wrap semua response dengan format standar: { status: 'success', data: ... }
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        status: 'success' as const,
        data,
      })),
    );
  }
}
