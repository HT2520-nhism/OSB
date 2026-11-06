import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './roles.decorator';
import { JwtPayload } from '../constants/types/jwt-payload.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    const userRoles = Array.isArray(user?.roles) ? user!.roles! : [];

    const ok = requiredRoles.some((r) => userRoles.includes(r));
    if (!ok) throw new ForbiddenException('No permission');

    return true;
  }
}
