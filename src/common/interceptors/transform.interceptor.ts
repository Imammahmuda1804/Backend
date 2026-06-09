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
    return next.handle().pipe(map((res: unknown) => this.wrapResponse(res)));
  }

  private wrapResponse(res: unknown): ApiResponse<T> {
    if (this.hasDataAndMeta(res)) return this.wrapPaginatedResponse(res);
    return this.wrapDataResponse(res);
  }

  private hasDataAndMeta(
    res: unknown,
  ): res is { data: T; meta: Record<string, unknown> } {
    return Boolean(
      res && typeof res === 'object' && 'data' in res && 'meta' in res,
    );
  }

  private wrapPaginatedResponse(res: {
    data: T;
    meta: Record<string, unknown>;
  }) {
    return {
      status: 'success' as const,
      data: res.data,
      meta: res.meta,
    };
  }

  private wrapDataResponse(res: unknown) {
    return {
      status: 'success' as const,
      data: res as T,
    };
  }
}
