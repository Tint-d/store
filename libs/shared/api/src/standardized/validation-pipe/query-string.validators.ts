import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Options for query string validators
 */
export interface QueryStringValidatorOptions {
  /**
   * Array of valid field names
   */
  validFields: readonly string[];
  /**
   * For search validator: keyword field name for multi-field search
   * @default 'keyword'
   */
  keywordField?: string;
}

/**
 * Validates a sort query string in format "field:asc" or "field:desc"
 *
 * @param options - Configuration with validFields array
 * @param validationOptions - class-validator options
 *
 * @example
 * ```typescript
 * export class ReadTagsAPIQueryDTO {
 *   @IsSortString({ validFields: SortableTagFields })
 *   @IsOptional()
 *   sort?: string;
 * }
 * ```
 */
export function IsSortString(
  options: Pick<QueryStringValidatorOptions, 'validFields'>,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSortString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined || value === null || value === '') {
            return true; // Optional field
          }

          if (typeof value !== 'string') {
            return false;
          }

          const { validFields } = args
            .constraints[0] as QueryStringValidatorOptions;

          // Parse sort string: "field:direction"
          const parts = value.split(':').map((s) => s.trim());
          if (parts.length !== 2) {
            return false;
          }

          const [field, direction] = parts;

          // Validate field
          if (!validFields.includes(field)) {
            return false;
          }

          // Validate direction
          if (direction !== 'asc' && direction !== 'desc') {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;
          const { validFields } = args
            .constraints[0] as QueryStringValidatorOptions;

          if (typeof value !== 'string') {
            return `${args.property} must be a string`;
          }

          const parts = value.split(':');
          if (parts.length !== 2) {
            return `${args.property} must be in format "field:direction" (e.g., "name:asc")`;
          }

          const [field, direction] = parts.map((s) => s.trim());

          if (!validFields.includes(field)) {
            return `Invalid sort field: ${field}. Valid fields: ${validFields.join(', ')}`;
          }

          if (direction !== 'asc' && direction !== 'desc') {
            return `Invalid sort direction: ${direction}. Must be "asc" or "desc"`;
          }

          return `${args.property} is invalid`;
        },
      },
    });
  };
}

/**
 * Validates a fields query string in format "field1,field2,field3"
 *
 * @param options - Configuration with validFields array
 * @param validationOptions - class-validator options
 *
 * @example
 * ```typescript
 * export class ReadTagsAPIQueryDTO {
 *   @IsFieldsString({ validFields: SelectableTagFields })
 *   @IsOptional()
 *   fields?: string;
 * }
 * ```
 */
export function IsFieldsString(
  options: Pick<QueryStringValidatorOptions, 'validFields'>,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFieldsString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined || value === null || value === '') {
            return true; // Optional field
          }

          if (typeof value !== 'string') {
            return false;
          }

          const { validFields } = args
            .constraints[0] as QueryStringValidatorOptions;

          // Parse fields string: "field1,field2,field3"
          const fields = value
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean);

          if (fields.length === 0) {
            return false;
          }

          // Validate all fields
          return fields.every((field) => validFields.includes(field));
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;
          const { validFields } = args
            .constraints[0] as QueryStringValidatorOptions;

          if (typeof value !== 'string') {
            return `${args.property} must be a string`;
          }

          const fields = value
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean);
          const invalidFields = fields.filter((f) => !validFields.includes(f));

          if (invalidFields.length > 0) {
            return `Invalid field(s): ${invalidFields.join(', ')}. Valid fields: ${validFields.join(', ')}`;
          }

          return `${args.property} is invalid`;
        },
      },
    });
  };
}

/**
 * Validates a search query string in format "field:value"
 *
 * @param options - Configuration with validFields array and optional keywordField
 * @param validationOptions - class-validator options
 *
 * @example
 * ```typescript
 * export class ReadTagsAPIQueryDTO {
 *   @IsSearchString({ validFields: SearchableTagFields, keywordField: 'keyword' })
 *   @IsOptional()
 *   search?: string;
 * }
 * ```
 */
export function IsSearchString(
  options: QueryStringValidatorOptions,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSearchString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined || value === null || value === '') {
            return true; // Optional field
          }

          if (typeof value !== 'string') {
            return false;
          }

          const { validFields, keywordField = 'keyword' } = args
            .constraints[0] as QueryStringValidatorOptions;

          // Parse search string: "field:value"
          const colonIndex = value.indexOf(':');
          if (colonIndex === -1) {
            return false;
          }

          const field = value.substring(0, colonIndex).trim();
          const searchValue = value.substring(colonIndex + 1).trim();

          if (!field || !searchValue) {
            return false;
          }

          // Validate field (allow keywordField even if not in validFields)
          if (!validFields.includes(field) && field !== keywordField) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          const value = args.value;
          const { validFields, keywordField = 'keyword' } = args
            .constraints[0] as QueryStringValidatorOptions;

          if (typeof value !== 'string') {
            return `${args.property} must be a string`;
          }

          const colonIndex = value.indexOf(':');
          if (colonIndex === -1) {
            return `${args.property} must be in format "field:value" (e.g., "name:john")`;
          }

          const field = value.substring(0, colonIndex).trim();
          const searchValue = value.substring(colonIndex + 1).trim();

          if (!field) {
            return `${args.property} field name cannot be empty`;
          }

          if (!searchValue) {
            return `${args.property} search value cannot be empty`;
          }

          if (!validFields.includes(field) && field !== keywordField) {
            return `Invalid search field: ${field}. Valid fields: ${validFields.join(', ')}, ${keywordField}`;
          }

          return `${args.property} is invalid`;
        },
      },
    });
  };
}

/**
 * Validates a filter query string in format "field:value"
 *
 * @param options - Configuration with validFields array
 * @param validationOptions - class-validator options
 *
 * @example
 * ```typescript
 * export class ReadTagsAPIQueryDTO {
 *   @IsFilterString({ validFields: FilterableTagFields })
 *   @IsOptional()
 *   filter?: string;
 * }
 * ```
 */
export function IsFilterString(
  options: Pick<QueryStringValidatorOptions, 'validFields'>,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFilterString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined || value === null || value === '') {
            return true; // Optional field
          }

          if (typeof value !== 'string') {
            return false;
          }

          const { validFields } = args
            .constraints[0] as QueryStringValidatorOptions;

          const parts = value.split(':');
          if (parts.length !== 2) {
            return false;
          }

          const [field] = parts;

          if (!validFields.includes(field)) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          const msgValue = args.value;
          const { validFields } = args
            .constraints[0] as QueryStringValidatorOptions;

          if (typeof msgValue !== 'string') {
            return `${args.property} must be a string`;
          }

          const parts = msgValue.split(':');
          if (parts.length !== 2) {
            return `${args.property} must be in format "field:value" (e.g., "name:john")`;
          }

          const [field] = parts;
          if (!validFields.includes(field)) {
            return `Invalid filter field: ${field}. Valid fields: ${validFields.join(', ')}`;
          }

          return `${args.property} is invalid`;
        },
      },
    });
  };
}
