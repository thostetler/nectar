import DOMPurify from 'isomorphic-dompurify';
import { logger } from '@/logger';

/**
 * Sanitizes a string using DOMPurify to prevent XSS attacks
 * @param {string} value - The raw string to sanitize
 * @returns {string} - Sanitized string
 */
export const purifyString = (value: string): string => {
  try {
    return DOMPurify.sanitize(value);
  } catch (e) {
    logger.error({ err: e }, 'Error sanitizing string');
    return value;
  }
};
