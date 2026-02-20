import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for storing custom validation messages
 */
export const VALIDATION_MESSAGE_KEY = 'validation:custom_message';

/**
 * Decorator to set a custom validation error message for a DTO class
 *
 * This allows you to customize the "message" field in validation error responses
 * instead of the default "Validation failed" message.
 *
 * @param message - Custom error message to display when validation fails
 *
 * @example
 * ```typescript
 * @ValidationMessage('Read communities validation error')
 * export class ReadCommunitiesQueryDTO {
 *   @IsInt()
 *   page?: number;
 * }
 * ```
 *
 * @example Response with custom message
 * ```json
 * {
 *   "meta": {
 *     "status": "error",
 *     "statusCode": 400
 *   },
 *   "message": "Read communities validation error",
 *   "detail": {
 *     "page": "page must be an integer"
 *   },
 *   "solution": "Please check the request and try again"
 * }
 * ```
 */
export const ValidationMessage = (message: string): ClassDecorator => {
  return SetMetadata(VALIDATION_MESSAGE_KEY, message);
};
