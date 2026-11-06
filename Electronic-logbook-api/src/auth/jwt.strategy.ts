/**
 * JWT Strategy cho Electronic Logbook API
 *
 * Dùng HS256 với secret riêng (KHÔNG dùng public key RS256 của Identity).
 * Token được verify bằng LOGBOOK_JWT_ACCESS_SECRET.
 *
 * Strategy name: 'logbook-jwt' (khác với 'jwt' của Identity/Construction)
 *
 * PHASE 8 — Authorization: JWT now includes systemRole for hierarchical
 * permission checks at the downstream service level.
 */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { config } from '../config';

export interface LogbookJwtPayload {
  sub: string;
  accountType: string;
  systemRole: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class LogbookJwtStrategy extends PassportStrategy(
  Strategy,
  'logbook-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.JWT.ACCESS_SECRET,
    });
  }

  async validate(payload: LogbookJwtPayload) {
    return {
      accountId: payload.sub,
      accountType: payload.accountType,
      systemRole: payload.systemRole,
    };
  }
}
