import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  /** Tùy chọn: tên đăng nhập (chữ thường, 3–64 ký tự a-z0-9._-) */
  @IsOptional()
  @IsString()
  loginUsername?: string | null;

  /** Tùy chọn: mật khẩu đăng nhập app (8–128 ký tự) */
  @IsOptional()
  @IsString()
  password?: string | null;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  dateOfBirth?: string | null;

  @IsOptional()
  @IsString()
  phoneNumber?: string | null;

  @IsOptional()
  @IsNumber()
  companyId?: number;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber(undefined, { each: true })
  backofficeRoleIds?: number[];
}
