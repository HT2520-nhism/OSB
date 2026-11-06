/**
 * PHASE 8 — System Role Guard.
 *
 * Guards endpoints that require specific system-level roles.
 * SUPER_ADMIN always passes.
 *
 * Usage:
 *   @UseGuards(LogbookJwtAuthGuard, SystemRoleGuard)
 *   @RequireSystemRole(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
 *   async adminEndpoint() { ... }
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SystemRole } from '../constants/enums/system-role.enum';
import { AuthUser } from './current-user.decorator';

const SYSTEM_ROLE_KEY = 'system-role';

@Injectable()
export class SystemRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      SYSTEM_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user?.systemRole) {
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN always passes
    if (user.systemRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.includes(user.systemRole as SystemRole);
    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
type MethodAndClassDecorator = MethodDecorator & ClassDecorator;

export const RequireSystemRole = (
  ...roles: SystemRole[]
): MethodAndClassDecorator => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>,
  ) => {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(SYSTEM_ROLE_KEY, roles, descriptor.value!);
    } else if (propertyKey) {
      Reflect.defineMetadata(SYSTEM_ROLE_KEY, roles, target);
    }
    return descriptor ?? (target as any);
  };
};
