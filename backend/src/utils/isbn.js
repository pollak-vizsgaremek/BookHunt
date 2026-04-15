// Allowlist pattern: ISBN-10 (9 digits + digit or X) or ISBN-13 (13 digits)
const ISBN_PATTERN = /^(?:\d{9}[\dX]|\d{13})$/;

/**
 * Normalizes and validates an ISBN value.
 * - Removes spaces and dashes
 * - Uppercases trailing X for ISBN-10 checks
 * - Enforces strict allowlist format to prevent SSRF/path injection usage
 */
export function normalizeAndValidateIsbn(input) {
  if (typeof input !== 'string') {
    throw new Error('invalid ISBN format');
  }

  const normalized = input.replace(/[\s-]+/g, '').toUpperCase();

  if (!ISBN_PATTERN.test(normalized)) {
    throw new Error('invalid ISBN format');
  }

  return normalized;
}
