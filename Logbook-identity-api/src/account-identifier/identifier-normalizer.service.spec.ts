import { IdentifierNormalizer } from './identifier-normalizer.service';
import { IdentifierType } from '../constants/enums/identifier-type.enum';

describe('IdentifierNormalizer', () => {
  let normalizer: IdentifierNormalizer;

  beforeEach(() => {
    normalizer = new IdentifierNormalizer();
  });

  describe('normalizeEmail', () => {
    it('should lowercase email', () => {
      expect(normalizer.normalizeEmail('User@Example.com')).toBe(
        'user@example.com',
      );
    });

    it('should trim whitespace', () => {
      expect(normalizer.normalizeEmail('  user@example.com  ')).toBe(
        'user@example.com',
      );
    });

    it('should handle mixed case', () => {
      expect(normalizer.normalizeEmail('TeSt@ExAmple.CoM')).toBe(
        'test@example.com',
      );
    });

    it('should preserve email with dots in local part', () => {
      expect(normalizer.normalizeEmail('first.last@example.com')).toBe(
        'first.last@example.com',
      );
    });

    it('should handle plus addressing', () => {
      expect(normalizer.normalizeEmail('user+tag@example.com')).toBe(
        'user+tag@example.com',
      );
    });
  });

  describe('normalizePhone', () => {
    it('should convert Vietnamese format starting with 0 to +84', () => {
      expect(normalizer.normalizePhone('0901 234 567')).toBe('+84901234567');
    });

    it('should handle phone with dashes', () => {
      expect(normalizer.normalizePhone('0901-234-567')).toBe('+84901234567');
    });

    it('should handle phone with parentheses', () => {
      expect(normalizer.normalizePhone('(0901) 234 567')).toBe('+84901234567');
    });

    it('should convert 84 without + to +84', () => {
      expect(normalizer.normalizePhone('84901234567')).toBe('+84901234567');
    });

    it('should trim whitespace', () => {
      expect(normalizer.normalizePhone('  0901234567  ')).toBe('+84901234567');
    });

    it('should handle +84 format', () => {
      expect(normalizer.normalizePhone('+84 901 234 567')).toBe('+84901234567');
    });
  });

  describe('normalize', () => {
    it('should normalize EMAIL type correctly', () => {
      expect(
        normalizer.normalize(IdentifierType.EMAIL, 'User@Example.com'),
      ).toBe('user@example.com');
    });

    it('should normalize PHONE type correctly', () => {
      expect(normalizer.normalize(IdentifierType.PHONE, '0901 234 567')).toBe(
        '+84901234567',
      );
    });

    it('should treat duplicate emails as same', () => {
      const normalized1 = normalizer.normalize(
        IdentifierType.EMAIL,
        'User@Example.com',
      );
      const normalized2 = normalizer.normalize(
        IdentifierType.EMAIL,
        'user@example.com',
      );
      expect(normalized1).toBe(normalized2);
    });

    it('should treat duplicate phones as same', () => {
      const normalized1 = normalizer.normalize(
        IdentifierType.PHONE,
        '0901 234 567',
      );
      const normalized2 = normalizer.normalize(
        IdentifierType.PHONE,
        '+84 901 234 567',
      );
      expect(normalized1).toBe(normalized2);
    });
  });
});
