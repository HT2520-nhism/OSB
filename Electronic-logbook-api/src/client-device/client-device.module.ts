import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClientDevice } from './client-device.entity';
import { ClientDeviceController } from './client-device.controller';
import { ClientDeviceService } from './client-device.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClientDevice])],
  controllers: [ClientDeviceController],
  providers: [ClientDeviceService],
  exports: [ClientDeviceService],
})
export class ClientDeviceModule {}
