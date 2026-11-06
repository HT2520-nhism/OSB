/**
 * PHASE 8 — Document Service module.
 *
 * Registers the DocumentController under /api/documents/* so the Document
 * API surface appears in Swagger and routes through the gateway's standard
 * superagent-based passthrough pattern.
 */

import { Module } from '@nestjs/common';

import { DocumentController } from './document.controller';

@Module({
  controllers: [DocumentController],
})
export class DocumentModule {}
