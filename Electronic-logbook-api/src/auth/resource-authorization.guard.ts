/**
 * PHASE 8 — Resource Authorization Guard.
 *
 * ⚠️ DEPRECATED — This guard uses free-form metadata and has dead-code
 * fallback logic. It is preserved here for backward compatibility but
 * should NOT be applied to new controllers.
 *
 * Replaced by:
 *  - SystemRoleGuard + @RequireSystemRole
 *  - VesselMembershipRoleGuard + @RequireVesselMembership
 *
 * For resource-level authorization, use AuthorizationService directly
 * in the service layer (recommended).
 */
import { Injectable, CanActivate } from '@nestjs/common';

@Injectable()
export class ResourceAuthorizationGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    // Always allow — actual authorization is enforced by service-layer
    // checks via AuthorizationService and module-level guards.
    return true;
  }
}
