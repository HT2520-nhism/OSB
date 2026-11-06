import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { IdentityModule } from './identity/identity.module';
import { ConstructionLogModule } from './construction-log/construction.module';
import { CustomersModule } from './customers/customers.module';
import { SitesModule } from './sites/sites.module';
import { SiteContactsModule } from './site-contacts/site-contacts.module';
import { AssetModule } from './asset/asset.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';
import { LogbookIdentityModule } from './logbook-identity/logbook-identity.module';
import { ProxyModule } from './proxy/proxy.module';
import { DocumentModule } from './document/document.module';
import { ElectronicLogbookModule } from './electronic-logbook/electronic-logbook.module';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Module({
  imports: [
    IdentityModule,
    ConstructionLogModule,
    CustomersModule,
    SitesModule,
    SiteContactsModule,
    AssetModule,
    NotificationsModule,
    EmailModule,
    LogbookIdentityModule,
    DocumentModule,
    ElectronicLogbookModule,
    ProxyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  /**
   * Apply the correlation-id middleware at the root so EVERY controller in
   * this gateway (and any controller added later) can read or generate an
   * `x-request-id`. Registered here via NestModule.configure() so it runs
   * before any controller handler.
   *
   * Note: the proxy middlewares in main.ts also run this middleware
   * explicitly because they are registered BEFORE the Nest router.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
