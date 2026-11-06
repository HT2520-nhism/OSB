import { UserEntity } from '../../user/user.entity';

export type BackofficePermissionPayload = {
  companyId: number | null;
  companyName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  role: string; // 'admin' | 'user'
};

export type JwtPayload = {
  userId: UserEntity['id'];
  name: UserEntity['name'];
  gender: UserEntity['gender'];
  email: UserEntity['email'];
  dob: UserEntity['dateOfBirth'];

  roles?: string[];

  permissions?: BackofficePermissionPayload[];

  companyId?: string;
  companyName?: string;
  departmentId?: string;
  departmentName?: string;
};
