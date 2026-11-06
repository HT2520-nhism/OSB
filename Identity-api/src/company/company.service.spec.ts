import { DataSource, Repository } from 'typeorm';

import { BackofficeRolesService } from './company.service';
import { BackofficeRoleEntity } from './backoffice-role.entity';

import { clearDataSource, setupDataSource } from '../../test/_utils_/db.util';
import { backofficeRoles } from '../../test/_fixtures_/backoffice_roles.fixture';

describe('[backoffice-roles] Backoffice Roles Service', () => {
  let dataSource: DataSource;
  let backofficeRolesRepo: Repository<BackofficeRoleEntity>;

  let backofficeRolesService: BackofficeRolesService;

  let getBackofficeRolessSpy: jest.SpyInstance;

  beforeAll(async () => {
    dataSource = await setupDataSource();
    backofficeRolesRepo = dataSource.getRepository(BackofficeRoleEntity);

    backofficeRolesService = new BackofficeRolesService(backofficeRolesRepo);

    getBackofficeRolessSpy = jest.spyOn(backofficeRolesRepo, 'find');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await clearDataSource(dataSource);
  });

  test('should correctly return the list of users', async () => {
    getBackofficeRolessSpy.mockResolvedValue(backofficeRoles);

    await expect(
      backofficeRolesService.getAllBackofficeRoles(),
    ).resolves.toEqual({
      backofficeRoles,
    });

    expect(getBackofficeRolessSpy.mock.calls).toEqual([
      [
        {
          relations: ['department'],
          select: {
            department: { id: true, name: true },
            id: true,
            role: true,
            createdAt: true,
          },
        },
      ],
    ]);
  });
});
