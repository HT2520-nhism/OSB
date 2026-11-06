import { PartialType } from '@nestjs/mapped-types';
import { CreateSyncConflictDto } from './create-sync-conflict.dto';

export class UpdateSyncConflictDto extends PartialType(CreateSyncConflictDto) {}
