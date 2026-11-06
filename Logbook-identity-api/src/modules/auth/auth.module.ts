import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { AccountEntity } from '../../account/account.entity';
import { AccountIdentifierEntity } from '../../account-identifier/account-identifier.entity';
import { FishermanProfileEntity } from '../../fisherman-profile/fisherman-profile.entity';
import { PasswordHistoryEntity } from '../../password-history/password-history.entity';
import { SessionEntity } from '../../session/session.entity';
import { LoginAttemptEntity } from '../../login-attempt/login-attempt.entity';
import { VerificationCodeEntity } from '../../verification-code/verification-code.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenService } from './utils/token.util';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AccessTokenGuard } from './guards/access-token.guard';
import { IdentifierNormalizer } from '../../account-identifier/identifier-normalizer.service';
import { EmailClientService } from './email-client.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([
      AccountEntity,
      AccountIdentifierEntity,
      FishermanProfileEntity,
      PasswordHistoryEntity,
      SessionEntity,
      LoginAttemptEntity,
      VerificationCodeEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    AccessTokenGuard,
    IdentifierNormalizer,
    EmailClientService,
  ],
  exports: [AuthService, AccessTokenGuard, JwtStrategy],
})
export class AuthModule {}
