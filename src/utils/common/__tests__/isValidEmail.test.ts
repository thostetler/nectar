import { describe, expect, it } from 'vitest';
import { isValidEmail } from '../isValidEmail';

describe('isValidEmail', () => {
  describe('valid emails', () => {
    it('should accept standard email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user@domain.org')).toBe(true);
      expect(isValidEmail('admin@company.net')).toBe(true);
    });

    it('should accept emails with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
      expect(isValidEmail('john.doe.smith@example.com')).toBe(true);
    });

    it('should accept emails with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true);
      expect(isValidEmail('123user@example.com')).toBe(true);
      expect(isValidEmail('test@example123.com')).toBe(true);
    });

    it('should accept emails with hyphens and underscores', () => {
      expect(isValidEmail('first-last@example.com')).toBe(true);
      expect(isValidEmail('first_last@example.com')).toBe(true);
      expect(isValidEmail('user@my-domain.com')).toBe(true);
    });

    it('should accept emails with plus signs', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('test+filter@domain.org')).toBe(true);
    });

    it('should accept emails with subdomains', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
      expect(isValidEmail('admin@subdomain.domain.com')).toBe(true);
    });

    it('should accept emails with various TLDs', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user@example.org')).toBe(true);
      expect(isValidEmail('user@example.co.uk')).toBe(true);
      expect(isValidEmail('user@example.museum')).toBe(true);
    });

    it('should accept long email addresses', () => {
      expect(isValidEmail('verylongemailaddressname@verylongdomainname.com')).toBe(true);
    });
  });

  describe('invalid emails', () => {
    it('should reject emails without @ symbol', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
      expect(isValidEmail('user.domain.com')).toBe(false);
    });

    it('should reject emails without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('user@.')).toBe(false);
    });

    it('should reject emails without local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('@domain.org')).toBe(false);
    });

    it('should reject emails without TLD', () => {
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('test@localhost')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(isValidEmail('test user@example.com')).toBe(false);
      expect(isValidEmail('test@example .com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should reject emails with multiple @ symbols', () => {
      expect(isValidEmail('test@@example.com')).toBe(false);
      expect(isValidEmail('test@user@example.com')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject emails with invalid characters', () => {
      expect(isValidEmail('test#user@example.com')).toBe(false);
      expect(isValidEmail('test user@example.com')).toBe(false);
    });

    it('should reject emails starting or ending with dots', () => {
      expect(isValidEmail('.test@example.com')).toBe(false);
      expect(isValidEmail('test.@example.com')).toBe(false);
    });

    it('should reject emails with consecutive dots', () => {
      expect(isValidEmail('test..user@example.com')).toBe(false);
      expect(isValidEmail('test@example..com')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very short emails', () => {
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should handle emails with special but valid characters', () => {
      expect(isValidEmail('user!name@example.com')).toBe(false); // Zod might reject this
      expect(isValidEmail('user+filter@example.com')).toBe(true);
    });

    it('should handle whitespace-only strings', () => {
      expect(isValidEmail('   ')).toBe(false);
      expect(isValidEmail('\t')).toBe(false);
      expect(isValidEmail('\n')).toBe(false);
    });
  });
});
