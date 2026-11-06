/**
 * PHASE 8 — Document Service Client Module.
 *
 * Wires the Document Service HTTP client with the Gateway base URL.
 */

import { Module } from '@nestjs/common';

import { DocumentServiceClient } from './document-service.client';
import { config } from '../config';

@Module({
  providers: [
    {
      provide: DocumentServiceClient,
      useFactory: () => new DocumentServiceClient(config.GATEWAY_URL),
    },
  ],
  exports: [DocumentServiceClient],
})
export class DocumentClientModule {}
