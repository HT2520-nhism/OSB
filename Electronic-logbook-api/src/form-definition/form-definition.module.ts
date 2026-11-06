import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormDefinition } from './form-definition.entity';
import { FormDefinitionController } from './form-definition.controller';
import { FormDefinitionService } from './form-definition.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormDefinition])],
  controllers: [FormDefinitionController],
  providers: [FormDefinitionService],
  exports: [FormDefinitionService],
})
export class FormDefinitionModule {}
