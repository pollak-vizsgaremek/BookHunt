import { convertToHuf } from '../../src/utils/currency.js';
import { jest } from '@jest/globals';

describe('Currency Utility - Unit Tests', () => {
  describe('convertToHuf', () => {
    it('should correctly convert USD to HUF and round to the nearest integer', () => {
      const rate = 360.5;
      const amountUSD = 10.5;
      const expectedHUF = Math.round(10.5 * 360.5); // 3785

      const result = convertToHuf(amountUSD, rate);
      expect(result).toBe(expectedHUF);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should correctly convert EUR to HUF', () => {
      const rate = 400.1;
      const amountEUR = 5.99;
      const expectedHUF = Math.round(5.99 * 400.1); // 2397

      const result = convertToHuf(amountEUR, rate);
      expect(result).toBe(expectedHUF);
    });

    it('should return 0 when amount is null', () => {
      expect(convertToHuf(null, 360)).toBe(0);
    });

    it('should return 0 when amount is undefined', () => {
      expect(convertToHuf(undefined, 360)).toBe(0);
    });

    it('should return 0 when amount is NaN', () => {
      expect(convertToHuf(NaN, 360)).toBe(0);
    });

    it('should handle string numeric values properly if JS coercion allows, or return 0 for non-numeric (if strict)', () => {
      // In JS, amount * rate coerces strings to numbers: "10" * 360 = 3600
      // convertToHuf relies on this loose coercion and isNaN check.
      expect(convertToHuf("10", 360)).toBe(3600);
      expect(convertToHuf("abc", 360)).toBe(0); // NaN check catches this
    });
  });
});
