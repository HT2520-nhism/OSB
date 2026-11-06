/**
 * PHASE 8 — Correlation ID Middleware.
 *
 * Ensures every inbound request carries a stable `X-Request-Id`:
 *  - If the client supplies one, it is preserved.
 *  - Otherwise a new UUIDv4 is generated.
 *
 * The ID is attached to `req.requestId` and re-emitted on the response
 * header so downstream services can stitch logs across the mesh.
 *
 * Usage:
 *   app.use(CorrelationIdMiddleware);   // BEFORE all proxies
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const requestId =
      typeof incoming === 'string' && incoming.length > 0
        ? incoming
        : crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
  }
}
