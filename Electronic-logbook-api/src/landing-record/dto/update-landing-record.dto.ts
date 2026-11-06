import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingRecordDto } from './create-landing-record.dto';

export class UpdateLandingRecordDto extends PartialType(
  CreateLandingRecordDto,
) {}
