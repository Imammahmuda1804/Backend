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
  meta?: any;
}

/**
 * Transform Interceptor
 * Wrap semua response dengan format standar: { status: 'success', data: ... }
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res: unknown) => {
        if (res && typeof res === 'object' && 'data' in res && 'meta' in res) {
          const typedRes = res as { data: T; meta: Record<string, unknown> };
          return {
            status: 'success' as const,
            data: typedRes.data,
            meta: typedRes.meta,
          };
        }
        return {
          status: 'success' as const,
          data: res as T,
        };
      }),
    );
  }
}
