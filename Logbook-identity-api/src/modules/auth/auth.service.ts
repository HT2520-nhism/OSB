import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';

import { AccountEntity } from '../../account/account.entity';
import { AccountIdentifierEntity } from '../../account-identifier/account-identifier.entity';
import { FishermanProfileEntity } from '../../fisherman-profile/fisherman-profile.entity';
import { PasswordHistoryEntity } from '../../password-history/password-history.entity';
import { SessionEntity } from '../../session/session.entity';
import { LoginAttemptEntity } from '../../login-attempt/login-attempt.entity';
import { VerificationCodeEntity } from '../../verification-code/verification-code.entity';

import { IdentifierType } from '../../constants/enums/identifier-type.enum';
import { AccountStatus } from '../../constants/enums/account-status.enum';
import { AccountType } from '../../constants/enums/account-type.enum';
import { ProfileStatus } from '../../constants/enums/profile-status.enum';
import { PasswordChangeReason } from '../../constants/enums/password-change-reason.enum';
import { LoginIdentifierType } from '../../constants/enums/login-identifier-type.enum';
import { LoginFailureReason } from '../../constants/enums/login-failure-reason.enum';
import { VerificationPurpose } from '../../constants/enums/verification-purpose.enum';
import { VerificationChannel } from '../../constants/enums/verification-channel.enum';

import { IdentifierNormalizer } from '../../account-identifier/identifier-normalizer.service';
import { EmailClientService } from './email-client.service';

import { TokenService } from './utils/token.util';
import {
  generateSecurePassword,
  generateRefreshToken,
  hashToken,
  generateDeviceId,
} from './utils/password.util';
import { hashPassword, verifyPassword } from './utils/hash.util';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  RegistrationResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : defaultValue;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(AccountIdentifierEntity)
    private readonly identifierRepository: Repository<AccountIdentifierEntity>,
    @InjectRepository(FishermanProfileEntity)
    private readonly profileRepository: Repository<FishermanProfileEntity>,
    @InjectRepository(PasswordHistoryEntity)
    private readonly passwordHistoryRepository: Repository<PasswordHistoryEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(LoginAttemptEntity)
    private readonly loginAttemptRepository: Repository<LoginAttemptEntity>,
    @InjectRepository(VerificationCodeEntity)
    private readonly verificationCodeRepository: Repository<VerificationCodeEntity>,
    private readonly dataSource: DataSource,
    private readonly identifierNormalizer: IdentifierNormalizer,
    private readonly tokenService: TokenService,
    private readonly emailClientService: EmailClientService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ response: RegistrationResponseDto; generatedPassword: string }> {
    const normalizedIdentifier = this.identifierNormalizer.normalize(
      dto.identifierType,
      dto.identifier,
    );

    const existingIdentifier = await this.identifierRepository.findOne({
      where: {
        type: dto.identifierType,
        normalizedValue: normalizedIdentifier,
      },
    });

    if (existingIdentifier) {
      throw new ConflictException(
        `An account with this ${
          dto.identifierType === IdentifierType.EMAIL ? 'email' : 'phone'
        } already exists`,
      );
    }

    const generatedPassword = generateSecurePassword(12);
    const passwordHash = await hashPassword(generatedPassword.plaintext);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = queryRunner.manager.create(AccountEntity, {
        status: AccountStatus.PENDING,
        accountType: AccountType.FISHERMAN,
        passwordHash,
        failedLoginAttempts: 0,
      });
      const savedAccount = await queryRunner.manager.save(account);

      const identifier = queryRunner.manager.create(AccountIdentifierEntity, {
        accountId: savedAccount.id,
        type: dto.identifierType,
        value: dto.identifier,
        normalizedValue: normalizedIdentifier,
        isPrimary: true,
        isVerified: false,
      });
      await queryRunner.manager.save(identifier);

      const profile = queryRunner.manager.create(FishermanProfileEntity, {
        accountId: savedAccount.id,
        fullName: dto.fullName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        nationality: dto.nationality,
        placeOfBirth: dto.placeOfBirth,
        identityDocumentNumber: dto.identityDocumentNumber,
        provinceCode: dto.provinceCode,
        districtCode: dto.districtCode,
        wardCode: dto.wardCode,
        profileStatus: ProfileStatus.INCOMPLETE,
      });
      await queryRunner.manager.save(profile);

      const passwordHistory = queryRunner.manager.create(
        PasswordHistoryEntity,
        {
          accountId: savedAccount.id,
          passwordHash,
          changeReason: PasswordChangeReason.GENERATED_ON_REGISTER,
        },
      );
      await queryRunner.manager.save(passwordHistory);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Account registered: ${savedAccount.id}`,
        'RegistrationService',
      );

      // Send registration email asynchronously - don't fail registration if email fails
      this.emailClientService
        .sendRegistrationEmail(
          dto.identifier,
          dto.fullName,
          generatedPassword.plaintext,
        )
        .catch((err) => {
          this.logger.error(
            `Failed to send registration email to ${dto.identifier}: ${err.message}`,
            err.stack,
            'EmailClientService',
          );
        });

      const response: RegistrationResponseDto = {
        account: {
          id: savedAccount.id,
          status: savedAccount.status,
          accountType: savedAccount.accountType,
        },
        identifier: {
          type: identifier.type,
          value: identifier.value,
          isPrimary: identifier.isPrimary,
          isVerified: identifier.isVerified,
        },
        profile: {
          fullName: profile.fullName,
          profileStatus: profile.profileStatus,
        },
      };

      return { response, generatedPassword: generatedPassword.plaintext };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if ((error as any).code === '23505') {
        throw new ConflictException(
          `An account with this ${
            dto.identifierType === IdentifierType.EMAIL ? 'email' : 'phone'
          } already exists`,
        );
      }

      throw new InternalServerErrorException('Failed to create account');
    } finally {
      await queryRunner.release();
    }
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
    deviceId?: string,
  ): Promise<LoginResponseDto> {
    const normalizedIdentifier = this.identifierNormalizer.normalize(
      dto.identifierType,
      dto.identifier,
    );

    const identifier = await this.identifierRepository.findOne({
      where: {
        type: dto.identifierType,
        normalizedValue: normalizedIdentifier,
      },
    });

    if (!identifier) {
      await this.recordFailedLoginAttempt(
        dto.identifierType,
        dto.identifier,
        LoginFailureReason.INVALID_IDENTIFIER,
        ipAddress,
        userAgent,
        deviceId,
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    const account = await this.accountRepository.findOne({
      where: { id: identifier.accountId, deletedAt: IsNull() },
    });

    if (!account) {
      await this.recordFailedLoginAttempt(
        dto.identifierType,
        dto.identifier,
        LoginFailureReason.INVALID_IDENTIFIER,
        ipAddress,
        userAgent,
        deviceId,
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.isLoginAllowed(account.status, account.lockedUntil)) {
      await this.recordFailedLoginAttempt(
        dto.identifierType,
        dto.identifier,
        this.getFailureReason(account.status),
        ipAddress,
        userAgent,
        deviceId,
        account.id,
      );

      throw new UnauthorizedException('Account is not allowed to login');
    }

    const isPasswordValid = await verifyPassword(
      dto.password,
      account.passwordHash || '',
    );

    if (!isPasswordValid) {
      const maxAttempts = getEnvNumber('AUTH_MAX_LOGIN_ATTEMPT', 5);
      const newFailedAttempts = account.failedLoginAttempts + 1;

      if (newFailedAttempts >= maxAttempts) {
        const lockDurationMinutes = getEnvNumber(
          'AUTH_LOCK_DURATION_MINUTES',
          15,
        );
        const lockedUntil = new Date(
          Date.now() + lockDurationMinutes * 60 * 1000,
        );

        await this.accountRepository.update(account.id, {
          failedLoginAttempts: newFailedAttempts,
          status: AccountStatus.LOCKED,
          lockedUntil,
        });

        await this.recordFailedLoginAttempt(
          dto.identifierType,
          dto.identifier,
          LoginFailureReason.ACCOUNT_LOCKED,
          ipAddress,
          userAgent,
          deviceId,
          account.id,
        );

        this.logger.warn(`Account locked: ${account.id}`, 'AuthService');

        throw new UnauthorizedException(
          'Account has been locked due to too many failed attempts',
        );
      }

      await this.accountRepository.update(account.id, {
        failedLoginAttempts: newFailedAttempts,
      });

      await this.recordFailedLoginAttempt(
        dto.identifierType,
        dto.identifier,
        LoginFailureReason.INVALID_PASSWORD,
        ipAddress,
        userAgent,
        deviceId,
        account.id,
      );

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.accountRepository.update(account.id, {
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
    });

    await this.recordSuccessfulLoginAttempt(
      dto.identifierType,
      dto.identifier,
      ipAddress,
      userAgent,
      deviceId,
      account.id,
    );

    const accessToken = this.tokenService.generateAccessToken({
      sub: account.id,
      accountType: account.accountType,
      systemRole: account.systemRole,
      sessionId: '__SESSION_ID__',
    });

    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    const sessionExpiryDays = getEnvNumber('SESSION_EXPIRES_IN_DAYS', 7);
    const expiresAt = new Date(
      Date.now() + sessionExpiryDays * 24 * 60 * 60 * 1000,
    );

    const session = this.sessionRepository.create({
      accountId: account.id,
      refreshTokenHash,
      deviceId: deviceId || generateDeviceId(),
      ipAddress,
      userAgent,
      expiresAt,
    });
    const savedSession = await this.sessionRepository.save(session);

    // Replace placeholder sessionId with real ID
    const realAccessToken = this.tokenService.generateAccessToken({
      sub: account.id,
      accountType: account.accountType,
      systemRole: account.systemRole,
      sessionId: savedSession.id,
    });

    this.logger.log(`User logged in: ${account.id}`, 'AuthService');

    return {
      accessToken: realAccessToken,
      refreshToken,
      expiresIn: this.tokenService.getAccessTokenExpiry(),
      tokenType: 'Bearer',
      user: {
        id: account.id,
        accountType: account.accountType,
        systemRole: account.systemRole,
      },
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    const refreshTokenHash = hashToken(refreshToken);

    const session = await this.sessionRepository.findOne({
      where: { refreshTokenHash, revokedAt: IsNull() },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    const account = await this.accountRepository.findOne({
      where: { id: session.accountId, deletedAt: IsNull() },
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    if (!this.isLoginAllowed(account.status, account.lockedUntil)) {
      throw new UnauthorizedException('Account is not allowed to login');
    }

    await this.sessionRepository.update(session.id, {
      revokedAt: new Date(),
    });

    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const sessionExpiryDays = getEnvNumber('SESSION_EXPIRES_IN_DAYS', 7);
    const expiresAt = new Date(
      Date.now() + sessionExpiryDays * 24 * 60 * 60 * 1000,
    );

    const newSession = this.sessionRepository.create({
      accountId: account.id,
      refreshTokenHash: newRefreshTokenHash,
      deviceId: session.deviceId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      expiresAt,
    });
    await this.sessionRepository.save(newSession);

    const newAccessToken = this.tokenService.generateAccessToken({
      sub: account.id,
      accountType: account.accountType,
      systemRole: account.systemRole,
      sessionId: newSession.id,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.tokenService.getAccessTokenExpiry(),
      tokenType: 'Bearer',
    };
  }

  async logout(sessionId: string, accountId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, accountId, revokedAt: IsNull() },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    await this.sessionRepository.update(sessionId, {
      revokedAt: new Date(),
    });

    this.logger.log(`Session revoked: ${sessionId}`, 'AuthService');
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session && !session.revokedAt) {
      await this.sessionRepository.update(sessionId, {
        revokedAt: new Date(),
      });
    }
  }

  async revokeAllSessions(accountId: string): Promise<void> {
    await this.sessionRepository.update(
      { accountId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    this.logger.log(
      `All sessions revoked for account: ${accountId}`,
      'AuthService',
    );
  }

  async getActiveSessions(accountId: string): Promise<SessionEntity[]> {
    return this.sessionRepository.find({
      where: { accountId, revokedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string; expiresIn: number }> {
    const normalizedIdentifier = this.identifierNormalizer.normalize(
      dto.identifierType,
      dto.identifier,
    );

    const identifier = await this.identifierRepository.findOne({
      where: {
        type: dto.identifierType,
        normalizedValue: normalizedIdentifier,
      },
    });

    if (!identifier) {
      this.logger.warn(
        `Password reset attempt for non-existent: ${dto.identifier}`,
      );
      return {
        message: 'Verification code sent to your email',
        expiresIn: 5,
      };
    }

    const account = await this.accountRepository.findOne({
      where: { id: identifier.accountId, deletedAt: IsNull() },
    });

    if (!account) {
      this.logger.warn(
        `Password reset attempt for deleted account: ${identifier.accountId}`,
      );
      return {
        message: 'Verification code sent to your email',
        expiresIn: 5,
      };
    }

    const otp = this.generateOTP(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Invalidate existing OTP codes for this identifier
      await queryRunner.manager.update(
        VerificationCodeEntity,
        {
          identifierId: identifier.id,
          purpose: VerificationPurpose.PASSWORD_RESET,
          verifiedAt: IsNull(),
        },
        { verifiedAt: new Date() },
      );

      const verificationCode = queryRunner.manager.create(
        VerificationCodeEntity,
        {
          identifierId: identifier.id,
          accountId: identifier.accountId,
          purpose: VerificationPurpose.PASSWORD_RESET,
          channel: VerificationChannel.EMAIL,
          codeHash: await hashToken(otp),
          expiresAt,
          attemptCount: 0,
        },
      );
      await queryRunner.manager.save(verificationCode);

      await queryRunner.commitTransaction();

      // Send OTP via email asynchronously
      this.emailClientService
        .sendPasswordResetOTP(dto.identifier, otp)
        .catch((err) => {
          this.logger.error(
            `Failed to send password reset OTP to ${dto.identifier}: ${err.message}`,
            err.stack,
            'EmailClientService',
          );
        });

      this.logger.log(
        `Password reset OTP generated for account: ${account.id}`,
      );

      return {
        message: 'Verification code sent to your email',
        expiresIn: 5,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to generate password reset OTP for: ${dto.identifier}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to process password reset request',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const normalizedIdentifier = this.identifierNormalizer.normalize(
      dto.identifierType,
      dto.identifier,
    );

    const identifier = await this.identifierRepository.findOne({
      where: {
        type: dto.identifierType,
        normalizedValue: normalizedIdentifier,
      },
    });

    if (!identifier) {
      throw new BadRequestException('Invalid verification code');
    }

    const verificationCode = await this.verificationCodeRepository.findOne({
      where: {
        identifierId: identifier.id,
        purpose: VerificationPurpose.PASSWORD_RESET,
        verifiedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

    if (verificationCode.expiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    if (verificationCode.attemptCount >= 5) {
      throw new BadRequestException('Too many failed attempts');
    }

    // Verify OTP
    const isValid = await this.verifyCode(verificationCode.codeHash, dto.otp);
    if (!isValid) {
      await this.verificationCodeRepository.increment(
        { id: verificationCode.id },
        'attemptCount',
        1,
      );
      throw new BadRequestException('Invalid verification code');
    }

    const passwordHash = await hashPassword(dto.newPassword);
    const account = await this.accountRepository.findOne({
      where: { id: identifier.accountId, deletedAt: IsNull() },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update password
      await queryRunner.manager.update(AccountEntity, account.id, {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: undefined as any,
      });

      // Save password history
      const passwordHistory = queryRunner.manager.create(
        PasswordHistoryEntity,
        {
          accountId: account.id,
          passwordHash,
          changeReason: PasswordChangeReason.PASSWORD_RESET,
        },
      );
      await queryRunner.manager.save(passwordHistory);

      // Mark verification code as used
      await queryRunner.manager.update(
        VerificationCodeEntity,
        verificationCode.id,
        {
          verifiedAt: new Date(),
        },
      );

      await queryRunner.commitTransaction();

      // Send password changed notification asynchronously
      this.emailClientService
        .sendPasswordChangedNotification(dto.identifier)
        .catch((err) => {
          this.logger.error(
            `Failed to send password changed notification to ${dto.identifier}: ${err.message}`,
            err.stack,
            'EmailClientService',
          );
        });

      this.logger.log(`Password reset completed for account: ${account.id}`);

      return { message: 'Password reset successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to reset password for: ${dto.identifier}`,
        error,
      );
      throw new InternalServerErrorException('Failed to reset password');
    } finally {
      await queryRunner.release();
    }
  }

  private generateOTP(length: number): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  private async verifyCode(codeHash: string, code: string): Promise<boolean> {
    const hashedCode = hashToken(code);
    return hashedCode === codeHash;
  }

  private isLoginAllowed(status: AccountStatus, lockedUntil?: Date): boolean {
    if (status === AccountStatus.ACTIVE || status === AccountStatus.PENDING) {
      if (lockedUntil && lockedUntil > new Date()) {
        return false;
      }
      return true;
    }

    return false;
  }

  private getFailureReason(status: AccountStatus): LoginFailureReason {
    switch (status) {
      case AccountStatus.LOCKED:
        return LoginFailureReason.ACCOUNT_LOCKED;
      case AccountStatus.SUSPENDED:
        return LoginFailureReason.ACCOUNT_SUSPENDED;
      case AccountStatus.DISABLED:
        return LoginFailureReason.ACCOUNT_DISABLED;
      default:
        return LoginFailureReason.OTHER;
    }
  }

  private async recordFailedLoginAttempt(
    identifierType: IdentifierType,
    identifier: string,
    reason: LoginFailureReason,
    ipAddress?: string,
    userAgent?: string,
    deviceId?: string,
    accountId?: string,
  ): Promise<void> {
    const loginIdentifierType =
      identifierType === IdentifierType.EMAIL
        ? LoginIdentifierType.EMAIL
        : LoginIdentifierType.PHONE;

    const attempt = this.loginAttemptRepository.create({
      accountId,
      identifierType: loginIdentifierType,
      identifierValue: identifier,
      success: false,
      failureReason: reason,
      ipAddress,
      userAgent,
      deviceId,
    });

    await this.loginAttemptRepository.save(attempt);

    this.logger.warn(`Login failed: ${reason}`, 'AuthService');
  }

  private async recordSuccessfulLoginAttempt(
    identifierType: IdentifierType,
    identifier: string,
    ipAddress?: string,
    userAgent?: string,
    deviceId?: string,
    accountId?: string,
  ): Promise<void> {
    const loginIdentifierType =
      identifierType === IdentifierType.EMAIL
        ? LoginIdentifierType.EMAIL
        : LoginIdentifierType.PHONE;

    const attempt = this.loginAttemptRepository.create({
      accountId,
      identifierType: loginIdentifierType,
      identifierValue: identifier,
      success: true,
      ipAddress,
      userAgent,
      deviceId,
    });

    await this.loginAttemptRepository.save(attempt);
  }
}
