import { Module } from '@nestjs/common';

import { LogbookAuthController } from './logbook-auth.controller';
import { LogbookAccountsController } from './logbook-accounts.controller';
import { LogbookFishermanProfilesController } from './logbook-fisherman-profiles.controller';
import { LogbookAccountIdentifiersController } from './logbook-account-identifiers.controller';

@Module({
  imports: [],
  controllers: [
    LogbookAuthController,
    LogbookAccountsController,
    LogbookFishermanProfilesController,
    LogbookAccountIdentifiersController,
  ],
  providers: [],
})
export class LogbookIdentityModule {}
