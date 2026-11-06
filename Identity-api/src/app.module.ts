import { MiddlewareConsumer, Module } from '@nestjs/common';

import DatabaseModule from './database.module';
import { LoggerMiddleware } from './services/logger.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { BackofficeRolesModule } from './backoffice-roles/backoffice-roles.module';
import { CompanyModule } from './company/company.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    BackofficeRolesModule,
    DepartmentsModule,
    CompanyModule,
  ],

  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).exclude('/docs').forRoutes('/');
  }
}
