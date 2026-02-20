import { Transform, Type } from 'class-transformer';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Types } from 'mongoose';

/**
 * Custom validator that accepts both MongoDB ObjectId instances and valid ObjectId strings
 *
 * This validator is useful when you need to validate fields that can come in as either:
 * - ObjectId instances (e.g., `new Types.ObjectId('...')`)
 * - Valid ObjectId strings (e.g., `'507f1f77bcf86cd799439011'`)
 *
 * Note: This decorator automatically transforms valid strings to ObjectId instances after validation.
 *
 * IMPORTANT: This decorator internally applies @Type(() => String) to prevent
 * `enableImplicitConversion` in ValidationPipe from corrupting the value before
 * the custom Transform runs. Without this, implicit conversion may try to create
 * an ObjectId from the reflected type metadata, resulting in an empty object `{}`.
 *
 * @param validationOptions - Optional validation options from class-validator
 * @returns A decorator function that can be used with class-validator
 *
 * @example
 * ```typescript
 * export class ReadTagsControllerInputDTO {
 *   @IsMongoIdOrString()
 *   communityID!: Community['_id'];
 * }
 * ```
 *
 * @example With custom message
 * ```typescript
 * export class MyDTO {
 *   @IsMongoIdOrString({ message: 'communityID must be a valid MongoDB ObjectId' })
 *   communityID!: Types.ObjectId;
 * }
 * ```
 */
export function IsMongoIdOrString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    // Apply Type decorator first to prevent enableImplicitConversion from corrupting
    // the value. This ensures the string value is preserved for the Transform below.
    Type(() => String)(object, propertyName);

    // Apply the Transform decorator to convert strings to ObjectId
    Transform(({ value }) => {
      if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
        return new Types.ObjectId(value);
      }
      return value;
    })(object, propertyName);

    registerDecorator({
      name: 'isMongoIdOrString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          // Accept ObjectId instances
          if (value instanceof Types.ObjectId) {
            return true;
          }

          // Accept valid ObjectId strings
          if (typeof value === 'string') {
            return Types.ObjectId.isValid(value);
          }

          // Handle objects that might be ObjectId instances (from plainToInstance)
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const obj = value as Record<string, unknown>;
            // Check for _bsontype property (BSON serialization)
            if (obj._bsontype === 'ObjectID' || obj._bsontype === 'ObjectId') {
              // Try to get the id string and validate it
              if (typeof obj.id === 'string') {
                return Types.ObjectId.isValid(obj.id);
              }
              // Try toString
              if (typeof obj.toString === 'function') {
                try {
                  const str = String(obj.toString());
                  return Types.ObjectId.isValid(str);
                } catch {
                  return false;
                }
              }
            }
            // Check constructor name
            if (value.constructor && value.constructor.name === 'ObjectId') {
              try {
                const str = String(value);
                return Types.ObjectId.isValid(str);
              } catch {
                return false;
              }
            }
            // Try to find id property
            if (typeof obj.id === 'string') {
              return Types.ObjectId.isValid(obj.id);
            }
            // Try toString method
            if (typeof obj.toString === 'function') {
              try {
                const str = obj.toString();
                if (typeof str === 'string') {
                  return Types.ObjectId.isValid(str);
                }
              } catch {
                return false;
              }
            }
          }

          return false;
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;
          const propertyName = args.property;

          if (value === undefined || value === null) {
            return `${propertyName} must be a valid MongoDB ObjectId`;
          }

          if (typeof value === 'string') {
            return `${propertyName} must be a valid MongoDB ObjectId string`;
          }

          if (typeof value === 'object') {
            return `${propertyName} must be a valid MongoDB ObjectId instance or string`;
          }

          return `${propertyName} must be a valid MongoDB ObjectId (received ${typeof value})`;
        },
      },
    });
  };
}
