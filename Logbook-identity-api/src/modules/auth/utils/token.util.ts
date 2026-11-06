import * as jwt from 'jsonwebtoken';
import { config } from '../../../config';

export interface JwtPayload {
  sub: string;
  accountType: string;
  systemRole: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface AccessTokenClaims {
  sub: string;
  accountType: string;
  systemRole: string;
  sessionId: string;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}

export class TokenService {
  generateAccessToken(claims: AccessTokenClaims): string {
    const secret = getEnv(
      'JWT_ACCESS_SECRET',
      // ⚠️ MUST match electronic-logbook-api JWT_ACCESS_SECRET / JWT.ACCESS_SECRET
      'logbook-jwt-access-secret-change-me',
    );
    const expiresIn = getEnv('JWT_ACCESS_EXPIRES_IN', '15m');
    const expiresInSeconds = parseExpiry(expiresIn);

    return jwt.sign(
      {
        sub: claims.sub,
        accountType: claims.accountType,
        systemRole: claims.systemRole,
        sessionId: claims.sessionId,
      },
      secret,
      { expiresIn: expiresInSeconds },
    );
  }

  generateRefreshToken(): string {
    const secret = getEnv(
      'LOGBOOK_JWT_REFRESH_SECRET',
      // ⚠️ Default phải khớp với .env của electronic-logbook-api (nếu cần verify)
      'electronic-logbook-refresh-secret-change-in-production-use-strong-random',
    );
    const expiresIn = getEnv('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresInSeconds = parseExpiry(expiresIn);

    return jwt.sign({ type: 'refresh' }, secret, {
      expiresIn: expiresInSeconds,
    });
  }

  verifyRefreshToken(token: string): {
    valid: boolean;
    payload?: JwtPayload;
    error?: string;
  } {
    try {
      const secret = getEnv(
        'LOGBOOK_JWT_REFRESH_SECRET',
        'electronic-logbook-refresh-secret-change-in-production-use-strong-random',
      );
      const payload = jwt.verify(token, secret) as JwtPayload;
      return { valid: true, payload };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  getAccessTokenExpiry(): number {
    const expiresIn = getEnv('JWT_ACCESS_EXPIRES_IN', '15m');
    return parseExpiry(expiresIn);
  }
}
