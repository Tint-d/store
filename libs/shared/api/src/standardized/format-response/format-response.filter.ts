import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { formatResponse } from './format-response';

/**
 * Global exception filter that formats HTTP exceptions using formatResponse
 * Only applies to endpoints containing "/apis" in the path
 *
 * Catches:
 * - Validation errors (class-validator)
 * - Body parsing errors (empty body, invalid JSON)
 * - 404 Not Found
 * - All other HttpExceptions
 * - Unhandled errors (500)
 *
 * @example Apply globally in main.ts
 * ```typescript
 * app.useGlobalFilters(new FormatResponseExceptionFilter());
 * ```
 */
@Catch()
export class FormatResponseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FormatResponseExceptionFilter.name);

  /**
   * Send response with status code - supports both Fastify and Express
   * Fastify uses response.code(status).send(data)
   * Express uses response.status(status).send(data)
   */
  private sendResponse(
    response: FastifyReply,
    statusCode: number,
    data: unknown
  ): void {
    // Fastify: response.code() exists
    if (typeof response.code === 'function') {
      response.code(statusCode).send(data);
      return;
    }

    // Express fallback: response.status() exists
    const expressResponse = response as unknown as {
      status?: (code: number) => { send: (data: unknown) => void };
    };
    if (typeof expressResponse.status === 'function') {
      expressResponse.status(statusCode).send(data);
      return;
    }

    // Last resort: try to send without status code
    this.logger.warn(
      'Response object does not have code() or status() method, sending without status code'
    );
    (response as unknown as { send: (data: unknown) => void }).send(data);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    // Only handle HTTP context - skip WebSocket and other contexts
    const contextType = host.getType();
    if (contextType !== 'http') {
      // For WebSocket (ws) or RPC contexts, log and re-throw
      this.logger.error(`Exception in ${contextType} context:`, exception);
      throw exception;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    // Only format responses for /apis endpoints
    const url = request?.url || '';
    if (!url.includes('/apis')) {
      // Re-throw for non-API endpoints to use default error handling
      if (exception instanceof HttpException) {
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        this.sendResponse(response, status, exceptionResponse);
      } else {
        this.sendResponse(response, HttpStatus.INTERNAL_SERVER_ERROR, {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
      return;
    }

    // Handle HttpException (NestJS built-in exceptions)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Check if response is already formatted (has meta.status structure)
      if (this.isAlreadyFormatted(exceptionResponse)) {
        this.sendResponse(response, status, exceptionResponse);
        return;
      }

      // Extract message and details from exception
      const { message, detail } = this.extractErrorDetails(exceptionResponse);

      // Determine if it's a client error (4xx) or server error (5xx)
      const isServerError = status >= 500;

      const formattedResponse = formatResponse({
        status: isServerError ? 'fail' : 'error',
        statusCode: status,
        message,
        detail,
      });

      this.sendResponse(response, status, formattedResponse);
      return;
    }

    // Handle unknown errors (non-HttpException)
    this.logger.error('Unhandled exception:', exception);

    const formattedResponse = formatResponse({
      status: 'fail',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error.',
      detail:
        exception instanceof Error
          ? exception.message
          : 'An unexpected error occurred.',
    });

    this.sendResponse(
      response,
      HttpStatus.INTERNAL_SERVER_ERROR,
      formattedResponse
    );
  }

  /**
   * Check if the response is already formatted with our structure
   */
  private isAlreadyFormatted(exceptionResponse: unknown): boolean {
    if (typeof exceptionResponse !== 'object' || exceptionResponse === null) {
      return false;
    }
    const response = exceptionResponse as Record<string, unknown>;
    // Check for our standard format: { meta: { status, statusCode }, message, detail }
    return (
      typeof response.meta === 'object' &&
      response.meta !== null &&
      'status' in (response.meta as object) &&
      'statusCode' in (response.meta as object)
    );
  }

  /**
   * Extract error message and details from exception response
   */
  private extractErrorDetails(exceptionResponse: string | object): {
    message: string;
    detail: string;
  } {
    // String response (simple error message)
    if (typeof exceptionResponse === 'string') {
      return {
        message: exceptionResponse,
        detail: exceptionResponse,
      };
    }

    // Object response (NestJS structured error)
    const response = exceptionResponse as Record<string, unknown>;

    // Handle class-validator errors (array of messages)
    if (Array.isArray(response.message)) {
      return {
        message: 'Validation failed.',
        detail: response.message.join(', '),
      };
    }

    // Handle standard NestJS error format
    const message =
      typeof response.message === 'string'
        ? response.message
        : typeof response.error === 'string'
          ? response.error
          : 'Request failed.';

    const detail =
      typeof response.message === 'string'
        ? response.message
        : typeof response.error === 'string'
          ? response.error
          : 'An error occurred.';

    return { message, detail };
  }
}
