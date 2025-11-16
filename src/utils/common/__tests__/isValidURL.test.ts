import { describe, expect, it } from 'vitest';
import { isValidURL } from '../isValidURL';

describe('isValidURL', () => {
  describe('valid URLs', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('http://www.example.com')).toBe(true);
      expect(isValidURL('http://example.com/path')).toBe(true);
      expect(isValidURL('http://example.com/path/to/resource')).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://www.example.com')).toBe(true);
      expect(isValidURL('https://example.com/path')).toBe(true);
    });

    it('should accept URLs with subdomains', () => {
      expect(isValidURL('https://api.example.com')).toBe(true);
      expect(isValidURL('https://sub.domain.example.com')).toBe(true);
      expect(isValidURL('https://www.api.example.com')).toBe(true);
    });

    it('should accept URLs with ports', () => {
      expect(isValidURL('http://example.com:8080')).toBe(true);
      expect(isValidURL('http://example.com:8080/path')).toBe(true);
      expect(isValidURL('https://example.com:443')).toBe(true);
    });

    it('should accept URLs with query parameters', () => {
      expect(isValidURL('https://example.com?param=value')).toBe(true);
      expect(isValidURL('https://example.com?param1=value1&param2=value2')).toBe(true);
      expect(isValidURL('https://example.com/path?query=test')).toBe(true);
    });

    it('should accept URLs with fragments', () => {
      expect(isValidURL('https://example.com#section')).toBe(true);
      expect(isValidURL('https://example.com/path#anchor')).toBe(true);
      expect(isValidURL('https://example.com?param=value#section')).toBe(true);
    });

    it('should accept URLs with special characters', () => {
      expect(isValidURL('https://example.com/path-with-dashes')).toBe(true);
      expect(isValidURL('https://example.com/path_with_underscores')).toBe(true);
      expect(isValidURL('https://example.com/path~with~tildes')).toBe(true);
      expect(isValidURL('https://example.com/path+with+plus')).toBe(true);
    });

    it('should accept URLs with username and password', () => {
      expect(isValidURL('https://user@example.com')).toBe(true);
      expect(isValidURL('https://user:pass@example.com')).toBe(true);
    });

    it('should accept URLs with IPv4 addresses', () => {
      expect(isValidURL('http://192.168.1.1')).toBe(true);
      expect(isValidURL('https://127.0.0.1:8080')).toBe(true);
    });

    it('should accept URLs with various TLDs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://example.org')).toBe(true);
      expect(isValidURL('https://example.net')).toBe(true);
      expect(isValidURL('https://example.io')).toBe(true);
      expect(isValidURL('https://example.co.uk')).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject URLs without protocol', () => {
      expect(isValidURL('example.com')).toBe(false);
      expect(isValidURL('www.example.com')).toBe(false);
      expect(isValidURL('//example.com')).toBe(false);
    });

    it('should reject non-HTTP(S) protocols', () => {
      expect(isValidURL('ftp://example.com')).toBe(false);
      expect(isValidURL('file:///path/to/file')).toBe(false);
      expect(isValidURL('mailto:test@example.com')).toBe(false);
      expect(isValidURL('tel:+1234567890')).toBe(false);
    });

    it('should reject URLs without domain', () => {
      expect(isValidURL('http://')).toBe(false);
      expect(isValidURL('https://')).toBe(false);
      expect(isValidURL('http://.')).toBe(false);
    });

    it('should reject URLs with invalid characters', () => {
      expect(isValidURL('http://example .com')).toBe(false);
      expect(isValidURL('http://exam ple.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidURL('')).toBe(false);
    });

    it('should reject URLs with only protocol', () => {
      expect(isValidURL('http://')).toBe(false);
      expect(isValidURL('https://')).toBe(false);
    });

    it('should reject malformed URLs', () => {
      expect(isValidURL('http:/example.com')).toBe(false);
      expect(isValidURL('http:///example.com')).toBe(false);
      expect(isValidURL('http//example.com')).toBe(false);
    });

    it('should reject URLs without TLD', () => {
      expect(isValidURL('http://localhost')).toBe(false);
      expect(isValidURL('https://localhost:3000')).toBe(false); // localhost without TLD is invalid
      expect(isValidURL('http://example')).toBe(false);
    });

    it('should reject URLs with spaces', () => {
      expect(isValidURL('http://example.com/path with spaces')).toBe(false);
      expect(isValidURL('http://example.com?param=value with spaces')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle long domain names', () => {
      const longDomain = 'a'.repeat(63) + '.com';
      expect(isValidURL(`https://${longDomain}`)).toBe(true);
    });

    it('should handle complex paths', () => {
      expect(isValidURL('https://example.com/path/to/deeply/nested/resource.html')).toBe(true);
    });

    it('should handle multiple query parameters', () => {
      expect(isValidURL('https://example.com?a=1&b=2&c=3&d=4&e=5')).toBe(true);
    });

    it('should handle encoded characters in URLs', () => {
      expect(isValidURL('https://example.com/path%20with%20spaces')).toBe(true);
      expect(isValidURL('https://example.com?param=%20value')).toBe(true);
    });
  });
});
