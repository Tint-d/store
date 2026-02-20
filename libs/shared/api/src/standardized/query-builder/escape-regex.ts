/**
 * Regex Escape Utilities
 *
 * Security utilities for escaping special regex metacharacters in user input
 * before using them in MongoDB $regex queries. Prevents ReDoS attacks and
 * NoSQL injection vulnerabilities.
 */

/**
 * Escape special regex metacharacters in user input
 *
 * @param input - User-provided string that will be used in a regex pattern
 * @returns Escaped string with all regex metacharacters properly escaped
 *
 * @description
 * Escapes all regex metacharacters to prevent:
 * - ReDoS (Regular Expression Denial of Service) attacks via catastrophic backtracking
 * - NoSQL injection via regex metacharacter manipulation
 * - Query logic alteration through unescaped special characters
 *
 * **Escaped characters:** . * + ? ^ $ { } [ ] \ | ( )
 *
 * @example
 * // Basic escaping
 * escapeRegex('user@example.com')
 * // Returns: 'user@example\\.com'
 *
 * @example
 * // Escaping ReDoS patterns
 * escapeRegex('(a+)+$')
 * // Returns: '\\(a\\+\\)\\+\\$'
 *
 * @example
 * // Handling null/undefined
 * escapeRegex(null)
 * // Returns: ''
 *
 * @example
 * // Escaping complex URL patterns
 * escapeRegex('https://example.com/path?query=value')
 * // Returns: 'https://example\\.com/path\\?query=value'
 *
 * @example
 * // Using in MongoDB regex query
 * const escaped = escapeRegex(userInput);
 * const query = { name: { $regex: escaped, $options: 'i' } };
 */
export function escapeRegex(input: string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!input) {
    return '';
  }

  // Escape all regex metacharacters: . * + ? ^ $ { } [ ] \ | ( )
  // Using double backslash in regex pattern to match literal backslash
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
