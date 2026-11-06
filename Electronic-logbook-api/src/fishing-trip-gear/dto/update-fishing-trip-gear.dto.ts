import { PartialType } from '@nestjs/mapped-types';
import { CreateFishingTripGearDto } from './create-fishing-trip-gear.dto';

export class UpdateFishingTripGearDto extends PartialType(
  CreateFishingTripGearDto,
) {}
