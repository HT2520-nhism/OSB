import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountEntity } from './account.entity';
import { AccountIdentifierEntity } from '../account-identifier/account-identifier.entity';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AccountIdentifierModule } from '../account-identifier/account-identifier.module';
import { FishermanProfileModule } from '../fisherman-profile/fisherman-profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountEntity, AccountIdentifierEntity]),
    AccountIdentifierModule,
    FishermanProfileModule,
  ],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
