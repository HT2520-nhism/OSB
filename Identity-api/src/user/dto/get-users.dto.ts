import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { SortingOption } from '../../constants/enums/sorting-option.enum';
import {
  DEFAULT_SELECTED_FIELDS,
  SelectFields,
  SELECTABLE_FIELDS,
} from '../user.entity';

/** Giới hạn tổng số bản ghi mỗi request (tránh quét bảng quá lớn). */
export const USERS_LIST_MAX_PAGE_SIZE = 2000;

function toOptionalNumberArray(value: unknown): number[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const raw = Array.isArray(value) ? value : [value];
  const nums = raw
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= 1);
  return nums.length ? nums : undefined;
}

export class BaseGetQueries {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(USERS_LIST_MAX_PAGE_SIZE)
  size?: number = 20;

  @IsOptional()
  @IsString()
  searchText?: string;
}

export class UsersSortOption {
  @IsOptional()
  @IsEnum(SortingOption)
  name?: SortingOption;
}

export class UsersFilterOptions {
  @IsOptional()
  @Transform(({ value }) => toOptionalNumberArray(value))
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  companyIds?: number[];

  @IsOptional()
  @Transform(({ value }) => toOptionalNumberArray(value))
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  departmentIds?: number[];
}

export class GetUsersQueries extends BaseGetQueries {
  @IsOptional()
  @ValidateNested()
  @Type(() => UsersSortOption)
  order?: UsersSortOption;

  @IsOptional()
  @ValidateNested()
  @Type(() => UsersFilterOptions)
  filter?: UsersFilterOptions;

  @IsOptional()
  @IsIn(SELECTABLE_FIELDS, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  select: SelectFields[] = DEFAULT_SELECTED_FIELDS;
}
