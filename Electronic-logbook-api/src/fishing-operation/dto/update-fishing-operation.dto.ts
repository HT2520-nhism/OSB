import { PartialType } from '@nestjs/mapped-types';
import { CreateFishingOperationDto } from './create-fishing-operation.dto';

export class UpdateFishingOperationDto extends PartialType(
  CreateFishingOperationDto,
) {}
