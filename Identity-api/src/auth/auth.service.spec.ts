import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { UserEntity } from '../user/user.entity';
import { config } from '../config';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('../config', () => ({
  config: {
    PROJECT_NAME: 'identity-api',
    LOG_LEVEL: 'fatal',
    ENV: 'test',
    MICROSOFT_AUTH: {
      TENANT_ID: 'fake-tenant-id',
      CLIENT_ID: 'fake-client-id',
      ALLOWED_DOMAINS: 'company.com,seacom.net.vn',
    },
  },
}));

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  createRemoteJWKSet: jest.fn(),
}));

describe('[auth] Authentication Service - Microsoft Login', () => {
  let authService: AuthService;
  let userRepo: Repository<UserEntity>;
  let jwtService: JwtService;

  const mockUserRepo = {
    findOne: jest.fn(),
    insert: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login() - successful cases', () => {
    const validIdToken = 'valid.microsoft.id.token';

    const mockPayload = {
      email: 'cuongpd@seacom.net.vn',
      name: 'Pham Duc Cuong',
      aud: config.MICROSOFT_AUTH.CLIENT_ID,
      iss: `https://login.microsoftonline.com/${config.MICROSOFT_AUTH.TENANT_ID}/v2.0`,
    };

    const createdUser = {
      id: 'new-user-uuid-123',
      email: mockPayload.email,
      name: mockPayload.name,
      backofficeRoles: [],
      company: undefined,
      department: undefined,
      dateOfBirth: undefined,
    };

    beforeEach(() => {
      const { jwtVerify, createRemoteJWKSet } = require('jose');
      (createRemoteJWKSet as jest.Mock).mockReturnValue('fake-jwks');
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
      });
    });

    it('should create new user and return JWT if user does not exist', async () => {
      (userRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createdUser);

      (userRepo.save as jest.Mock).mockResolvedValue(createdUser);

      (jwtService.sign as jest.Mock).mockReturnValue('internal.jwt.token');

      const result = await authService.login(validIdToken);

      expect(userRepo.findOne).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(userRepo.insert).not.toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'new-user-uuid-123',
          name: 'Pham Duc Cuong',
        }),
      );
      expect(result).toEqual({ token: 'internal.jwt.token' });
    });

    it('should return JWT for existing user without creating new one', async () => {
      const existingUser = {
        id: 'existing-user-uuid-456',
        email: 'cuongpd@seacom.net.vn',
        name: 'Cuong Pham',
        backofficeRoles: [],
        company: undefined,
        department: undefined,
        dateOfBirth: undefined,
      };

      (userRepo.findOne as jest.Mock).mockResolvedValue(existingUser);
      (jwtService.sign as jest.Mock).mockReturnValue('existing.user.jwt');

      const result = await authService.login(validIdToken);

      expect(userRepo.findOne).toHaveBeenCalled();
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(result).toEqual({ token: 'existing.user.jwt' });
    });
  });

  describe('login() - error cases', () => {
    it('should throw UnauthorizedException if domain not allowed', async () => {
      const invalidEmailPayload = {
        email: 'cuongpd@gmail.com',
        name: 'Cuong Pham',
        aud: config.MICROSOFT_AUTH.CLIENT_ID,
        iss: `https://login.microsoftonline.com/${config.MICROSOFT_AUTH.TENANT_ID}/v2.0`,
      };

      const { jwtVerify } = require('jose');
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: invalidEmailPayload,
      });

      await expect(authService.login('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.login('some-token')).rejects.toThrow(
        'Email domain not allowed',
      );
    });

    it('should throw if jwtVerify fails', async () => {
      const { jwtVerify } = require('jose');
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(authService.login('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
