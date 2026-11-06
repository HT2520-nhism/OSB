import { AccountEntity } from "../src/account/account.entity";
import { AccountIdentifierEntity } from "../src/account-identifier/account-identifier.entity";
import { FishermanProfileEntity } from "../src/fisherman-profile/fisherman-profile.entity";
import { RoleEntity } from "../src/role/role.entity";
import { AccountRoleEntity } from "../src/account-role/account-role.entity";
import { PasswordHistoryEntity } from "../src/password-history/password-history.entity";
import { VerificationCodeEntity } from "../src/verification-code/verification-code.entity";
import { PasswordResetRequestEntity } from "../src/password-reset-request/password-reset-request.entity";
import { LoginAttemptEntity } from "../src/login-attempt/login-attempt.entity";
import { SessionEntity } from "../src/session/session.entity";
import { AccountStatusHistoryEntity } from "../src/account-status-history/account-status-history.entity";


export const ENTITIES = [
  AccountEntity,
  AccountIdentifierEntity,
  FishermanProfileEntity,
  RoleEntity,
  AccountRoleEntity,
  PasswordHistoryEntity,
  VerificationCodeEntity,
  PasswordResetRequestEntity,
  LoginAttemptEntity,
  SessionEntity,
  AccountStatusHistoryEntity,
];
