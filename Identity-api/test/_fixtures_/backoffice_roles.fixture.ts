import { BackofficeRoleEntity } from '../../src/backoffice-roles/backoffice-role.entity';
import { BackofficeRole } from '../../src/constants/enums/backoffice-role.enum';
import { departments } from './departments.fixture';

export const backofficeRoles: BackofficeRoleEntity[] = [
  {
    id: 1,
    role: BackofficeRole.ADMIN,
    department: departments[0],
    createdAt: new Date('2022-01-11T18:30:00.000Z'),
    updatedAt: new Date('2022-01-11T18:30:00.000Z'),
  },
  {
    id: 2,
    role: BackofficeRole.USER,
    department: departments[0],
    createdAt: new Date('2022-01-11T18:30:00.000Z'),
    updatedAt: new Date('2022-01-11T18:30:00.000Z'),
  },
  {
    id: 3,
    role: BackofficeRole.USER,
    department: departments[1],
    createdAt: new Date('2022-01-11T18:30:00.000Z'),
    updatedAt: new Date('2022-01-11T18:30:00.000Z'),
  },
  {
    id: 4,
    role: BackofficeRole.ADMIN,
    department: departments[1],
    createdAt: new Date('2022-01-11T18:30:00.000Z'),
    updatedAt: new Date('2022-01-11T18:30:00.000Z'),
  },
];
