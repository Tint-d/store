/**
 * User Query Input Types
 *
 * Type definitions for parsed query parameters used in user queries.
 * These types represent the controller-compatible objects after parsing
 * validated query string parameters.
 */

/**
 * User sort input - MongoDB sort object
 */
export type UserSortInput = Record<string, 1 | -1> | undefined;

/**
 * User fields input - MongoDB projection object
 */
export type UserFieldsInput = Record<string, boolean> | undefined;

/**
 * User search input - Object with field-value pairs for search
 */
export type UserSearchInput = Record<string, string> | undefined;

/**
 * User filter input - Object with field-value pairs for filtering
 */
export type UserFilterInput = Record<string, string> | undefined;
