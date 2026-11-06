import { TokenService } from './token.util';
import {
  generateSecurePassword,
  generateRefreshToken,
  hashToken,
  generateDeviceId,
} from './password.util';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = tokenService.generateAccessToken({
        sub: 'account-123',
        accountType: 'FISHERMAN',
        systemRole: 'user',
        sessionId: 'session-1',
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = tokenService.generateRefreshToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('getAccessTokenExpiry', () => {
    it('should return expiry in seconds', () => {
      const expiry = tokenService.getAccessTokenExpiry();

      expect(expiry).toBeGreaterThan(0);
    });
  });
});

describe('Password Utilities', () => {
  describe('generateSecurePassword', () => {
    it('should generate password with correct length', () => {
      const result = generateSecurePassword(12);

      expect(result.plaintext).toBeDefined();
      expect(result.plaintext.length).toBe(12);
    });

    it('should contain uppercase, lowercase, and numbers', () => {
      const result = generateSecurePassword(12);

      expect(result.plaintext).toMatch(/[A-Z]/);
      expect(result.plaintext).toMatch(/[a-z]/);
      expect(result.plaintext).toMatch(/[0-9]/);
    });

    it('should not contain ambiguous characters', () => {
      const result = generateSecurePassword(12);

      expect(result.plaintext).not.toMatch(/[Il1O0]/);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a base64url token', () => {
      const token = generateRefreshToken();

      expect(token).toBeDefined();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should produce consistent hash for same input', () => {
      const token = 'test-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different inputs', () => {
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateDeviceId', () => {
    it('should generate a valid UUID', () => {
      const deviceId = generateDeviceId();

      expect(deviceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });
});
