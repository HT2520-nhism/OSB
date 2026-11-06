/**
 * Cấp vai trò ngư dân trong hệ thống Electronic Logbook.
 *
 * Khác với BackofficeRole dùng cho nhân viên công ty.
 * - CAPTAIN: Thuyền trưởng — toàn quyền trên tàu, quản lý thuyền viên
 * - CREW: Thuyền viên — ghi log cá nhân, xem log tàu
 * - VIEWER: Người xem — chỉ đọc, không chỉnh sửa
 */

export enum FishermanRole {
  CAPTAIN = 'captain',
  CREW = 'crew',
  VIEWER = 'viewer',
}
