import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import 'reflect-metadata';
import { formatResponse } from '../format-response/format-response';
import { VALIDATION_MESSAGE_KEY } from './validation-message.decorator';

/**
 * Standard Validation Pipe
 *
 * A reusable NestJS validation pipe that formats validation errors using the
 * standardized formatResponse pattern. This ensures consistent error responses
 * across all microservices in the monorepo.
 *
 * @example Apply globally in main.ts
 * ```typescript
 * import { StandardValidationPipe } from '@returning-ai/utilities';
 *
 * app.useGlobalPipes(new StandardValidationPipe());
 * ```
 *
 * @example With custom options
 * ```typescript
 * app.useGlobalPipes(
 *   new StandardValidationPipe({
 *     whitelist: true,
 *     forbidNonWhitelisted: true,
 *   })
 * );
 * ```
 *
 * @example Error response format
 * ```json
 * {
 *   "meta": {
 *     "status": "error",
 *     "statusCode": 400
 *   },
 *   "message": "Validation failed",
 *   "detail": {
 *     "email": "email must be a valid email address",
 *     "age": "age must be at least 1"
 *   },
 *   "solution": "Please check the request parameters and try again"
 * }
 * ```
 */
export class StandardValidationPipe extends ValidationPipe {
  private customMessage: string | null = null;

  constructor(options?: ValidationPipeOptions) {
    super({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for extra properties
      transformOptions: {
        enableImplicitConversion: true, // Enable automatic type conversion
      },
      ...options, // Allow override of default options
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const formattedErrors =
          StandardValidationPipe.formatValidationErrors(validationErrors);

        // Use custom message if set, otherwise use default
        const message = this.customMessage || 'Validation failed';

        const errorResponse = formatResponse({
          status: 'error',
          statusCode: 400,
          message,
          detail: formattedErrors,
          solution: 'Please check the request and try again',
        });

        // Reset custom message after use
        this.customMessage = null;

        return new BadRequestException(errorResponse);
      },
    });
  }

  /**
   * Override transform to extract custom validation message from DTO metadata
   */
  override async transform(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    metadata: ArgumentMetadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    // Extract custom message from DTO class metadata if available
    if (metadata.metatype && typeof metadata.metatype === 'function') {
      const customMessage = Reflect.getMetadata(
        VALIDATION_MESSAGE_KEY,
        metadata.metatype
      );
      if (customMessage) {
        this.customMessage = customMessage;
      }
    }

    // Call parent transform which will trigger validation
    return super.transform(value, metadata);
  }

  /**
   * Formats class-validator ValidationError[] into a flat Record<string, string>
   * where keys are property paths and values are error messages.
   *
   * Handles nested validation errors by flattening them with dot notation.
   *
   * @param errors - Array of ValidationError from class-validator
   * @returns Flat object with property paths as keys and error messages as values
   *
   * @example
   * ```typescript
   * // Input: ValidationError for { email: 'invalid', age: -1 }
   * // Output:
   * {
   *   "email": "email must be a valid email address",
   *   "age": "age must be at least 1"
   * }
   * ```
   *
   * @example Nested errors
   * ```typescript
   * // Input: ValidationError for { address: { street: '', city: '' } }
   * // Output:
   * {
   *   "address.street": "street should not be empty",
   *   "address.city": "city should not be empty"
   * }
   * ```
   */
  private static formatValidationErrors(
    errors: ValidationError[]
  ): Record<string, string> {
    const result: Record<string, string> = {};

    errors.forEach((error) => {
      if (error.constraints) {
        // Get the first constraint message
        const constraintKeys = Object.keys(error.constraints);
        if (constraintKeys.length > 0) {
          result[error.property] = error.constraints[constraintKeys[0]];
        }
      }

      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = StandardValidationPipe.formatValidationErrors(
          error.children
        );
        Object.keys(nestedErrors).forEach((key) => {
          result[`${error.property}.${key}`] = nestedErrors[key];
        });
      }
    });

    return result;
  }
}
