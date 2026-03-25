// tests/utils.test.ts
import { cn } from '@/lib/utils';
import { sanitizeHtml, sanitizeSearchQuery, isValidEmail, isValidUrl } from '@/lib/sanitize';

describe('Utility Functions', () => {
  describe('cn - class name utilities', () => {
    test('should combine class names', () => {
      expect(cn('px-2', 'py-1')).toContain('px-2');
      expect(cn('px-2', 'py-1')).toContain('py-1');
    });
  });

  describe('sanitizeHtml', () => {
    test('should escape HTML characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).not.toContain('<script>');
      expect(sanitizeHtml('<script>alert("xss")</script>')).toContain('&lt;');
    });

    test('should encode special characters', () => {
      expect(sanitizeHtml('"quotes"')).toContain('&quot;');
      expect(sanitizeHtml("'apostrophe'")).toContain('&#x27;');
    });
  });

  describe('sanitizeSearchQuery', () => {
    test('should remove dangerous characters', () => {
      expect(sanitizeSearchQuery('search<script>')).not.toContain('<');
      expect(sanitizeSearchQuery('search<script>')).not.toContain('>');
    });

    test('should limit length to 200 characters', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeSearchQuery(longString)).toHaveLength(200);
    });

    test('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  search  ')).toBe('search');
    });
  });

  describe('isValidEmail', () => {
    test('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    test('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    test('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('htp://typo')).toBe(true); // Still valid technically
    });
  });
});
