/**
 * Format Query Utilities
 *
 * Reusable utility functions for parsing and formatting query parameters
 * for pagination, sorting, filtering, and field selection.
 *
 * These utilities are designed to work with standard RESTful API query patterns.
 */

/**
 * Options for formatSortQuery
 */
export interface FormatSortQueryOptions {
  /**
   * Array of valid field names that can be sorted
   * If provided, will validate that sort fields are in this list
   */
  validFields?: string[];
  /**
   * Whether to throw an error if an invalid field is encountered
   * @default true
   */
  throwOnInvalidField?: boolean;
  /**
   * Whether to allow only a single sort field
   * If true, will throw an error if multiple sort fields are provided
   * @default true
   */
  singleFieldOnly?: boolean;
}

/**
 * Options for formatFieldsQuery
 */
export interface FormatFieldsQueryOptions {
  /**
   * Array of valid field names that can be selected
   * If provided, will validate that fields are in this list
   */
  validFields?: string[];
  /**
   * Whether to throw an error if an invalid field is encountered
   * @default true
   */
  throwOnInvalidField?: boolean;
}

/**
 * Options for formatSearchQuery
 */
export interface FormatSearchQueryOptions {
  /**
   * Array of valid field names that can be searched
   * If provided, will validate that the search field is in this list
   */
  validFields?: string[];
  /**
   * Whether to throw an error if an invalid field is encountered
   * @default true
   */
  throwOnInvalidField?: boolean;
  /**
   * Special keyword field that can be used for multi-field searches
   * @default 'keyword'
   */
  keywordField?: string;
}

/**
 * Options for formatFilterQuery
 */
export interface FormatFilterQueryOptions {
  /**
   * Array of valid field names that can be filtered
   * If provided, will validate that the filter field is in this list
   */
  validFields?: string[];
  /**
   * Whether to throw an error if an invalid field is encountered
   * @default true
   */
  throwOnInvalidField?: boolean;
}

/**
 * Parse a sort query string into a MongoDB-compatible sort object
 *
 * @param sortQuery - Sort query string in format "field:direction"
 *                    Direction can be "asc" or "desc"
 * @param options - Optional configuration for validation
 * @returns MongoDB sort object with 1 for ascending, -1 for descending
 *
 * @example
 * ```typescript
 * // Basic usage (single field only by default)
 * formatSortQuery('name:asc')
 * // Returns: { name: 1 }
 *
 * // With field validation
 * formatSortQuery('name:asc', { validFields: ['name', 'email', 'createdAt'] })
 * // Returns: { name: 1 }
 *
 * // Invalid field with validation
 * formatSortQuery('invalid:asc', { validFields: ['name', 'email'] })
 * // Throws: Error('Invalid sort field: invalid. Valid fields are: name, email')
 *
 * // Multiple fields not allowed by default
 * formatSortQuery('name:asc,createdAt:desc')
 * // Throws: Error('Only one sort field is allowed per request')
 *
 * // Allow multiple fields (legacy behavior)
 * formatSortQuery('name:asc,createdAt:desc', { singleFieldOnly: false })
 * // Returns: { name: 1, createdAt: -1 }
 * ```
 */
export function formatSortQuery(
  sortQuery: string | undefined,
  options: FormatSortQueryOptions = {}
): Record<string, 1 | -1> | undefined {
  if (!sortQuery || sortQuery.trim() === '') {
    return undefined;
  }

  const {
    validFields,
    throwOnInvalidField = true,
    singleFieldOnly = true,
  } = options;

  const sortObj: Record<string, 1 | -1> = {};
  const sortPairs = sortQuery
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Enforce single field sorting by default
  if (singleFieldOnly && sortPairs.length > 1) {
    throw new Error('Only one sort field is allowed per request');
  }

  for (const pair of sortPairs) {
    const [field, direction] = pair.split(':').map((s) => s.trim());

    if (!field) {
      throw new Error(
        `Invalid sort format: ${pair}. Expected format: field:direction`
      );
    }

    // Validate field if validFields is provided
    if (validFields && !validFields.includes(field)) {
      if (throwOnInvalidField) {
        throw new Error(
          `Invalid sort field: ${field}. Valid fields are: ${validFields.join(
            ', '
          )}`
        );
      }
      // Skip invalid field if not throwing
      continue;
    }

    // Validate direction
    if (!direction || (direction !== 'asc' && direction !== 'desc')) {
      throw new Error(
        `Invalid sort direction for ${field}: ${
          direction || 'missing'
        }. Must be "asc" or "desc"`
      );
    }

    sortObj[field] = direction === 'asc' ? 1 : -1;
  }

  return Object.keys(sortObj).length > 0 ? sortObj : undefined;
}

/**
 * Parse a fields query string into a MongoDB-compatible projection object
 *
 * @param fieldsQuery - Comma-separated list of field names
 * @param options - Optional configuration for validation
 * @returns MongoDB projection object with field names set to true
 *
 * @example
 * ```typescript
 * // Basic usage
 * formatFieldsQuery('name,email,createdAt')
 * // Returns: { name: true, email: true, createdAt: true }
 *
 * // With field validation
 * formatFieldsQuery('name,email', { validFields: ['name', 'email', 'createdAt'] })
 * // Returns: { name: true, email: true }
 *
 * // Invalid field with validation
 * formatFieldsQuery('invalid', { validFields: ['name', 'email'] })
 * // Throws: Error('Invalid field: invalid. Valid fields are: name, email')
 * ```
 */
export function formatFieldsQuery(
  fieldsQuery: string | undefined,
  options: FormatFieldsQueryOptions = {}
): Record<string, boolean> | undefined {
  if (!fieldsQuery || fieldsQuery.trim() === '') {
    return undefined;
  }

  const { validFields, throwOnInvalidField = true } = options;

  const fieldsObj: Record<string, boolean> = {};
  const fieldList = fieldsQuery
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  for (const field of fieldList) {
    // Validate field if validFields is provided
    if (validFields && !validFields.includes(field)) {
      if (throwOnInvalidField) {
        throw new Error(
          `Invalid field: ${field}. Valid fields are: ${validFields.join(', ')}`
        );
      }
      // Skip invalid field if not throwing
      continue;
    }

    fieldsObj[field] = true;
  }

  return Object.keys(fieldsObj).length > 0 ? fieldsObj : undefined;
}

/**
 * Parse a search query string into a structured object with field and value
 *
 * @param searchQuery - Search query string in format "field:value"
 * @param options - Optional configuration for validation
 * @returns Object containing the field and value, or undefined if no search query
 *
 * @example
 * ```typescript
 * // Basic usage
 * formatSearchQuery('name:john')
 * // Returns: { field: 'name', value: 'john' }
 *
 * // Keyword search (multi-field)
 * formatSearchQuery('keyword:technology')
 * // Returns: { field: 'keyword', value: 'technology' }
 *
 * // With field validation
 * formatSearchQuery('name:john', { validFields: ['name', 'email', 'keyword'] })
 * // Returns: { field: 'name', value: 'john' }
 *
 * // Invalid field with validation
 * formatSearchQuery('invalid:test', { validFields: ['name', 'email'] })
 * // Throws: Error('Invalid search field: invalid. Valid fields are: name, email')
 *
 * // Custom keyword field
 * formatSearchQuery('search:test', { keywordField: 'search' })
 * // Returns: { field: 'search', value: 'test' }
 * ```
 */
export function formatSearchQuery(
  searchQuery: string | undefined,
  options: FormatSearchQueryOptions = {}
): { field: string; value: string } | undefined {
  if (!searchQuery || searchQuery.trim() === '') {
    return undefined;
  }

  const {
    validFields,
    throwOnInvalidField = true,
    keywordField = 'keyword',
  } = options;

  // Split by the first colon to handle values that contain colons
  const colonIndex = searchQuery.indexOf(':');

  if (colonIndex === -1) {
    throw new Error(
      `Invalid search format: ${searchQuery}. Expected format: field:value`
    );
  }

  const field = searchQuery.substring(0, colonIndex).trim();
  const value = searchQuery.substring(colonIndex + 1).trim();

  if (!field) {
    throw new Error(
      `Invalid search format: ${searchQuery}. Field cannot be empty`
    );
  }

  if (!value) {
    throw new Error(
      `Invalid search format: ${searchQuery}. Value cannot be empty`
    );
  }

  // Validate field if validFields is provided
  // Allow the keyword field even if not explicitly in validFields
  if (validFields && !validFields.includes(field) && field !== keywordField) {
    if (throwOnInvalidField) {
      throw new Error(
        `Invalid search field: ${field}. Valid fields are: ${validFields.join(
          ', '
        )}${keywordField ? `, ${keywordField}` : ''}`
      );
    }
    return undefined;
  }

  return { field, value };
}

/**
 * Parse a filter query string into a structured object with field and value
 *
 * @param filterQuery - Filter query string in format "field:value"
 * @param options - Optional configuration for validation
 * @returns Object containing the field and value, or undefined if no filter query
 *
 * @example
 * ```typescript
 * // Basic usage
 * formatFilterQuery('status:active')
 * // Returns: { field: 'status', value: 'active' }
 *
 * // With field validation
 * formatFilterQuery('status:active', { validFields: ['status', 'type'] })
 * // Returns: { field: 'status', value: 'active' }
 *
 * // Invalid field with validation
 * formatFilterQuery('invalid:test', { validFields: ['status', 'type'] })
 * // Throws: Error('Invalid filter field: invalid. Valid fields are: status, type')
 * ```
 */
export function formatFilterQuery(
  filterQuery: string | undefined,
  options: FormatFilterQueryOptions = {}
): Record<string, string> | undefined {
  if (!filterQuery || filterQuery.trim() === '') {
    return undefined;
  }

  const { validFields, throwOnInvalidField = true } = options;

  // Split by the first colon to handle values that contain colons
  const colonIndex = filterQuery.indexOf(':');

  if (colonIndex === -1) {
    throw new Error(
      `Invalid filter format: ${filterQuery}. Expected format: field:value`
    );
  }

  const field = filterQuery.substring(0, colonIndex).trim();
  const value = filterQuery.substring(colonIndex + 1).trim();

  if (!field) {
    throw new Error(
      `Invalid filter format: ${filterQuery}. Field cannot be empty`
    );
  }

  if (!value) {
    throw new Error(
      `Invalid filter format: ${filterQuery}. Value cannot be empty`
    );
  }

  // Validate field if validFields is provided
  if (validFields && !validFields.includes(field)) {
    if (throwOnInvalidField) {
      throw new Error(
        `Invalid filter field: ${field}. Valid fields are: ${validFields.join(
          ', '
        )}`
      );
    }
    return undefined;
  }

  return { [field]: value };
}

/**
 * Parse a filter query string with multiple filters into an array of field-value pairs
 *
 * @param filterQuery - Filter query string in format "field:value" or "field1:value1,field2:value2"
 * @param options - Optional configuration for validation
 * @returns Array of objects containing field and value, or undefined if no filter query
 *
 * @example
 * ```typescript
 * // Single filter
 * formatMultiFilterQuery('status:active')
 * // Returns: [{ field: 'status', value: 'active' }]
 *
 * // Multiple filters
 * formatMultiFilterQuery('userID:123,status:complete')
 * // Returns: [{ field: 'userID', value: '123' }, { field: 'status', value: 'complete' }]
 *
 * // With field validation
 * formatMultiFilterQuery('userID:123,status:active', { validFields: ['userID', 'status', 'type'] })
 * // Returns: [{ field: 'userID', value: '123' }, { field: 'status', value: 'active' }]
 *
 * // Invalid field with validation
 * formatMultiFilterQuery('invalid:test', { validFields: ['status', 'type'] })
 * // Throws: Error('Invalid filter field: invalid. Valid fields are: status, type')
 * ```
 */
export function formatMultiFilterQuery(
  filterQuery: string | undefined,
  options: FormatFilterQueryOptions = {}
): Record<string, string>[] | undefined {
  if (!filterQuery || filterQuery.trim() === '') {
    return undefined;
  }

  const { validFields, throwOnInvalidField = true } = options;

  // Split by comma to get individual filters
  const filterPairs = filterQuery
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  const results: Record<string, string>[] = [];

  for (const pair of filterPairs) {
    // Split by the first colon to handle values that contain colons
    const colonIndex = pair.indexOf(':');

    if (colonIndex === -1) {
      throw new Error(
        `Invalid filter format: ${pair}. Expected format: field:value`
      );
    }

    const field = pair.substring(0, colonIndex).trim();
    const value = pair.substring(colonIndex + 1).trim();

    if (!field) {
      throw new Error(`Invalid filter format: ${pair}. Field cannot be empty`);
    }

    if (!value) {
      throw new Error(`Invalid filter format: ${pair}. Value cannot be empty`);
    }

    // Validate field if validFields is provided
    if (validFields && !validFields.includes(field)) {
      if (throwOnInvalidField) {
        throw new Error(
          `Invalid filter field: ${field}. Valid fields are: ${validFields.join(
            ', '
          )}`
        );
      }
      // Skip invalid field if not throwing
      continue;
    }

    results.push({ [field]: value });
  }

  return results.length > 0 ? results : undefined;
}
