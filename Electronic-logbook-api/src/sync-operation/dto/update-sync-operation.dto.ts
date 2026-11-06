import { PartialType } from '@nestjs/mapped-types';
import { CreateSyncOperationDto } from './create-sync-operation.dto';

export class UpdateSyncOperationDto extends PartialType(
  CreateSyncOperationDto,
) {}
