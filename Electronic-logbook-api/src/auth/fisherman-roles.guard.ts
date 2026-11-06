/**
 * Fisherman Roles Guard cho Electronic Logbook API
 *
 * Phân quyền theo vai trò ngư dân trong hệ thống logbook.
 * Khác với BackofficeRolesGuard dùng cho nhân viên công ty.
 *
 * Cấp độ quyền:
 * - CAPTAIN: Thuyền trưởng — toàn quyền trên tàu
 * - CREW: Thuyền viên — quản lý log cá nhân
 * - VIEWER: Người xem — chỉ đọc
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { FishermanRole } from '../constants/enums/fisherman-role.enum';

const FISHERMAN_ROLES_METADATA_KEY = 'fisherman-roles';

@Injectable()
export class FishermanRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<FishermanRole[]>(
        FISHERMAN_ROLES_METADATA_KEY,
        context.getHandler(),
      ) ||
      this.reflector.get<FishermanRole[]>(
        FISHERMAN_ROLES_METADATA_KEY,
        context.getClass(),
      );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { accountType?: string } | undefined;

    if (!user?.accountType) {
      return false;
    }

    const hasRole = requiredRoles.includes(user.accountType as FishermanRole);
    if (!hasRole) {
      throw new Error('User does not have proper fisherman role to access');
    }

    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
type MethodAndClassDecorator = MethodDecorator & ClassDecorator;

export const RequireFishermanRoles = (
  roles: FishermanRole[],
): MethodAndClassDecorator => {
  return SetMetadata(
    FISHERMAN_ROLES_METADATA_KEY,
    roles,
  ) as MethodAndClassDecorator;
};
