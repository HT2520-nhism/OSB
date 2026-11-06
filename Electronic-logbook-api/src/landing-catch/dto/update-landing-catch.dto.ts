import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingCatchDto } from './create-landing-catch.dto';

export class UpdateLandingCatchDto extends PartialType(CreateLandingCatchDto) {}
