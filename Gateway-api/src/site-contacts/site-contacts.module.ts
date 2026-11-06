import { Module } from '@nestjs/common';

import { SiteContactsController } from './site-contacts.controller';
import { SiteContactsService } from './site-contacts.service';

@Module({
  imports: [],
  controllers: [SiteContactsController],
  providers: [SiteContactsService],
})
export class SiteContactsModule {}
