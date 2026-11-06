import { PartialType } from '@nestjs/mapped-types';
import { CreateVesselOwnerDto } from './create-vessel-owner.dto';

export class UpdateVesselOwnerDto extends PartialType(CreateVesselOwnerDto) {}
