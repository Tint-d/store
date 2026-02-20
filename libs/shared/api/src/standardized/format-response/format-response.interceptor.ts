import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FormatResponseReturn } from './format-response';

/**
 * NestJS Interceptor for FormatResponse
 *
 * This interceptor automatically handles FormatResponse return values from controllers.
 * It extracts the HTTP status code from the response meta and sets it on the HTTP response.
 *
 * @example Apply globally in main.ts
 * ```typescript
 * app.useGlobalInterceptors(new FormatResponseInterceptor());
 * ```
 *
 * @example Apply to specific controller
 * ```typescript
 * @UseInterceptors(FormatResponseInterceptor)
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   getUsers(): FormatResponseReturn<GetUserInput, User[], Meta> {
 *     return formatResponse({
 *       status: 'success',
 *       message: 'Users retrieved',
 *       data: users,
 *       meta: { page: 1, limit: 10 }
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse<FastifyReply>();

    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map((data: any) => {
        // Check if the returned data looks like a FormatResponseReturn
        if (this.isFormatResponse(data)) {
          // Validate that required fields exist
          if (!data.meta?.status) {
            throw new Error(
              'FormatResponse: meta.status not set. Must be "success", "error", or "fail".'
            );
          }

          if (!data.meta?.statusCode) {
            throw new Error(
              'FormatResponse: meta.statusCode not set. Must provide a valid HTTP status code.'
            );
          }

          if (!data.message) {
            throw new Error(
              'FormatResponse: message not set. Must provide a message string.'
            );
          }

          // Set the HTTP status code using Fastify's .code() method
          response.code(data.meta.statusCode);

          // Return the response as the body
          return data;
        }

        // If not a FormatResponse, return as-is
        return data;
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as unknown as Observable<any>;
  }

  /**
   * Type guard to check if data is a FormatResponseReturn
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isFormatResponse(data: any): data is FormatResponseReturn {
    return (
      data &&
      typeof data === 'object' &&
      data.meta &&
      typeof data.meta === 'object' &&
      typeof data.meta.status === 'string' &&
      ['success', 'error', 'fail'].includes(data.meta.status) &&
      typeof data.meta.statusCode === 'number' &&
      typeof data.message === 'string'
    );
  }
}
