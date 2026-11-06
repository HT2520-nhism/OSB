import { Module } from '@nestjs/common';

import { BackofficeRolesController } from './backoffice-roles/backoffice-roles.controller';
import { DepartmentsController } from './departments/departments.controller';
import { IdentityController } from './identity.controller';
import { CompanyController } from './company/companies.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [],
  controllers: [
    IdentityController,
    UsersController,
    BackofficeRolesController,
    DepartmentsController,
    CompanyController,
  ],
  providers: [],
})
export class IdentityModule {}
