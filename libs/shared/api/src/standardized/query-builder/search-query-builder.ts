/**
 * Search Query Builder Utilities
 *
 * Generic utility functions for building MongoDB search queries
 * from structured search objects.
 */

import { escapeRegex } from './escape-regex';

/**
 * MongoDB filter query type - represents a MongoDB filter object
 * that can contain field queries and MongoDB operators like $regex, $or, etc.
 */
type FilterQuery<T> = {
  [K in keyof T]?: T[K] | { $regex?: string; $options?: string } | FilterQuery<T[K]>;
} & {
  $or?: FilterQuery<T>[];
  $and?: FilterQuery<T>[];
  [key: string]: unknown;
};

/**
 * Options for building search queries
 */
export interface BuildSearchQueryOptions {
  throwOnInvalidField?: boolean;
  /**
   * Object defining which fields are searchable
   * Example: ['name', 'email']
   */
  searchableFields: string[];
  /**
   * The keyword field name that triggers multi-field search
   * @default 'keyword'
   */
  keywordField?: string;
  /**
   * Whether to use case-insensitive search
   * @default true
   */
  caseInsensitive?: boolean;
  /**
   * Whether to use prefix search (anchored with ^) for index optimization
   * - true: Uses ^value pattern (index-friendly, matches from start)
   * - false: Uses value pattern (full scan, matches anywhere)
   * @default true
   */
  prefixSearch?: boolean;
}

/**
 * Build MongoDB search query from search parameters
 *
 * @param search - Search object with field-value pairs or keyword search
 * @param options - Configuration for searchable fields and keyword field
 * @returns MongoDB filter query with $or conditions for multiple fields, or null if no valid search
 *
 * @example
 * // Single field search (prefix mode - default, index-friendly)
 * buildSearchQuery({ name: 'john' }, { searchableFields: ['name', 'email'] })
 * // Returns: { name: { $regex: '^john', $options: 'i' } }
 *
 * @example
 * // Keyword search (searches across all searchable fields)
 * buildSearchQuery({ keyword: 'tech' }, { searchableFields: ['name', 'description'] })
 * // Returns: { $or: [{ name: { $regex: '^tech', $options: 'i' } }, { description: { $regex: '^tech', $options: 'i' } }] }
 *
 * @example
 * // Multiple field search
 * buildSearchQuery({ name: 'john', email: 'example' }, { searchableFields: ['name', 'email'] })
 * // Returns: { $or: [{ name: { $regex: '^john', $options: 'i' } }, { email: { $regex: '^example', $options: 'i' } }] }
 *
 * @example
 * // With custom keyword field
 * buildSearchQuery({ search: 'test' }, { searchableFields: ['name'], keywordField: 'search' })
 * // Returns: { name: { $regex: '^test', $options: 'i' } }
 *
 * @example
 * // Contains search (prefixSearch: false - full scan, matches anywhere)
 * buildSearchQuery({ name: 'john' }, { searchableFields: ['name'], prefixSearch: false })
 * // Returns: { name: { $regex: 'john', $options: 'i' } }
 */
export function buildSearchQuery<T = unknown>(
  search: Record<string, string> | undefined,
  options: BuildSearchQueryOptions
): FilterQuery<T> | null {
  if (!search) {
    return null;
  }

  const {
    searchableFields,
    keywordField = 'keyword',
    caseInsensitive = true,
    prefixSearch = false,
  } = options;
  const entries = Object.entries(search);

  if (entries.length === 0) {
    return null;
  }

  const orConditions: FilterQuery<T>[] = [];
  const regexOptions = caseInsensitive ? 'i' : undefined;
  const regexPrefix = prefixSearch ? '^' : '';

  for (const [field, value] of entries) {
    if (field === keywordField) {
      // Keyword search: search across all searchable fields
      searchableFields.forEach((fieldName) => {
        const condition: Record<string, unknown> = {
          $regex: `${regexPrefix}${escapeRegex(value)}`,
        };
        if (regexOptions) {
          condition.$options = regexOptions;
        }
        orConditions.push({
          [fieldName]: condition,
        } as FilterQuery<T>);
      });
    } else {
      // Specific field search
      const condition: Record<string, unknown> = {
        $regex: `${regexPrefix}${escapeRegex(value)}`,
      };
      if (regexOptions) {
        condition.$options = regexOptions;
      }
      orConditions.push({
        [field]: condition,
      } as FilterQuery<T>);
    }
  }

  if (orConditions.length === 0) {
    return null;
  }

  // If only one condition, return it directly (optimization)
  if (orConditions.length === 1) {
    return orConditions[0];
  }

  // Multiple conditions: use $or
  return { $or: orConditions } as FilterQuery<T>;
}
