import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Bentuk response standar API.
export interface ApiResponse<T> {
  status: 'success';
  data: T;
  meta?: any;
}

// Membungkus response sukses dengan format standar.
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
