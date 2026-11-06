/** Cấp nhân sự: giám đốc > phó giám đốc > trưởng phòng > nhân viên */
export enum BackofficeRole {
  DIRECTOR = 'director', // Giám đốc (trung tâm / công ty)
  DEPUTY_DIRECTOR = 'deputy_director', // Phó giám đốc
  ADMIN = 'admin', // Trưởng phòng
  USER = 'user', // Nhân viên
}
