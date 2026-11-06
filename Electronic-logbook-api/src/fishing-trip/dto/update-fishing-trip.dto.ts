import { PartialType } from '@nestjs/mapped-types';
import { CreateFishingTripDto } from './create-fishing-trip.dto';

export class UpdateFishingTripDto extends PartialType(CreateFishingTripDto) {}
