import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { FishermanProfileService } from './fisherman-profile.service';
import { FishermanProfileEntity } from './fisherman-profile.entity';
import { AccountEntity } from '../account/account.entity';
import { ProfileStatus } from '../constants/enums/profile-status.enum';
import { IdentityDocumentType } from '../constants/enums/identity-document-type.enum';
import { AccountStatus } from '../constants/enums/account-status.enum';

describe('FishermanProfileService', () => {
  let service: FishermanProfileService;
  let profileRepository: jest.Mocked<Repository<FishermanProfileEntity>>;
  let accountRepository: jest.Mocked<Repository<AccountEntity>>;

  const mockAccount: Partial<AccountEntity> = {
    id: 'account-123',
    status: AccountStatus.PENDING,
    deletedAt: undefined,
  };

  const mockProfile: Partial<FishermanProfileEntity> = {
    id: 'profile-123',
    accountId: 'account-123',
    fullName: 'Nguyen Van A',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Male',
    nationality: 'Vietnamese',
    placeOfBirth: 'Hanoi',
    identityDocumentType: IdentityDocumentType.CCCD,
    identityDocumentNumber: '012345678901',
    profileStatus: ProfileStatus.INCOMPLETE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FishermanProfileService,
        {
          provide: getRepositoryToken(FishermanProfileEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FishermanProfileService>(FishermanProfileService);
    profileRepository = module.get(getRepositoryToken(FishermanProfileEntity));
    accountRepository = module.get(getRepositoryToken(AccountEntity));
  });

  describe('createProfile', () => {
    it('should create a profile successfully', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as AccountEntity);
      profileRepository.findOne.mockResolvedValue(null);
      profileRepository.create.mockReturnValue(
        mockProfile as FishermanProfileEntity,
      );
      profileRepository.save.mockResolvedValue(
        mockProfile as FishermanProfileEntity,
      );

      const result = await service.createProfile('account-123', {
        fullName: 'Nguyen Van A',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        nationality: 'Vietnamese',
      });

      expect(result.fullName).toBe('Nguyen Van A');
      expect(profileRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-123',
          fullName: 'Nguyen Van A',
          profileStatus: ProfileStatus.INCOMPLETE,
        }),
      );
    });

    it('should throw NotFoundException when account does not exist', async () => {
      accountRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createProfile('non-existent', {
          fullName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when profile already exists', async () => {
      accountRepository.findOne.mockResolvedValue(mockAccount as AccountEntity);
      profileRepository.findOne.mockResolvedValue(
        mockProfile as FishermanProfileEntity,
      );

      await expect(
        service.createProfile('account-123', {
          fullName: 'Nguyen Van A',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByAccountId', () => {
    it('should return profile when found', async () => {
      profileRepository.findOne.mockResolvedValue(
        mockProfile as FishermanProfileEntity,
      );

      const result = await service.findByAccountId('account-123');

      expect(result).toBeDefined();
      expect(result.fullName).toBe('Nguyen Van A');
    });

    it('should throw NotFoundException when profile not found', async () => {
      profileRepository.findOne.mockResolvedValue(null);

      await expect(service.findByAccountId('account-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      const updatedProfile = { ...mockProfile, fullName: 'Updated Name' };
      profileRepository.findOne
        .mockResolvedValueOnce(mockProfile as FishermanProfileEntity)
        .mockResolvedValueOnce(updatedProfile as FishermanProfileEntity);
      profileRepository.save.mockResolvedValue(
        updatedProfile as FishermanProfileEntity,
      );

      const result = await service.updateProfile('account-123', {
        fullName: 'Updated Name',
      });

      expect(result.fullName).toBe('Updated Name');
    });

    it('should throw NotFoundException when updating non-existent profile', async () => {
      profileRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('account-123', {
          fullName: 'Updated Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not allow updating profileStatus', async () => {
      const profileWithStatus = {
        ...mockProfile,
        profileStatus: ProfileStatus.INCOMPLETE,
      };
      profileRepository.findOne.mockResolvedValue(
        profileWithStatus as FishermanProfileEntity,
      );
      profileRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity as FishermanProfileEntity),
      );

      await service.updateProfile('account-123', {
        fullName: 'Updated Name',
      });

      expect(profileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          profileStatus: ProfileStatus.INCOMPLETE,
        }),
      );
    });
  });
});
