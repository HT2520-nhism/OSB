import { PartialType } from '@nestjs/mapped-types';
import { CreateCatchRecordDto } from './create-catch-record.dto';

export class UpdateCatchRecordDto extends PartialType(CreateCatchRecordDto) {}
