import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { LoggerMiddleware } from './services/logger.service';
import { HealthModule } from './health/health.module';
import DatabaseModule from './database.module';
import { FishermanProfileModule } from './fisherman-profile/fisherman-profile.module';
import { AccountModule } from './account/account.module';
import { AccountIdentifierModule } from './account-identifier/account-identifier.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    FishermanProfileModule,
    AccountModule,
    AccountIdentifierModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).exclude('/docs').forRoutes('/');
  }
}
