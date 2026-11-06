import { BadRequestException } from '@nestjs/common';

const USERNAME_RE = /^[a-z0-9._-]{3,64}$/;

/**
 * Chuẩn hóa username đăng nhập (chữ thường, đã trim).
 */
export function normalizeLoginUsername(raw: string | undefined | null): string {
  return (raw ?? '').trim().toLowerCase();
}

export function assertValidLoginUsername(normalized: string): void {
  if (!normalized) {
    return;
  }
  if (!USERNAME_RE.test(normalized)) {
    throw new BadRequestException(
      'Tên đăng nhập: 3–64 ký tự, chỉ chữ thường, số, dấu . _ -',
    );
  }
}

export function assertPasswordStrength(plain: string): void {
  if (plain.length < 8 || plain.length > 128) {
    throw new BadRequestException('Mật khẩu phải từ 8 đến 128 ký tự');
  }
}
