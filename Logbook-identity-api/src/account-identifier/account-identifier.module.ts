import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountIdentifierEntity } from './account-identifier.entity';
import { AccountEntity } from '../account/account.entity';
import { AccountIdentifierService } from './account-identifier.service';
import { IdentifierNormalizer } from './identifier-normalizer.service';
import { AccountIdentifierController } from './account-identifier.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountIdentifierEntity, AccountEntity])],
  controllers: [AccountIdentifierController],
  providers: [AccountIdentifierService, IdentifierNormalizer],
  exports: [AccountIdentifierService, IdentifierNormalizer],
})
export class AccountIdentifierModule {}
