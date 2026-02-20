import { escapeRegex } from './escape-regex.js';

describe('escapeRegex', () => {
  describe('Null/undefined/empty handling', () => {
    it('should return empty string for null input', () => {
      const result = escapeRegex(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = escapeRegex(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty string input', () => {
      const result = escapeRegex('');
      expect(result).toBe('');
    });
  });

  describe('Individual metacharacter escaping', () => {
    it('should escape dot (.) character', () => {
      const result = escapeRegex('.');
      expect(result).toBe('\\.');
    });

    it('should escape asterisk (*) character', () => {
      const result = escapeRegex('*');
      expect(result).toBe('\\*');
    });

    it('should escape plus (+) character', () => {
      const result = escapeRegex('+');
      expect(result).toBe('\\+');
    });

    it('should escape question mark (?) character', () => {
      const result = escapeRegex('?');
      expect(result).toBe('\\?');
    });

    it('should escape caret (^) character', () => {
      const result = escapeRegex('^');
      expect(result).toBe('\\^');
    });

    it('should escape dollar sign ($) character', () => {
      const result = escapeRegex('$');
      expect(result).toBe('\\$');
    });

    it('should escape opening brace ({) character', () => {
      const result = escapeRegex('{');
      expect(result).toBe('\\{');
    });

    it('should escape closing brace (}) character', () => {
      const result = escapeRegex('}');
      expect(result).toBe('\\}');
    });

    it('should escape opening bracket ([) character', () => {
      const result = escapeRegex('[');
      expect(result).toBe('\\[');
    });

    it('should escape closing bracket (]) character', () => {
      const result = escapeRegex(']');
      expect(result).toBe('\\]');
    });

    it('should escape backslash (\\) character', () => {
      const result = escapeRegex('\\');
      expect(result).toBe('\\\\');
    });

    it('should escape pipe (|) character', () => {
      const result = escapeRegex('|');
      expect(result).toBe('\\|');
    });

    it('should escape opening parenthesis (() character', () => {
      const result = escapeRegex('(');
      expect(result).toBe('\\(');
    });

    it('should escape closing parenthesis ()) character', () => {
      const result = escapeRegex(')');
      expect(result).toBe('\\)');
    });
  });

  describe('Multiple metacharacters escaping', () => {
    it('should escape all metacharacters in a single string', () => {
      const result = escapeRegex('.*+?^${}()|[]\\');
      expect(result).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('should escape multiple dots', () => {
      const result = escapeRegex('...');
      expect(result).toBe('\\.\\.\\.');
    });

    it('should escape multiple asterisks', () => {
      const result = escapeRegex('***');
      expect(result).toBe('\\*\\*\\*');
    });

    it('should escape mixed metacharacters', () => {
      const result = escapeRegex('(.*)+');
      expect(result).toBe('\\(\\.\\*\\)\\+');
    });
  });

  describe('ReDoS pattern prevention', () => {
    it('should escape catastrophic backtracking pattern (a+)+$', () => {
      const result = escapeRegex('(a+)+$');
      expect(result).toBe('\\(a\\+\\)\\+\\$');
    });

    it('should escape nested quantifier pattern (a*)*', () => {
      const result = escapeRegex('(a*)*');
      expect(result).toBe('\\(a\\*\\)\\*');
    });

    it('should escape alternation with quantifiers (a+|b+)+', () => {
      const result = escapeRegex('(a+|b+)+');
      expect(result).toBe('\\(a\\+\\|b\\+\\)\\+');
    });

    it('should escape complex backtracking pattern (x+x+)+y', () => {
      const result = escapeRegex('(x+x+)+y');
      expect(result).toBe('\\(x\\+x\\+\\)\\+y');
    });

    it('should escape overlapping patterns with anchors ^(a|a)*$', () => {
      const result = escapeRegex('^(a|a)*$');
      expect(result).toBe('\\^\\(a\\|a\\)\\*\\$');
    });

    it('should escape nested groups with quantifiers ((a*)*)b', () => {
      const result = escapeRegex('((a*)*)b');
      expect(result).toBe('\\(\\(a\\*\\)\\*\\)b');
    });
  });

  describe('Real-world examples', () => {
    it('should escape email addresses', () => {
      const result = escapeRegex('user@example.com');
      expect(result).toBe('user@example\\.com');
    });

    it('should escape email with plus addressing', () => {
      const result = escapeRegex('user+tag@example.com');
      expect(result).toBe('user\\+tag@example\\.com');
    });

    it('should escape URLs with protocol', () => {
      const result = escapeRegex('https://example.com/path?query=value');
      expect(result).toBe('https://example\\.com/path\\?query=value');
    });

    it('should escape URLs with anchors', () => {
      const result = escapeRegex('https://example.com#section');
      expect(result).toBe('https://example\\.com#section');
    });

    it('should escape file paths with wildcards', () => {
      const result = escapeRegex('*.txt');
      expect(result).toBe('\\*\\.txt');
    });

    it('should escape regex-like search patterns', () => {
      const result = escapeRegex('[a-z]+');
      expect(result).toBe('\\[a-z\\]\\+');
    });

    it('should escape price ranges', () => {
      const result = escapeRegex('$100-$200');
      expect(result).toBe('\\$100-\\$200');
    });

    it('should escape mathematical expressions', () => {
      const result = escapeRegex('x^2 + y^2');
      expect(result).toBe('x\\^2 \\+ y\\^2');
    });
  });

  describe('Mixed alphanumeric and special characters', () => {
    it('should not escape alphanumeric characters', () => {
      const result = escapeRegex('abc123');
      expect(result).toBe('abc123');
    });

    it('should only escape special characters in mixed string', () => {
      const result = escapeRegex('hello.world');
      expect(result).toBe('hello\\.world');
    });

    it('should preserve spaces and escape special characters', () => {
      const result = escapeRegex('hello world (test)');
      expect(result).toBe('hello world \\(test\\)');
    });

    it('should handle underscores and hyphens (non-metacharacters)', () => {
      const result = escapeRegex('hello_world-123');
      expect(result).toBe('hello_world-123');
    });

    it('should escape metacharacters in sentence', () => {
      const result = escapeRegex('What is 2+2?');
      expect(result).toBe('What is 2\\+2\\?');
    });

    it('should handle mixed case with special characters', () => {
      const result = escapeRegex('HelloWorld.Test*123');
      expect(result).toBe('HelloWorld\\.Test\\*123');
    });
  });

  describe('Edge cases', () => {
    it('should handle string with only spaces', () => {
      const result = escapeRegex('   ');
      expect(result).toBe('   ');
    });

    it('should handle string with leading/trailing spaces', () => {
      const result = escapeRegex('  test  ');
      expect(result).toBe('  test  ');
    });

    it('should handle string with newlines', () => {
      const result = escapeRegex('line1\nline2');
      expect(result).toBe('line1\nline2');
    });

    it('should handle string with tabs', () => {
      const result = escapeRegex('col1\tcol2');
      expect(result).toBe('col1\tcol2');
    });

    it('should handle very long string with metacharacters', () => {
      const input = 'a'.repeat(100) + '.*+?' + 'b'.repeat(100);
      const result = escapeRegex(input);
      expect(result).toBe('a'.repeat(100) + '\\.\\*\\+\\?' + 'b'.repeat(100));
    });

    it('should handle single character string', () => {
      const result = escapeRegex('a');
      expect(result).toBe('a');
    });

    it('should handle single metacharacter string', () => {
      const result = escapeRegex('*');
      expect(result).toBe('\\*');
    });

    it('should handle unicode characters with metacharacters', () => {
      const result = escapeRegex('café.*');
      expect(result).toBe('café\\.\\*');
    });

    it('should handle emoji with metacharacters', () => {
      const result = escapeRegex('😀.*');
      expect(result).toBe('😀\\.\\*');
    });
  });

  describe('Security validation', () => {
    it('should prevent regex injection with alternation', () => {
      const maliciousInput = 'admin|user';
      const result = escapeRegex(maliciousInput);
      expect(result).toBe('admin\\|user');

      // Verify the escaped version matches literally, not as alternation
      const regex = new RegExp(result);
      expect(regex.test('admin|user')).toBe(true);
      expect(regex.test('admin')).toBe(false);
      expect(regex.test('user')).toBe(false);
    });

    it('should prevent wildcard injection', () => {
      const maliciousInput = '.*';
      const result = escapeRegex(maliciousInput);
      expect(result).toBe('\\.\\*');

      // Verify the escaped version matches literally ".*", not any character
      const regex = new RegExp(result);
      expect(regex.test('.*')).toBe(true);
      expect(regex.test('anything')).toBe(false);
    });

    it('should prevent anchor injection', () => {
      const maliciousInput = '^admin$';
      const result = escapeRegex(maliciousInput);
      expect(result).toBe('\\^admin\\$');

      // Verify anchors are treated as literal characters
      const regex = new RegExp(result);
      expect(regex.test('^admin$')).toBe(true);
      expect(regex.test('admin')).toBe(false);
    });

    it('should prevent character class injection', () => {
      const maliciousInput = '[a-z]';
      const result = escapeRegex(maliciousInput);
      expect(result).toBe('\\[a-z\\]');

      // Verify character class is treated literally
      const regex = new RegExp(result);
      expect(regex.test('[a-z]')).toBe(true);
      expect(regex.test('a')).toBe(false);
      expect(regex.test('z')).toBe(false);
    });

    it('should prevent quantifier injection', () => {
      const maliciousInput = 'a{1000,1000000}';
      const result = escapeRegex(maliciousInput);
      expect(result).toBe('a\\{1000,1000000\\}');

      // Verify quantifier is treated literally
      const regex = new RegExp(result);
      expect(regex.test('a{1000,1000000}')).toBe(true);
      expect(regex.test('a')).toBe(false);
    });
  });

  describe('MongoDB $regex usage', () => {
    it('should produce safe regex for MongoDB query', () => {
      const userInput = 'user@example.com';
      const escaped = escapeRegex(userInput);

      // Simulate MongoDB $regex query
      const mongoQuery = { email: { $regex: escaped, $options: 'i' } };

      expect(mongoQuery.email.$regex).toBe('user@example\\.com');
      expect(mongoQuery.email.$options).toBe('i');
    });

    it('should safely handle malicious input in MongoDB context', () => {
      const maliciousInput = '.*admin.*';
      const escaped = escapeRegex(maliciousInput);

      // The escaped version should match literally, not as a wildcard pattern
      const mongoQuery = { role: { $regex: escaped, $options: 'i' } };

      expect(mongoQuery.role.$regex).toBe('\\.\\*admin\\.\\*');
    });

    it('should safely handle ReDoS pattern in MongoDB context', () => {
      const redosPattern = '(a+)+$';
      const escaped = escapeRegex(redosPattern);

      // The escaped version should not cause backtracking
      const mongoQuery = { name: { $regex: escaped, $options: 'i' } };

      expect(mongoQuery.name.$regex).toBe('\\(a\\+\\)\\+\\$');
    });
  });

  describe('Type safety', () => {
    it('should accept string type', () => {
      const result: string = escapeRegex('test');
      expect(typeof result).toBe('string');
    });

    it('should accept null type', () => {
      const result: string = escapeRegex(null);
      expect(typeof result).toBe('string');
    });

    it('should accept undefined type', () => {
      const result: string = escapeRegex(undefined);
      expect(typeof result).toBe('string');
    });

    it('should always return string type', () => {
      expect(typeof escapeRegex('test')).toBe('string');
      expect(typeof escapeRegex(null)).toBe('string');
      expect(typeof escapeRegex(undefined)).toBe('string');
      expect(typeof escapeRegex('')).toBe('string');
    });
  });
});
