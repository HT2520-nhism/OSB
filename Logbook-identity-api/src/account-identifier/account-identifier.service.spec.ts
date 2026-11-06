import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { AccountIdentifierService } from './account-identifier.service';
import { AccountIdentifierEntity } from './account-identifier.entity';
import { AccountEntity } from '../account/account.entity';
import { IdentifierNormalizer } from './identifier-normalizer.service';
import { IdentifierType } from '../constants/enums/identifier-type.enum';
import { AccountStatus } from '../constants/enums/account-status.enum';

describe('AccountIdentifierService', () => {
  let service: AccountIdentifierService;
  let identifierRepository: jest.Mocked<Repository<AccountIdentifierEntity>>;
  let accountRepository: jest.Mocked<Repository<AccountEntity>>;

  const mockAccount: Partial<AccountEntity> = {
    id: 'account-123',
    status: AccountStatus.PENDING,
    deletedAt: undefined,
  };

  const mockIdentifier: Partial<AccountIdentifierEntity> = {
    id: 'identifier-123',
    accountId: 'account-123',
    type: IdentifierType.EMAIL,
    value: 'user@example.com',
    normalizedValue: 'user@example.com',
    isPrimary: false,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountIdentifierService,
        IdentifierNormalizer,
        {
          provide: getRepositoryToken(AccountIdentifierEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<AccountIdentifierService>(AccountIdentifierService);
    identifierRepository = module.get(
      getRepositoryToken(AccountIdentifierEntity),
    );
    accountRepository = module.get(getRepositoryToken(AccountEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addIdentifier', () => {
    it('should throw NotFoundException when account does not exist', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addIdentifier('non-existent', {
          type: IdentifierType.EMAIL,
          value: 'user@example.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when identifier already exists', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as AccountEntity);
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );

      await expect(
        service.addIdentifier('account-123', {
          type: IdentifierType.EMAIL,
          value: 'user@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByAccountId', () => {
    it('should return identifiers for account', async () => {
      identifierRepository.find.mockResolvedValue([
        mockIdentifier as AccountIdentifierEntity,
      ]);

      const result = await service.findByAccountId('account-123');

      expect(result).toHaveLength(1);
      expect(identifierRepository.find).toHaveBeenCalledWith({
        where: { accountId: 'account-123' },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('should return identifier when found', async () => {
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );

      const result = await service.findById('identifier-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('identifier-123');
    });

    it('should throw NotFoundException when identifier not found', async () => {
      identifierRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteIdentifier', () => {
    it('should delete identifier when it belongs to account', async () => {
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );
      identifierRepository.remove.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );

      await service.deleteIdentifier('identifier-123', 'account-123');

      expect(identifierRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when identifier does not belong to account', async () => {
      identifierRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteIdentifier('identifier-123', 'wrong-account'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTypeAndValue', () => {
    it('should find identifier by type and value', async () => {
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );

      const result = await service.findByTypeAndValue(
        IdentifierType.EMAIL,
        'user@example.com',
      );

      expect(result).toBeDefined();
    });
  });
});
