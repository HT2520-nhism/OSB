import { Brackets, SelectQueryBuilder } from 'typeorm';

import { UserEntity } from '../../user/user.entity';

export type UserListFilterParams = {
  searchText?: string;
  companyIds?: number[];
  departmentIds?: number[];
};

/**
 * Áp điều kiện lọc + tìm kiếm (họ tên, email, SĐT) lên query builder user.
 */
export function applyUserListFilters(
  qb: SelectQueryBuilder<UserEntity>,
  params: UserListFilterParams,
): void {
  const { searchText, companyIds, departmentIds } = params;

  if (companyIds?.length) {
    qb.andWhere('user.company_id IN (:...cids)', { cids: companyIds });
  }
  if (departmentIds?.length) {
    qb.andWhere('user.department_id IN (:...dids)', { dids: departmentIds });
  }
  if (searchText?.trim()) {
    const st = `%${searchText.trim()}%`;
    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where('user.name ILIKE :st', { st })
          .orWhere('user.email ILIKE :st', { st })
          .orWhere('user.phone_number ILIKE :st', { st })
          .orWhere('user.login_username ILIKE :st', { st });
      }),
    );
  }
}
