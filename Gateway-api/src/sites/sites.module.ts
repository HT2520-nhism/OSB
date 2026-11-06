import { Module } from '@nestjs/common';

import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  imports: [],
  controllers: [SitesController],
  providers: [SitesService],
})
export class SitesModule {}
