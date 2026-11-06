/**
 * Service-to-Service JWT Token helper.
 *
 * Issues HS256 JWTs that downstream services (currently Document Service)
 * accept on behalf of the Gateway. The token claims:
 *   - sub : user id forwarded from the caller's Authorization header
 *           (or 'gateway' if not present)
 *   - svc : 'gateway' — identifies this token as a service-to-service call
 *   - aud : per-target audience (e.g. 'document-api')
 *   - roles: [] (no business roles for service-to-service calls)
 *
 * The secret MUST be the same JWT_SERVICE_SECRET that document-api hashes.
 * document-api uses sha256(secret).digest('base64url') as the signing key.
 *
 * Tokens are short-lived (5 minutes) and minted per-request — they are not
 * cached because we have no clean invalidation point.
 */

import * as jwt from 'jsonwebtoken';
import * as nodeCrypto from 'crypto';

/** Audience for the Document Service. Must match DOCUMENT_API_AUDIENCE. */
export const DOCUMENT_AUDIENCE = 'document-api';
/** Service identifier for the Gateway in service-to-service calls. */
export const SERVICE_NAME = 'gateway';
/** Service token TTL — 5 minutes. */
const SERVICE_TOKEN_TTL_SECONDS = 5 * 60;

interface ServiceTokenClaims {
  sub: string;
  svc: string;
  aud: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Derive the signing key the same way the Document Service does:
 * sha256(SERVICE_SECRET) → base64url.
 */
function getServiceSigningKey(secret: string): string {
  return nodeCrypto.createHash('sha256').update(secret).digest('base64url');
}

/**
 * Mint a service token for the given target audience. The caller may pass a
 * user-id (forwarded from the caller's Authorization header) so the downstream
 * still knows who initiated the request; if unknown, 'gateway' is used.
 *
 * The JWT_SERVICE_SECRET environment variable MUST be set in production.
 * In dev/test it falls back to the Document Service default so local
 * bring-up works out of the box.
 */
export function mintServiceToken(
  audience: string,
  userId?: string,
  secret: string = process.env.JWT_SERVICE_SECRET ||
    'document-api-service-secret-change-me',
): string {
  const claims: ServiceTokenClaims = {
    sub: userId || 'gateway',
    svc: SERVICE_NAME,
    aud: audience,
    roles: [],
  };
  return jwt.sign(claims, getServiceSigningKey(secret), {
    algorithm: 'HS256',
    expiresIn: SERVICE_TOKEN_TTL_SECONDS,
  });
}

/**
 * Extract a user-id from a Bearer Authorization header without verifying
 * the token (the Gateway is not a token validator; downstream services own
 * that responsibility). Returns undefined if unparseable.
 *
 * Note: this only reads the `sub` claim. We do not need to verify because
 * the downstream re-verifies with its own secret anyway.
 */
export function extractUserIdFromAuthHeader(
  authorization: string | undefined,
): string | undefined {
  if (!authorization) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!match) return undefined;
  const token = match[1];
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    );
    return typeof payload.sub === 'string' ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}
