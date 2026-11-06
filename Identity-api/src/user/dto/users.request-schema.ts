import { ApiBodyOptions, ApiQueryOptions } from '@nestjs/swagger';

import { Gender } from '../../constants/enums/gender.enum';
import { SortingOption } from '../../constants/enums/sorting-option.enum';

export const uuidSchema = {
  type: 'string',
  pattern:
    '^[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}$',
  example: '35328389-032f-48b3-909c-f68ea410b826',
};

export const usersFilters = {
  type: 'object',
  properties: {
    companyIds: {
      type: 'array',
      items: { type: 'number', minimum: 1 },
      description: 'Lọc theo đơn vị (company id)',
    },
    departmentIds: {
      type: 'array',
      items: { type: 'number', minimum: 1 },
      description: 'Lọc theo phòng ban (department id)',
    },
  },
};

export const getUsersQueries: ApiQueryOptions = {
  name: 'queries',
  schema: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 0, description: 'Trang (0-based)' },
      size: {
        type: 'number',
        default: 20,
        description: 'Số bản ghi mỗi trang (tối đa 2000)',
      },
      searchText: {
        type: 'string',
        description: 'Tìm theo họ tên, email hoặc số điện thoại (ILIKE)',
      },
      order: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            enum: Object.keys(SortingOption),
          },
        },
      },
      filter: usersFilters,
    },
  },
};

export const updateUserByIdBody: ApiBodyOptions = {
  schema: {
    type: 'object',
    properties: {
      email: { type: 'string', example: 'cuongpd@seacom.net.vn' },
      gender: {
        type: 'string',
        enum: Object.values(Gender),
        example: Gender.MALE,
      },
      position: { type: 'string', example: 'Kế toán trưởng' },
      phoneNumber: { type: 'string', example: '0817332809' },
      address: { type: 'string', example: 'Số 25 đường 55, Thủ Đức, TP HCM' },
      dateOfBirth: { type: 'string', example: '2003-01-03' },
      joinDate: { type: 'string', example: '01/06/2022' },
      leaveDate: { type: 'string', example: '01/12/2022' },
      identityCardNumber: { type: 'string', example: '001082946357' },
      insuranceNumber: { type: 'string', example: 'CN3010003500099' },
      taxNumber: { type: 'string', example: '0321019787' },
      departmentId: { type: 'number', example: 1 },
      backofficeRoleIds: { type: 'array', items: { type: 'number' } },
      loginUsername: {
        type: 'string',
        nullable: true,
        description:
          'Tên đăng nhập (a-z0-9._-, 3–64 ký tự). Để trống hoặc null để xóa.',
      },
      password: {
        type: 'string',
        nullable: true,
        description:
          'Mật khẩu mới (8–128 ký tự). Chuỗi rỗng để tắt đăng nhập bằng mật khẩu.',
      },
    },
  },
};

export const getUsersBasicDetailsQueries: ApiQueryOptions = {
  name: 'queries',
  schema: {
    type: 'object',
    properties: {
      userIds: { type: 'array', items: uuidSchema },
    },
  },
};

export const getUsersByBackofficeRoleQuery: ApiQueryOptions = {
  name: 'queries',
  schema: {
    type: 'object',
    properties: {
      backofficeRole: {
        type: 'string',
        example: '1.admin',
      },
    },
  },
};
