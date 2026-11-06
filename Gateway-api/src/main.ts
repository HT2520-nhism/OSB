/* istanbul ignore file */
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cors from 'cors';

import { AppModule } from './app.module';
import { config } from './config';
import { ProxyService } from './proxy/proxy.service';

import { UploadDocumentDto, QueryDocumentDto } from './document/dto';
import * as ElbDto from './electronic-logbook/dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cors());

  // Pull the proxy factory out of the DI container so we can still expose
  // stream-friendly proxies for endpoints where superagent buffering is
  // undesirable (e.g. large file uploads). All JSON/REST routes for the
  // document and electronic-logbook services are now mounted via explicit
  // Nest controllers (DocumentModule / ElectronicLogbookModule) so they
  // appear in Swagger — see src/document/* and src/electronic-logbook/*.
  const proxy = app.get(ProxyService);

  /**
   * Legacy file uploads proxy — construction-log-api served /uploads
   * long before we adopted explicit upload controllers. Kept for
   * backwards compatibility with existing asset URLs in the system.
   */
  app.use(
    proxy.create({
      target: config.CONSTRUCTION_LOG_API_URL,
      timeoutMs: 30_000,
      proxyTimeoutMs: 120_000,
      pathFilter: (pathname: string) => pathname.startsWith('/uploads'),
      pathRewrite: { '^/uploads': '/uploads' },
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'docs', method: RequestMethod.GET }],
  });

  // Build list of ALL passthrough DTOs. We force-register every model
  // explicitly so Swagger includes every request body and query schema in
  // `components.schemas`, even if some controllers forward types loosely
  // (e.g. `@Query() query: Record<string, unknown>`).
  const extraModels: Function[] = [UploadDocumentDto, QueryDocumentDto];
  // Pull every class-exported DTO from the eLogbook barrel.
  for (const [key, value] of Object.entries(ElbDto)) {
    if (typeof value === 'function' && !extraModels.includes(value)) {
      extraModels.push(value as Function);
    }
  }

  const docConfig = new DocumentBuilder()
    .setTitle('Gateway API Documentation')
    .setDescription('Play with the API')
    .setVersion('1.0')
    // Two distinct JWT audiences live behind this gateway:
    //   - 'user'         → token minted by Identity-api
    //                     (used by construction-log / customer / asset / site /
    //                      notification / email / identity / document services)
    //   - 'logbook-user' → token minted by logboook-identity-api
    //                     (used by electronic-logbook-api AND any document
    //                      uploaded by eLogbook users)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Identity-api JWT (construction-log, customer, asset, site, notification, email, identity, document)',
      },
      'user',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Logboook-identity-api JWT (electronic-logbook-api + logbook-issued documents)',
      },
      'logbook-user',
    )
    .build();

  const document = SwaggerModule.createDocument(app, docConfig, {
    extraModels,
  });
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(config.PORT, '0.0.0.0');
}
bootstrap();
