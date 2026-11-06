/**
 * PHASE 8 — Vessel Membership Role Guard.
 *
 * Replaces the broken FishermanRolesGuard (which compared accountType
 * string "CAPTAIN" with FishermanRole enum "captain" — always failing).
 *
 * Guards endpoints by checking the user's role ON A SPECIFIC VESSEL
 * (from the route parameter). For global role checks, use SystemRoleGuard.
 *
 * Usage:
 *   @UseGuards(LogbookJwtAuthGuard, VesselMembershipRoleGuard)
 *   @RequireVesselMembership(VesselMembershipRole.CAPTAIN)
 *   async assignCrew(@Param('vesselId') vesselId: string) { ... }
 *
 * NOTE: For list endpoints without a specific vesselId parameter, use
 * the AuthorizationService directly in the service layer.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { VesselMembershipRole } from '../constants/enums/vessel-membership-role.enum';
import { AuthorizationService } from './authorization.service';
import { AuthUser } from './current-user.decorator';

const VESSEL_MEMBERSHIP_KEY = 'vessel-membership-role';
const VESSEL_PARAM_KEY = 'vesselParam';

@Injectable()
export class VesselMembershipRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      VesselMembershipRole[]
    >(VESSEL_MEMBERSHIP_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user?.accountId) {
      throw new ForbiddenException('Authentication required');
    }

    // SUPER_ADMIN bypasses vessel membership role check
    if (this.authService.isSuperAdmin(user)) {
      return true;
    }

    // Find vesselId from route params
    const vesselParam =
      this.reflector.get<string>(VESSEL_PARAM_KEY, context.getHandler()) ??
      'vesselId';

    const vesselId = request.params[vesselParam];
    if (!vesselId) {
      throw new ForbiddenException('Vessel ID is required');
    }

    // Get user's actual role on this vessel
    const actualRole = await this.authService.getVesselMembershipRole(
      vesselId,
      user,
    );

    if (!actualRole) {
      throw new ForbiddenException('You do not have access to this vessel');
    }

    // Normalize: compare lowercase
    const normalizedActual = actualRole.toLowerCase();
    const hasRequiredRole = requiredRoles.some(
      (r) => r.toLowerCase() === normalizedActual,
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `This action requires one of: ${requiredRoles.join(', ')} role`,
      );
    }

    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
type MethodAndClassDecorator = MethodDecorator & ClassDecorator;

/**
 * Require specific vessel membership roles to access an endpoint.
 * The endpoint must have a vesselId route parameter.
 */
export const RequireVesselMembership = (
  ...roles: VesselMembershipRole[]
): MethodAndClassDecorator => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>,
  ) => {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(VESSEL_MEMBERSHIP_KEY, roles, descriptor.value!);
    } else if (propertyKey) {
      Reflect.defineMetadata(VESSEL_MEMBERSHIP_KEY, roles, target);
    }
    return descriptor ?? (target as any);
  };
};

/**
 * Specify which route param holds the vesselId (default: 'vesselId').
 */
export const VesselParam = (paramName: string) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>,
  ) => {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(VESSEL_PARAM_KEY, paramName, descriptor.value!);
    }
  };
};
