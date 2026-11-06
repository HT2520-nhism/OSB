import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDeviceDto } from './create-client-device.dto';

export class UpdateClientDeviceDto extends PartialType(CreateClientDeviceDto) {}
