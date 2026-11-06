import { PartialType } from '@nestjs/mapped-types';
import { CreateFormDefinitionDto } from './create-form-definition.dto';

export class UpdateFormDefinitionDto extends PartialType(
  CreateFormDefinitionDto,
) {}
