import { PartialType } from '@nestjs/mapped-types';
import { CreateOutboxEventDto } from './create-outbox-event.dto';

export class UpdateOutboxEventDto extends PartialType(CreateOutboxEventDto) {}
