import { PartialType } from '@nestjs/mapped-types';
import { CreateFishingGearDto } from './create-fishing-gear.dto';

export class UpdateFishingGearDto extends PartialType(CreateFishingGearDto) {}
