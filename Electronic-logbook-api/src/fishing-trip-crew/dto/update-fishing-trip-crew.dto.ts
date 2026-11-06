import { PartialType } from '@nestjs/mapped-types';
import { CreateFishingTripCrewDto } from './create-fishing-trip-crew.dto';

export class UpdateFishingTripCrewDto extends PartialType(
  CreateFishingTripCrewDto,
) {}
