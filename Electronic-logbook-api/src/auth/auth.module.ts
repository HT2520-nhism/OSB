/**
 * PHASE 8 — Auth Module.
 *
 * Centralizes the cross-cutting authorization dependencies (AuthorizationService)
 * so feature modules can import it instead of re-declaring the service and all of
 * its repositories. This avoids `Nest can't resolve dependencies of the
 * AuthorizationService (... ?)` errors caused by repositories that are not
 * registered in the feature module's `TypeOrmModule.forFeature`.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthorizationService } from './authorization.service';

import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vessel,
      VesselOwner,
      VesselCrew,
      FishingTripCrew,
    ]),
  ],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthModule {}
