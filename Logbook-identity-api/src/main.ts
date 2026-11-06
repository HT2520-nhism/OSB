/* istanbul ignore file */
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { Logger } from './services/logger.service';
import { config } from './config';
import GlobalValidationPipe from './infrastructure/validation/validation-pipe';

const logger = new Logger();

/* istanbul ignore next */
process.on('uncaughtException', (err) => {
  logger.error(err, err.stack, 'uncaughtException');
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors();

  app.set('json escape', true);
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'docs', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(GlobalValidationPipe());

  const docConfig = new DocumentBuilder()
    .setTitle('Logbook Identity API Documentation')
    .setDescription('Play with the API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http' }, 'user')
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(config.PORT);
}
bootstrap();
