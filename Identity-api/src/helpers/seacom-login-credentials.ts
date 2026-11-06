import { ForbiddenException } from '@nestjs/common';

import { JwtPayload } from '../constants/types/jwt-payload.type';

/** Phòng ban được phép gán / đổi tên đăng nhập & mật khẩu app cho người khác. */
export const SEACOM_SERVICE_DEPARTMENT_NAME = 'Phòng Dịch vụ Seacom';

function normDeptName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * User thuộc Phòng Dịch vụ Seacom: theo phòng ban chính hoặc bất kỳ quyền backoffice nào gắn phòng đó.
 */
export function isSeacomServiceMemberFromJwt(
  user: JwtPayload | null | undefined,
): boolean {
  if (!user) return false;
  const target = normDeptName(SEACOM_SERVICE_DEPARTMENT_NAME);
  if (normDeptName(user.departmentName) === target) return true;
  const perms = user.permissions;
  if (!Array.isArray(perms)) return false;
  return perms.some((p) => p && normDeptName(p.departmentName) === target);
}

/**
 * Tạo user mới có loginUsername/password — luôn là tài khoản “người khác” → chỉ Seacom.
 */
export function assertCanSetLoginCredentialsOnCreate(
  user: JwtPayload | undefined,
): void {
  if (!isSeacomServiceMemberFromJwt(user)) {
    throw new ForbiddenException(
      'Chỉ nhân viên Phòng Dịch vụ Seacom được gán tên đăng nhập / mật khẩu khi tạo người dùng.',
    );
  }
}

/**
 * Cập nhật loginUsername/password: Seacom được sửa cho người khác; user bất kỳ được sửa chính mình.
 */
export function assertCanSetLoginCredentialsOnUpdate(
  user: JwtPayload | undefined,
  targetUserId: string,
): void {
  const actorId = user?.userId;
  if (actorId != null && String(actorId) === String(targetUserId)) {
    return;
  }
  if (!isSeacomServiceMemberFromJwt(user)) {
    throw new ForbiddenException(
      'Chỉ nhân viên Phòng Dịch vụ Seacom được đổi tên đăng nhập / mật khẩu cho người dùng khác.',
    );
  }
}
