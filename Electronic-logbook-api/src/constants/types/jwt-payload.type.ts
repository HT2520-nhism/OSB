/**
 * JWT Payload type cho Electronic Logbook API
 *
 * Payload được ký bởi logboook-identity-api với LOGBOOK_JWT_ACCESS_SECRET.
 * Khác với JwtPayload của Identity-api (có roles, permissions, companyId...).
 */

import { FishermanRole } from '../../constants/enums/fisherman-role.enum';

export interface LogbookJwtPayload {
  sub: string; // Account ID (string uuid từ logboook-identity-api)
  accountType: FishermanRole; // captain | crew | viewer
  iat?: number; // Issued at
  exp?: number; // Expiration
}
