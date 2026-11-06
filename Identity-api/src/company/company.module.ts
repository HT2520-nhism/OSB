import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyEntity } from './company.entity';
import { DepartmentEntity } from '../departments/department.entity';
import { UserEntity } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyEntity, DepartmentEntity, UserEntity]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
