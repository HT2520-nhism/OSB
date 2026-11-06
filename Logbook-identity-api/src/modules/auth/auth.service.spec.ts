import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { TokenService } from './utils/token.util';
import { IdentifierNormalizer } from '../../account-identifier/identifier-normalizer.service';
import { AccountEntity } from '../../account/account.entity';
import { AccountIdentifierEntity } from '../../account-identifier/account-identifier.entity';
import { FishermanProfileEntity } from '../../fisherman-profile/fisherman-profile.entity';
import { PasswordHistoryEntity } from '../../password-history/password-history.entity';
import { SessionEntity } from '../../session/session.entity';
import { LoginAttemptEntity } from '../../login-attempt/login-attempt.entity';
import { IdentifierType } from '../../constants/enums/identifier-type.enum';
import { AccountStatus } from '../../constants/enums/account-status.enum';
import { AccountType } from '../../constants/enums/account-type.enum';
import { ProfileStatus } from '../../constants/enums/profile-status.enum';

describe('AuthService', () => {
  let service: AuthService;
  let accountRepository: jest.Mocked<Repository<AccountEntity>>;
  let identifierRepository: jest.Mocked<Repository<AccountIdentifierEntity>>;
  let profileRepository: jest.Mocked<Repository<FishermanProfileEntity>>;
  let passwordHistoryRepository: jest.Mocked<Repository<PasswordHistoryEntity>>;
  let sessionRepository: jest.Mocked<Repository<SessionEntity>>;
  let loginAttemptRepository: jest.Mocked<Repository<LoginAttemptEntity>>;
  let tokenService: TokenService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockAccount: Partial<AccountEntity> = {
    id: 'account-123',
    status: AccountStatus.PENDING,
    accountType: AccountType.FISHERMAN,
    passwordHash: '$2b$12$hashedpassword',
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockIdentifier: Partial<AccountIdentifierEntity> = {
    id: 'identifier-123',
    accountId: 'account-123',
    type: IdentifierType.EMAIL,
    value: 'user@example.com',
    normalizedValue: 'user@example.com',
    isPrimary: true,
    isVerified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        IdentifierNormalizer,
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AccountIdentifierEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FishermanProfileEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PasswordHistoryEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LoginAttemptEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
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

    service = module.get<AuthService>(AuthService);
    accountRepository = module.get(getRepositoryToken(AccountEntity));
    identifierRepository = module.get(
      getRepositoryToken(AccountIdentifierEntity),
    );
    profileRepository = module.get(getRepositoryToken(FishermanProfileEntity));
    passwordHistoryRepository = module.get(
      getRepositoryToken(PasswordHistoryEntity),
    );
    sessionRepository = module.get(getRepositoryToken(SessionEntity));
    loginAttemptRepository = module.get(getRepositoryToken(LoginAttemptEntity));
    tokenService = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException when identifier already exists', async () => {
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );

      await expect(
        service.register({
          fullName: 'Test User',
          identifierType: IdentifierType.EMAIL,
          identifier: 'user@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register successfully with new identifier', async () => {
      identifierRepository.findOne.mockResolvedValue(null);

      const savedAccount = { ...mockAccount, id: 'new-account-id' };
      const savedIdentifier = { ...mockIdentifier, id: 'new-identifier-id' };
      const savedProfile = {
        id: 'new-profile-id',
        fullName: 'Test User',
        profileStatus: ProfileStatus.INCOMPLETE,
      };
      const savedHistory = { id: 'history-id' };

      mockQueryRunner.manager.create
        .mockReturnValueOnce(savedAccount)
        .mockReturnValueOnce(savedIdentifier)
        .mockReturnValueOnce(savedProfile)
        .mockReturnValueOnce(savedHistory);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(savedAccount)
        .mockResolvedValueOnce(savedIdentifier)
        .mockResolvedValueOnce(savedProfile)
        .mockResolvedValueOnce(savedHistory);

      const result = await service.register({
        fullName: 'Test User',
        identifierType: IdentifierType.EMAIL,
        identifier: 'User@Example.com',
      });

      expect(result.response.account.id).toBe('new-account-id');
      expect(result.response.identifier.type).toBe(IdentifierType.EMAIL);
      expect(result.response.identifier.value).toBe('user@example.com');
      expect(result.generatedPassword).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      identifierRepository.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.create.mockReturnValue(mockAccount);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.register({
          fullName: 'Test User',
          identifierType: IdentifierType.EMAIL,
          identifier: 'user@example.com',
        }),
      ).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid identifier', async () => {
      identifierRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          identifierType: IdentifierType.EMAIL,
          identifier: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(loginAttemptRepository.create).toHaveBeenCalled();
      expect(loginAttemptRepository.save).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for LOCKED account', async () => {
      const lockedAccount = {
        ...mockAccount,
        status: AccountStatus.LOCKED,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      };
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );
      accountRepository.findOne.mockResolvedValue(
        lockedAccount as AccountEntity,
      );

      await expect(
        service.login({
          identifierType: IdentifierType.EMAIL,
          identifier: 'user@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for SUSPENDED account', async () => {
      const suspendedAccount = {
        ...mockAccount,
        status: AccountStatus.SUSPENDED,
      };
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );
      accountRepository.findOne.mockResolvedValue(
        suspendedAccount as AccountEntity,
      );

      await expect(
        service.login({
          identifierType: IdentifierType.EMAIL,
          identifier: 'user@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for DISABLED account', async () => {
      const disabledAccount = {
        ...mockAccount,
        status: AccountStatus.DISABLED,
      };
      identifierRepository.findOne.mockResolvedValue(
        mockIdentifier as AccountIdentifierEntity,
      );
      accountRepository.findOne.mockResolvedValue(
        disabledAccount as AccountEntity,
      );

      await expect(
        service.login({
          identifierType: IdentifierType.EMAIL,
          identifier: 'user@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('isLoginAllowed', () => {
    it('should allow PENDING accounts', () => {
      const result = (service as any).isLoginAllowed(
        AccountStatus.PENDING,
        undefined,
      );
      expect(result).toBe(true);
    });

    it('should allow ACTIVE accounts', () => {
      const result = (service as any).isLoginAllowed(
        AccountStatus.ACTIVE,
        undefined,
      );
      expect(result).toBe(true);
    });

    it('should deny LOCKED accounts with future lock expiry', () => {
      const futureLock = new Date(Date.now() + 15 * 60 * 1000);
      const result = (service as any).isLoginAllowed(
        AccountStatus.LOCKED,
        futureLock,
      );
      expect(result).toBe(false);
    });

    it('should deny LOCKED accounts regardless of lock expiry', () => {
      const pastLock = new Date(Date.now() - 15 * 60 * 1000);
      const result = (service as any).isLoginAllowed(
        AccountStatus.LOCKED,
        pastLock,
      );
      expect(result).toBe(false);
    });

    it('should deny SUSPENDED accounts', () => {
      const result = (service as any).isLoginAllowed(
        AccountStatus.SUSPENDED,
        undefined,
      );
      expect(result).toBe(false);
    });

    it('should deny DISABLED accounts', () => {
      const result = (service as any).isLoginAllowed(
        AccountStatus.DISABLED,
        undefined,
      );
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should revoke session successfully', async () => {
      const mockSession: Partial<SessionEntity> = {
        id: 'session-123',
        accountId: 'account-123',
        revokedAt: undefined,
      };
      sessionRepository.findOne.mockResolvedValue(mockSession as SessionEntity);

      await service.logout('session-123', 'account-123');

      expect(sessionRepository.update).toHaveBeenCalledWith('session-123', {
        revokedAt: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException when session not found', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.logout('invalid-session', 'account-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all sessions for an account', async () => {
      await service.revokeAllSessions('account-123');

      expect(sessionRepository.update).toHaveBeenCalledWith(
        { accountId: 'account-123', revokedAt: expect.anything() },
        { revokedAt: expect.any(Date) },
      );
    });
  });
});
