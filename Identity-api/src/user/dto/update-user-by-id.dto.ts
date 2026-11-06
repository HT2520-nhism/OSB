import { PickType } from '@nestjs/mapped-types';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

import { UserEntity } from '../user.entity';

export class UpdateUserByIdParams extends PickType(UserEntity, [
  'id',
] as const) {}

export class UpdateUserByIdBody extends PickType(UserEntity, [
  'gender',
  'email',
  'position',
  'phoneNumber',
  'dateOfBirth',
  'joinDate',
  'leaveDate',
  'identityCardNumber',
  'insuranceNumber',
  'taxNumber',
] as const) {
  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber(undefined, { each: true })
  backofficeRoleIds?: number[];

  @IsOptional()
  @IsNumber()
  companyId?: number;

  /** Đặt null hoặc chuỗi rỗng để xóa tên đăng nhập */
  @IsOptional()
  @IsString()
  loginUsername?: string | null;

  /** Đặt mật khẩu mới hoặc chuỗi rỗng để tắt đăng nhập bằng mật khẩu */
  @IsOptional()
  @IsString()
  password?: string | null;
}
