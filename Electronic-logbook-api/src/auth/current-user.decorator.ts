/**
 * Current authenticated user accessor.
 *
 * Single source of truth for extracting the authenticated account
 * from a NestJS request.
 *
 * Reuses the existing LogbookJwtStrategy which produces
 * { accountId, accountType, systemRole } on `request.user`.
 *
 * PHASE 8 — Added systemRole field.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  accountId: string;
  accountType: string;
  systemRole: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthUser | undefined;
  },
);
