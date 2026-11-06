import { PartialType } from '@nestjs/mapped-types';
import { CreatePortCallDto } from './create-port-call.dto';

export class UpdatePortCallDto extends PartialType(CreatePortCallDto) {}
