import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * A pipe that validates and transforms an array of MongoDB ObjectId strings.
 *
 * This pipe is useful for endpoints that receive a raw array of ObjectId strings
 * in the request body (e.g., `["id1", "id2"]`) and need to:
 * 1. Validate that each element is a valid MongoDB ObjectId string
 * 2. Transform each string to a Types.ObjectId instance
 *
 * @example
 * ```typescript
 * @Delete('/bulk')
 * async deleteMany(
 *   @Body(new ParseMongoIdArrayPipe()) ids: Types.ObjectId[]
 * ) {
 *   // ids is now Types.ObjectId[]
 * }
 * ```
 *
 * @example With custom property name for error messages
 * ```typescript
 * @Delete('/bulk')
 * async deleteMany(
 *   @Body(new ParseMongoIdArrayPipe({ propertyName: 'categoryIDs' })) ids: Types.ObjectId[]
 * ) {
 *   // Error message: "categoryIDs[0] must be a valid MongoDB ObjectId"
 * }
 * ```
 */
@Injectable()
export class ParseMongoIdArrayPipe implements PipeTransform<
  unknown,
  Types.ObjectId[]
> {
  private readonly propertyName: string;

  constructor(options?: { propertyName?: string }) {
    this.propertyName = options?.propertyName ?? 'value';
  }

  transform(value: unknown, _metadata: ArgumentMetadata): Types.ObjectId[] {
    // Validate it's an array
    if (!Array.isArray(value)) {
      throw new BadRequestException(
        `${this.propertyName} must be an array of MongoDB ObjectId strings`
      );
    }

    // Validate array is not empty
    if (value.length === 0) {
      throw new BadRequestException(`${this.propertyName} must not be empty`);
    }

    // Validate and transform each element
    const result: Types.ObjectId[] = [];

    for (let i = 0; i < value.length; i++) {
      const item = value[i];

      // Check if it's a string
      if (typeof item !== 'string') {
        throw new BadRequestException(
          `${this.propertyName}[${i}] must be a string, received ${typeof item}`
        );
      }

      // Check if it's a valid ObjectId string
      if (!Types.ObjectId.isValid(item)) {
        throw new BadRequestException(
          `${this.propertyName}[${i}] must be a valid MongoDB ObjectId`
        );
      }

      // Transform to ObjectId
      result.push(new Types.ObjectId(item));
    }

    return result;
  }
}
