import { DataSource, Repository } from 'typeorm';

import { DepartmentsService } from './departments.service';
import { DepartmentEntity } from './department.entity';

import { clearDataSource, setupDataSource } from '../../test/_utils_/db.util';
import { departments } from '../../test/_fixtures_/departments.fixture';

describe('[departments] Departments Service', () => {
  let dataSource: DataSource;
  let departmentsRepo: Repository<DepartmentEntity>;

  let departmentsService: DepartmentsService;

  let getDepartmentsSpy: jest.SpyInstance;

  beforeAll(async () => {
    dataSource = await setupDataSource();
    departmentsRepo = dataSource.getRepository(DepartmentEntity);

    departmentsService = new DepartmentsService(departmentsRepo);

    getDepartmentsSpy = jest.spyOn(departmentsRepo, 'find');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await clearDataSource(dataSource);
  });

  test('should correctly return the list of users', async () => {
    getDepartmentsSpy.mockResolvedValue(departments);

    await expect(departmentsService.getAllDepartments()).resolves.toEqual({
      departments,
    });

    expect(getDepartmentsSpy.mock.calls).toEqual([[]]);
  });
});
