import {
  formatFieldsQuery,
  formatSearchQuery,
  formatSortQuery,
  type FormatFieldsQueryOptions,
  type FormatSearchQueryOptions,
  type FormatSortQueryOptions,
} from './format-query.js';

describe('Format Query Utilities', () => {
  describe('formatSortQuery', () => {
    it('should parse basic sort query with ascending order', () => {
      const result = formatSortQuery('name:asc');
      expect(result).toEqual({ name: 1 });
    });

    it('should parse basic sort query with descending order', () => {
      const result = formatSortQuery('createdAt:desc');
      expect(result).toEqual({ createdAt: -1 });
    });

    it('should parse multiple sort fields when singleFieldOnly is false', () => {
      const result = formatSortQuery('name:asc,createdAt:desc', {
        singleFieldOnly: false,
      });
      expect(result).toEqual({ name: 1, createdAt: -1 });
    });

    it('should return undefined for empty string', () => {
      const result = formatSortQuery('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = formatSortQuery(undefined);
      expect(result).toBeUndefined();
    });

    it('should throw error for invalid format', () => {
      expect(() => formatSortQuery('name')).toThrow(
        'Invalid sort direction for name: missing. Must be "asc" or "desc"'
      );
    });

    it('should throw error for invalid direction', () => {
      expect(() => formatSortQuery('name:invalid')).toThrow(
        'Invalid sort direction for name: invalid. Must be "asc" or "desc"'
      );
    });

    it('should validate fields when validFields is provided', () => {
      const options: FormatSortQueryOptions = {
        validFields: ['name', 'email', 'createdAt'],
      };
      const result = formatSortQuery('name:asc', options);
      expect(result).toEqual({ name: 1 });
    });

    it('should throw error for invalid field with validation', () => {
      const options: FormatSortQueryOptions = {
        validFields: ['name', 'email'],
      };
      expect(() => formatSortQuery('invalidField:asc', options)).toThrow(
        'Invalid sort field: invalidField. Valid fields are: name, email'
      );
    });

    it('should skip invalid field when throwOnInvalidField is false', () => {
      const options: FormatSortQueryOptions = {
        validFields: ['name', 'email'],
        throwOnInvalidField: false,
        singleFieldOnly: false,
      };
      const result = formatSortQuery('invalidField:asc,name:desc', options);
      expect(result).toEqual({ name: -1 });
    });
  });

  describe('formatFieldsQuery', () => {
    it('should parse basic fields query', () => {
      const result = formatFieldsQuery('name,email');
      expect(result).toEqual({ name: true, email: true });
    });

    it('should parse single field', () => {
      const result = formatFieldsQuery('name');
      expect(result).toEqual({ name: true });
    });

    it('should return undefined for empty string', () => {
      const result = formatFieldsQuery('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = formatFieldsQuery(undefined);
      expect(result).toBeUndefined();
    });

    it('should validate fields when validFields is provided', () => {
      const options: FormatFieldsQueryOptions = {
        validFields: ['name', 'email', 'createdAt'],
      };
      const result = formatFieldsQuery('name,email', options);
      expect(result).toEqual({ name: true, email: true });
    });

    it('should throw error for invalid field with validation', () => {
      const options: FormatFieldsQueryOptions = {
        validFields: ['name', 'email'],
      };
      expect(() => formatFieldsQuery('invalidField', options)).toThrow(
        'Invalid field: invalidField. Valid fields are: name, email'
      );
    });

    it('should skip invalid field when throwOnInvalidField is false', () => {
      const options: FormatFieldsQueryOptions = {
        validFields: ['name', 'email'],
        throwOnInvalidField: false,
      };
      const result = formatFieldsQuery('invalidField,name', options);
      expect(result).toEqual({ name: true });
    });

    it('should handle fields with whitespace', () => {
      const result = formatFieldsQuery(' name , email , createdAt ');
      expect(result).toEqual({ name: true, email: true, createdAt: true });
    });
  });

  describe('formatSearchQuery', () => {
    it('should parse basic search query', () => {
      const result = formatSearchQuery('name:john');
      expect(result).toEqual({ field: 'name', value: 'john' });
    });

    it('should parse keyword search', () => {
      const result = formatSearchQuery('keyword:technology');
      expect(result).toEqual({ field: 'keyword', value: 'technology' });
    });

    it('should handle search values with spaces', () => {
      const result = formatSearchQuery('name:John Doe');
      expect(result).toEqual({ field: 'name', value: 'John Doe' });
    });

    it('should handle search values with colons', () => {
      const result = formatSearchQuery('url:https://example.com');
      expect(result).toEqual({ field: 'url', value: 'https://example.com' });
    });

    it('should return undefined for empty string', () => {
      const result = formatSearchQuery('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = formatSearchQuery(undefined);
      expect(result).toBeUndefined();
    });

    it('should throw error for missing colon', () => {
      expect(() => formatSearchQuery('namevalue')).toThrow(
        'Invalid search format: namevalue. Expected format: field:value'
      );
    });

    it('should throw error for empty field', () => {
      expect(() => formatSearchQuery(':value')).toThrow(
        'Invalid search format: :value. Field cannot be empty'
      );
    });

    it('should throw error for empty value', () => {
      expect(() => formatSearchQuery('name:')).toThrow(
        'Invalid search format: name:. Value cannot be empty'
      );
    });

    it('should validate field when validFields is provided', () => {
      const options: FormatSearchQueryOptions = {
        validFields: ['name', 'email', 'description'],
      };
      const result = formatSearchQuery('name:john', options);
      expect(result).toEqual({ field: 'name', value: 'john' });
    });

    it('should allow keyword field even if not in validFields', () => {
      const options: FormatSearchQueryOptions = {
        validFields: ['name', 'email'],
        keywordField: 'keyword',
      };
      const result = formatSearchQuery('keyword:search', options);
      expect(result).toEqual({ field: 'keyword', value: 'search' });
    });

    it('should throw error for invalid field with validation', () => {
      const options: FormatSearchQueryOptions = {
        validFields: ['name', 'email'],
      };
      expect(() => formatSearchQuery('invalidField:test', options)).toThrow(
        'Invalid search field: invalidField. Valid fields are: name, email, keyword'
      );
    });

    it('should return undefined for invalid field when throwOnInvalidField is false', () => {
      const options: FormatSearchQueryOptions = {
        validFields: ['name', 'email'],
        throwOnInvalidField: false,
      };
      const result = formatSearchQuery('invalidField:test', options);
      expect(result).toBeUndefined();
    });

    it('should support custom keyword field', () => {
      const options: FormatSearchQueryOptions = {
        keywordField: 'search',
      };
      const result = formatSearchQuery('search:technology', options);
      expect(result).toEqual({ field: 'search', value: 'technology' });
    });

    it('should handle field names with underscores', () => {
      const result = formatSearchQuery('_id:507f1f77bcf86cd799439011');
      expect(result).toEqual({
        field: '_id',
        value: '507f1f77bcf86cd799439011',
      });
    });

    it('should handle field names with numbers', () => {
      const result = formatSearchQuery('field123:value');
      expect(result).toEqual({ field: 'field123', value: 'value' });
    });

    it('should handle boolean-like values', () => {
      const result = formatSearchQuery('isDeleted:false');
      expect(result).toEqual({ field: 'isDeleted', value: 'false' });
    });

    it('should handle numeric-like values', () => {
      const result = formatSearchQuery('age:25');
      expect(result).toEqual({ field: 'age', value: '25' });
    });

    it('should handle complex search values with special characters', () => {
      const result = formatSearchQuery('email:user@example.com');
      expect(result).toEqual({ field: 'email', value: 'user@example.com' });
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a typical API query scenario', () => {
      const sortQuery = 'name:asc,createdAt:desc';
      const fieldsQuery = 'name,email,createdAt';
      const searchQuery = 'keyword:technology';

      const sort = formatSortQuery(sortQuery, { singleFieldOnly: false });
      const fields = formatFieldsQuery(fieldsQuery);
      const search = formatSearchQuery(searchQuery);

      expect(sort).toEqual({ name: 1, createdAt: -1 });
      expect(fields).toEqual({ name: true, email: true, createdAt: true });
      expect(search).toEqual({ field: 'keyword', value: 'technology' });
    });

    it('should handle all optional parameters being undefined', () => {
      const sort = formatSortQuery(undefined);
      const fields = formatFieldsQuery(undefined);
      const search = formatSearchQuery(undefined);

      expect(sort).toBeUndefined();
      expect(fields).toBeUndefined();
      expect(search).toBeUndefined();
    });
  });
});
