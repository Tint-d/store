/**
 * Query Builder Module
 *
 * Exports reusable utility functions for building MongoDB queries
 * from structured search parameters.
 */

export {
  buildSearchQuery,
  type BuildSearchQueryOptions,
} from './search-query-builder';

export { escapeRegex } from './escape-regex';
