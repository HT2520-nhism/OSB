import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { config } from '../../../config';

export interface AuthenticatedUser {
  accountId: string;
  accountType: string;
  sessionId: string;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getEnv('JWT_ACCESS_SECRET', 'default-access-secret'),
    });
  }

  async validate(payload: any): Promise<AuthenticatedUser> {
    return {
      accountId: payload.sub,
      accountType: payload.accountType,
      sessionId: payload.sessionId || '',
    };
  }
}
