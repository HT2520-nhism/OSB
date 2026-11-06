import { PartialType } from '@nestjs/mapped-types';
import { CreateVesselCrewDto } from './create-vessel-crew.dto';

export class UpdateVesselCrewDto extends PartialType(CreateVesselCrewDto) {}
