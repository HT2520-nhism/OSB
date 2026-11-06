import { PartialType } from '@nestjs/mapped-types';
import { CreateFormWorkflowHistoryDto } from './create-form-workflow-history.dto';

export class UpdateFormWorkflowHistoryDto extends PartialType(
  CreateFormWorkflowHistoryDto,
) {}
