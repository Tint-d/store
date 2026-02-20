import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { StandardValidationPipe } from './standard-validation.pipe';

/**
 * Recursively converts ObjectId instances to strings in a payload
 * This prevents plainToInstance from converting ObjectIds to empty objects
 */
function preprocessObjectIds(value: unknown): unknown {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(preprocessObjectIds);
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = preprocessObjectIds(val);
    }
    return result;
  }

  return value;
}

/**
 * Validates a DTO payload using the standard validation pipe
 * This ensures validation works even when calling controller methods directly
 *
 * @param payload - The payload to validate
 * @param dtoClass - The DTO class constructor to validate against
 * @param validationPipe - Optional StandardValidationPipe instance. If not provided, a new instance will be created
 * @returns A result object with success flag and either validated data or error response
 *
 * @example
 * ```typescript
 * const result = await validateDTO(payload, CreateTagControllerInputDTO);
 * if (!result.success) {
 *   return result.data; // Error response
 * }
 * const validatedData = result.data; // Validated DTO instance
 * ```
 */
export async function validateDTO<T, K>(
  payload: unknown,
  dtoClass: new () => K,
  validationPipe?: StandardValidationPipe
): Promise<{ success: true; data: K } | { success: false; data: T }> {
  const pipe = validationPipe || new StandardValidationPipe();

  try {
    // Pre-process payload to convert ObjectId instances to strings
    // This prevents plainToInstance from converting them to empty objects
    const preprocessedPayload = preprocessObjectIds(payload);

    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: dtoClass,
    };
    const result = (await pipe.transform(
      preprocessedPayload,
      metadata
    )) as unknown as K;
    return { success: true, data: result };
  } catch (error: unknown) {
    if (error instanceof BadRequestException) {
      const errorResponse = error.getResponse();
      return { success: false, data: errorResponse as unknown as T };
    } else {
      throw error;
    }
  }
}
