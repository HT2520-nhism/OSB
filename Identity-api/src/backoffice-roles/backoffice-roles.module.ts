import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BackofficeRolesController } from './backoffice-roles.controller';
import { BackofficeRolesService } from './backoffice-roles.service';
import { BackofficeRoleEntity } from './backoffice-role.entity';
import { DepartmentEntity } from '../departments/department.entity';
import { UserEntity } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BackofficeRoleEntity,
      DepartmentEntity,
      UserEntity,
    ]),
  ],
  controllers: [BackofficeRolesController],
  providers: [BackofficeRolesService],
})
export class BackofficeRolesModule {}
