/**
 * PHASE 8 — Proxy Module.
 *
 * Registers the ProxyService factory so the bootstrap layer can pull
 * pre-configured `http-proxy-middleware` instances from the DI container.
 *
 * Why a module:
 *  - The factory holds cross-cutting concerns (correlation-id propagation,
 *    body re-streaming, timeouts, structured 502 fallback) and is
 *    `@Injectable()`.
 *  - Keeping it in DI lets tests swap in a stub without re-implementing
 *    the middleware stack.
 *
 * Routes wired in main.ts:
 *  - /api/electronic-logbook/* → ELECTRONIC_LOGBOOK_API_URL
 *  - /api/documents/*          → DOCUMENT_API_URL  (Phase 8)
 *  - /uploads                  → CONSTRUCTION_LOG_API_URL (legacy)
 */

import { Module } from '@nestjs/common';

import { ProxyService } from './proxy.service';

@Module({
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
