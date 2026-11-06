import { DepartmentEntity } from '../../src/departments/department.entity';
import { Department } from '../../src/constants/enums/department.enum';

export const departments: DepartmentEntity[] = [
  {
    id: 1,
    name: Department.HR,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 2,
    name: Department.ELT,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 3,
    name: Department.SALES,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 4,
    name: Department.ACCOUNTING,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 5,
    name: Department.SECRETARY,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 6,
    name: Department.EXECUTION,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 7,
    name: Department.TECHNICAL,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 8,
    name: Department.IT,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
  {
    id: 9,
    name: Department.WAREHOUSE,
    createdAt: new Date('2022-11-15T18:30:00.000Z'),
    updatedAt: new Date('2022-11-15T18:30:00.000Z'),
  },
];
