import {
  buildSearchQuery,
  type BuildSearchQueryOptions,
} from './search-query-builder.js';

describe('buildSearchQuery', () => {
  describe('Null/undefined handling', () => {
    it('should return null when search is undefined', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
      };
      const result = buildSearchQuery(undefined, options);
      expect(result).toBeNull();
    });

    it('should return null when search is empty object', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
      };
      const result = buildSearchQuery({}, options);
      expect(result).toBeNull();
    });

    it('should return null when no valid conditions are generated', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: [],
      };
      const result = buildSearchQuery({ keyword: 'test' }, options);
      expect(result).toBeNull();
    });
  });

  describe('Single field search', () => {
    it('should return direct query without $or for single field (optimization)', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
      };
      const result = buildSearchQuery({ name: 'john' }, options);

      expect(result).toEqual({
        name: { $regex: 'john', $options: 'i' },
      });
      expect(result).not.toHaveProperty('$or');
    });

    it('should use case-insensitive search by default', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name'],
      };
      const result = buildSearchQuery({ name: 'John' }, options);

      expect(result).toEqual({
        name: { $regex: 'John', $options: 'i' },
      });
    });

    it('should use case-sensitive search when caseInsensitive is false', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name'],
        caseInsensitive: false,
      };
      const result = buildSearchQuery({ name: 'John' }, options);

      expect(result).toEqual({
        name: { $regex: 'John' },
      });
      expect(result).not.toHaveProperty('$options');
    });

    it('should handle search field not in searchableFields', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
      };
      const result = buildSearchQuery({ customField: 'value' }, options);

      expect(result).toEqual({
        customField: { $regex: 'value', $options: 'i' },
      });
    });

    it('should escape special regex characters in search value', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['email'],
      };
      const result = buildSearchQuery({ email: 'user@example.com' }, options);

      // The dot should be escaped to prevent it from matching any character
      expect(result).toEqual({
        email: { $regex: 'user@example\\.com', $options: 'i' },
      });
    });

    it('should escape URL-like values with multiple special characters', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['url'],
      };
      const result = buildSearchQuery(
        { url: 'https://example.com/path?query=value' },
        options
      );

      // Dots and question marks should be escaped
      expect(result).toEqual({
        url: {
          $regex: 'https://example\\.com/path\\?query=value',
          $options: 'i',
        },
      });
    });

    it('should escape all regex metacharacters (parentheses, brackets, asterisk, plus)', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['pattern'],
      };
      const result = buildSearchQuery({ pattern: 'test(.*)+[a-z]$' }, options);

      // All regex metacharacters should be escaped
      expect(result).toEqual({
        pattern: {
          $regex: 'test\\(\\.\\*\\)\\+\\[a-z\\]\\$',
          $options: 'i',
        },
      });
    });

    it('should escape ReDoS attack patterns', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['input'],
      };
      const result = buildSearchQuery({ input: '(a+)+$' }, options);

      // ReDoS pattern should be escaped to prevent catastrophic backtracking
      expect(result).toEqual({
        input: { $regex: '\\(a\\+\\)\\+\\$', $options: 'i' },
      });
    });

    it('should escape pipe and caret characters', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['text'],
      };
      const result = buildSearchQuery(
        { text: 'option1|option2^start' },
        options
      );

      // Pipe and caret should be escaped
      expect(result).toEqual({
        text: { $regex: 'option1\\|option2\\^start', $options: 'i' },
      });
    });

    it('should escape curly braces used in regex quantifiers', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['text'],
      };
      const result = buildSearchQuery({ text: 'a{3,5}' }, options);

      // Curly braces should be escaped
      expect(result).toEqual({
        text: { $regex: 'a\\{3,5\\}', $options: 'i' },
      });
    });

    it('should escape backslash characters', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['path'],
      };
      const result = buildSearchQuery({ path: 'C:\\Users\\test' }, options);

      // Backslashes should be escaped
      expect(result).toEqual({
        path: { $regex: 'C:\\\\Users\\\\test', $options: 'i' },
      });
    });
  });

  describe('Keyword search', () => {
    it('should search across all searchable fields when using default keyword field', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'description'],
      };
      const result = buildSearchQuery({ keyword: 'tech' }, options);

      expect(result).toEqual({
        $or: [
          { name: { $regex: 'tech', $options: 'i' } },
          { description: { $regex: 'tech', $options: 'i' } },
        ],
      });
    });

    it('should use custom keyword field when specified', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
        keywordField: 'search',
      };
      const result = buildSearchQuery({ search: 'test' }, options);

      expect(result).toEqual({
        $or: [
          { name: { $regex: 'test', $options: 'i' } },
          { email: { $regex: 'test', $options: 'i' } },
        ],
      });
    });

    it('should return single field query when keyword searches only one searchable field', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name'],
      };
      const result = buildSearchQuery({ keyword: 'john' }, options);

      expect(result).toEqual({
        name: { $regex: 'john', $options: 'i' },
      });
      expect(result).not.toHaveProperty('$or');
    });

    it('should use case-insensitive keyword search by default', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
      };
      const result = buildSearchQuery({ keyword: 'TEST' }, options);

      expect(result).toEqual({
        $or: [
          { name: { $regex: 'TEST', $options: 'i' } },
          { email: { $regex: 'TEST', $options: 'i' } },
        ],
      });
    });

    it('should use case-sensitive keyword search when caseInsensitive is false', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
        caseInsensitive: false,
      };
      const result = buildSearchQuery({ keyword: 'TEST' }, options);

      expect(result).toEqual({
        $or: [{ name: { $regex: 'TEST' } }, { email: { $regex: 'TEST' } }],
      });
    });

    it('should handle keyword search with multiple searchable fields', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email', 'description', 'address'],
      };
      const result = buildSearchQuery({ keyword: 'search' }, options);

      expect(result).toHaveProperty('$or');
      expect((result as { $or: unknown[] }).$or).toHaveLength(4);
      expect(result).toEqual({
        $or: [
          { name: { $regex: 'search', $options: 'i' } },
          { email: { $regex: 'search', $options: 'i' } },
          { description: { $regex: 'search', $options: 'i' } },
          { address: { $regex: 'search', $options: 'i' } },
        ],
      });
    });

    it('should escape special characters in keyword search across all fields', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email', 'description'],
      };
      const result = buildSearchQuery(
        { keyword: 'test.user+special' },
        options
      );

      // Special characters should be escaped in all fields
      expect(result).toEqual({
        $or: [
          { name: { $regex: 'test\\.user\\+special', $options: 'i' } },
          { email: { $regex: 'test\\.user\\+special', $options: 'i' } },
          { description: { $regex: 'test\\.user\\+special', $options: 'i' } },
        ],
      });
    });
  });

  describe('Multiple field search', () => {
    it('should return $or query when searching multiple fields', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
      };
      const result = buildSearchQuery(
        { name: 'john', email: 'example' },
        options
      );

      expect(result).toEqual({
        $or: [
          { name: { $regex: 'john', $options: 'i' } },
          { email: { $regex: 'example', $options: 'i' } },
        ],
      });
    });

    it('should handle mixed field and keyword search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email', 'description'],
      };
      const result = buildSearchQuery(
        { name: 'john', keyword: 'tech' },
        options
      );

      expect(result).toHaveProperty('$or');
      expect((result as { $or: unknown[] }).$or).toHaveLength(4);

      // The order depends on object key iteration
      // Just verify all conditions are present
      const orConditions = (result as { $or: Array<Record<string, unknown>> })
        .$or;
      expect(orConditions).toContainEqual({
        name: { $regex: 'john', $options: 'i' },
      });
      expect(orConditions).toContainEqual({
        name: { $regex: 'tech', $options: 'i' },
      });
      expect(orConditions).toContainEqual({
        email: { $regex: 'tech', $options: 'i' },
      });
      expect(orConditions).toContainEqual({
        description: { $regex: 'tech', $options: 'i' },
      });
    });

    it('should use case-insensitive for multiple fields by default', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email', 'city'],
      };
      const result = buildSearchQuery(
        { name: 'John', email: 'EXAMPLE', city: 'NYC' },
        options
      );

      expect(result).toEqual({
        $or: [
          { name: { $regex: 'John', $options: 'i' } },
          { email: { $regex: 'EXAMPLE', $options: 'i' } },
          { city: { $regex: 'NYC', $options: 'i' } },
        ],
      });
    });

    it('should use case-sensitive for multiple fields when caseInsensitive is false', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
        caseInsensitive: false,
      };
      const result = buildSearchQuery({ name: 'John', email: 'test' }, options);

      expect(result).toEqual({
        $or: [{ name: { $regex: 'John' } }, { email: { $regex: 'test' } }],
      });
    });

    it('should escape special characters in multiple field search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email', 'website'],
      };
      const result = buildSearchQuery(
        {
          name: 'John (Developer)',
          email: 'user@example.com',
          website: 'https://example.com/profile?id=123',
        },
        options
      );

      // All special characters in all fields should be escaped
      expect(result).toEqual({
        $or: [
          { name: { $regex: 'John \\(Developer\\)', $options: 'i' } },
          { email: { $regex: 'user@example\\.com', $options: 'i' } },
          {
            website: {
              $regex: 'https://example\\.com/profile\\?id=123',
              $options: 'i',
            },
          },
        ],
      });
    });
  });

  describe('Case sensitivity', () => {
    it('should explicitly set caseInsensitive to true', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name'],
        caseInsensitive: true,
      };
      const result = buildSearchQuery({ name: 'test' }, options);

      expect(result).toEqual({
        name: { $regex: 'test', $options: 'i' },
      });
    });

    it('should respect caseInsensitive false for keyword search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
        caseInsensitive: false,
      };
      const result = buildSearchQuery({ keyword: 'Search' }, options);

      expect(result).toEqual({
        $or: [{ name: { $regex: 'Search' } }, { email: { $regex: 'Search' } }],
      });

      const conditions = (result as { $or: Array<Record<string, unknown>> })
        .$or;
      conditions.forEach((condition) => {
        const value = Object.values(condition)[0] as Record<string, unknown>;
        expect(value).not.toHaveProperty('$options');
      });
    });

    it('should handle case-sensitive single field without $options property', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name'],
        caseInsensitive: false,
      };
      const result = buildSearchQuery({ name: 'TestValue' }, options);

      expect(result).toEqual({
        name: { $regex: 'TestValue' },
      });

      const nameCondition = (result as Record<string, Record<string, unknown>>)
        .name;
      expect(nameCondition).toHaveProperty('$regex', 'TestValue');
      expect(nameCondition).not.toHaveProperty('$options');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty searchableFields with keyword search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: [],
      };
      const result = buildSearchQuery({ keyword: 'test' }, options);

      expect(result).toBeNull();
    });

    it('should handle empty searchableFields with field search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: [],
      };
      const result = buildSearchQuery({ name: 'test' }, options);

      expect(result).toEqual({
        name: { $regex: 'test', $options: 'i' },
      });
    });

    it('should handle search values with whitespace', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'description'],
      };
      const result = buildSearchQuery(
        { name: '  test  ', keyword: '  search  ' },
        options
      );

      // Whitespace should be preserved in the search
      expect(result).toHaveProperty('$or');
      expect((result as { $or: unknown[] }).$or).toHaveLength(3);
    });

    it('should handle very long search strings', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['content'],
      };
      const longString = 'a'.repeat(1000);
      const result = buildSearchQuery({ content: longString }, options);

      expect(result).toEqual({
        content: { $regex: longString, $options: 'i' },
      });
    });

    it('should handle unicode characters in search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name'],
      };
      const result = buildSearchQuery({ name: '日本語' }, options);

      expect(result).toEqual({
        name: { $regex: '日本語', $options: 'i' },
      });
    });

    it('should handle emoji in search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['message'],
      };
      const result = buildSearchQuery({ message: 'hello 👋 world' }, options);

      expect(result).toEqual({
        message: { $regex: 'hello 👋 world', $options: 'i' },
      });
    });

    it('should handle mixed case with keyword field', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email'],
        keywordField: 'q',
      };
      const result = buildSearchQuery({ q: 'TeSt' }, options);

      expect(result).toEqual({
        $or: [
          { name: { $regex: 'TeSt', $options: 'i' } },
          { email: { $regex: 'TeSt', $options: 'i' } },
        ],
      });
    });

    it('should handle numeric values in search', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['id', 'code'],
      };
      const result = buildSearchQuery({ id: '123' }, options);

      expect(result).toEqual({
        id: { $regex: '123', $options: 'i' },
      });
    });

    it('should combine multiple conditions into $or array', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['name', 'email', 'phone'],
      };
      const result = buildSearchQuery(
        { name: 'john', email: 'john@example.com', phone: '555-1234' },
        options
      );

      expect(result).toHaveProperty('$or');
      expect((result as { $or: unknown[] }).$or).toHaveLength(3);
    });

    it('should handle single search field with no $or optimization', () => {
      const options: BuildSearchQueryOptions = {
        searchableFields: ['email'],
      };
      const result = buildSearchQuery({ email: 'test@example.com' }, options);

      expect(result).toEqual({
        email: { $regex: 'test@example\\.com', $options: 'i' },
      });
      expect(result).not.toHaveProperty('$or');
    });
  });
});
