import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { AccountService } from './account.service';
import { AccountEntity } from './account.entity';
import { AccountType } from '../constants/enums/account-type.enum';
import { AccountStatus } from '../constants/enums/account-status.enum';

describe('AccountService', () => {
  let service: AccountService;
  let repository: jest.Mocked<Repository<AccountEntity>>;

  const mockAccount: Partial<AccountEntity> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    status: AccountStatus.PENDING,
    accountType: AccountType.FISHERMAN,
    passwordHash: undefined,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      softRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    repository = module.get(getRepositoryToken(AccountEntity));
  });

  describe('create', () => {
    it('should create an account with default values', async () => {
      const mockCreate = { ...mockAccount, id: 'new-id' };
      repository.create.mockReturnValue(mockCreate as AccountEntity);
      repository.save.mockResolvedValue(mockCreate as AccountEntity);

      const result = await service.create({});

      expect(repository.create).toHaveBeenCalledWith({
        status: AccountStatus.PENDING,
        accountType: AccountType.FISHERMAN,
        failedLoginAttempts: 0,
      });
      expect(result.accountType).toBe(AccountType.FISHERMAN);
      expect(result.status).toBe(AccountStatus.PENDING);
    });

    it('should create an account with specified accountType', async () => {
      const mockCreate = { ...mockAccount, accountType: AccountType.CAPTAIN };
      repository.create.mockReturnValue(mockCreate as AccountEntity);
      repository.save.mockResolvedValue(mockCreate as AccountEntity);

      const result = await service.create({ accountType: AccountType.CAPTAIN });

      expect(result.accountType).toBe(AccountType.CAPTAIN);
    });
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      repository.findOne.mockResolvedValue(mockAccount as AccountEntity);

      const result = await service.findById(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(result).toBeDefined();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          deletedAt: IsNull(),
        },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update accountType', async () => {
      const updatedAccount = { ...mockAccount, accountType: AccountType.OWNER };
      repository.findOne
        .mockResolvedValueOnce(mockAccount as AccountEntity)
        .mockResolvedValueOnce(updatedAccount as AccountEntity);
      repository.save.mockResolvedValue(updatedAccount as AccountEntity);

      const result = await service.update(
        '123e4567-e89b-12d3-a456-426614174000',
        {
          accountType: AccountType.OWNER,
        },
      );

      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent account', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { accountType: AccountType.OWNER }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateAccount', () => {
    it('should soft delete an account', async () => {
      repository.findOne.mockResolvedValue(mockAccount as AccountEntity);
      repository.softRemove.mockResolvedValue(mockAccount as AccountEntity);

      await service.deactivateAccount('123e4567-e89b-12d3-a456-426614174000');

      expect(repository.softRemove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when deactivating non-existent account', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.deactivateAccount('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
