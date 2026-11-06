/**
 * PHASE 8 — Downstream proxy factory.
 *
 * Builds `http-proxy-middleware` instances (v3 API) for each downstream
 * service with:
 *  - streaming body (no buffering of multipart files)
 *  - configurable timeouts
 *  - x-request-id propagation from the inbound CorrelationIdMiddleware
 *  - on.proxyReq: re-attaches body for non-streaming verbs so POST/PATCH work
 *  - on.proxyRes: logs the response with target service + status
 *  - on.error: returns a structured 502 (Bad Gateway) — never leaks the
 *    downstream URL or stack trace to clients
 *
 * The Gateway NEVER makes business decisions — it only forwards bytes and
 * context. Authentication is delegated to the downstream service.
 */

import { Injectable, Logger } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request, Response } from 'express';
import type { ClientRequest, IncomingMessage } from 'http';
import type { Filter } from 'http-proxy-middleware/dist/types';

import { REQUEST_ID_HEADER } from '../middleware/correlation-id.middleware';

export interface ProxyOptions {
  target: string;
  /** Maximum time (ms) waiting for the downstream to accept the request. */
  timeoutMs?: number;
  /** Maximum time (ms) waiting for the downstream to start responding. */
  proxyTimeoutMs?: number;
  /** Path rewrite — applied AFTER the proxied prefix matches. */
  pathRewrite?: Record<string, string>;
  /**
   * Predicate (or string / string[] shorthand) selecting which requests
   * to forward. Without an explicit filter, the proxy matches every path
   * and would steal traffic from other middlewares — always set this.
   */
  pathFilter?: Filter<IncomingMessage>;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger('ProxyService');

  create(options: ProxyOptions) {
    const {
      target,
      timeoutMs = 30_000,
      proxyTimeoutMs = 120_000,
      pathRewrite,
      pathFilter,
    } = options;

    return createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      timeout: timeoutMs,
      proxyTimeout: proxyTimeoutMs,
      selfHandleResponse: false,
      xfwd: true,
      preserveHeaderKeyCase: true,
      pathFilter,
      pathRewrite,
      on: {
        // v3 API: callbacks live under `on.<eventName>` instead of
        // top-level `onProxyReq`/`onProxyRes`/`onError`.
        proxyReq: (proxyReq: ClientRequest, req: Request) => {
          const reqWithBody = req as Request & {
            body?: unknown;
            requestId?: string;
          };

          // Forward the correlation ID to the downstream service.
          const requestId = reqWithBody.requestId;
          if (requestId) {
            proxyReq.setHeader(REQUEST_ID_HEADER, requestId);
          }

          // If a JSON body was already parsed by Nest and the underlying
          // transport is not streaming, re-serialize it back into the stream.
          const contentType = proxyReq.getHeader('Content-Type') as
            | string
            | undefined;
          const hasParsedBody =
            reqWithBody.body !== undefined && reqWithBody.body !== null;
          const isMultipart = contentType?.startsWith('multipart/');
          const isUrlEncoded = contentType?.startsWith(
            'application/x-www-form-urlencoded',
          );

          if (hasParsedBody && !isMultipart && !isUrlEncoded) {
            const bodyData = JSON.stringify(reqWithBody.body);
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }

          this.logger.log({
            event: 'gateway.proxy.req',
            method: req.method,
            path: req.originalUrl,
            target,
            requestId,
          });
        },
        proxyRes: (proxyRes: IncomingMessage, req: Request, res: Response) => {
          const reqWithId = req as Request & { requestId?: string };
          this.logger.log({
            event: 'gateway.proxy.res',
            method: req.method,
            path: req.originalUrl,
            target,
            status: proxyRes.statusCode,
            requestId: reqWithId.requestId,
          });
          // Propagate the request ID back to the client as well.
          if (reqWithId.requestId) {
            res.setHeader(REQUEST_ID_HEADER, reqWithId.requestId);
          }
        },
        error: (err: Error, req: Request, res: Response, target?: unknown) => {
          const reqWithId = req as Request & { requestId?: string };
          let targetStr = 'unknown';
          if (typeof target === 'string') {
            targetStr = target;
          } else if (target && typeof target === 'object') {
            const t = target as { host?: string | null; port?: number | null };
            if (t.host) targetStr = `${t.host}:${t.port ?? ''}`;
          }
          this.logger.error({
            event: 'gateway.proxy.error',
            method: req.method,
            path: req.originalUrl,
            target: targetStr,
            error: err.message,
            requestId: reqWithId.requestId,
          });
          if (!res.headersSent) {
            res.status(502).json({
              code: 502,
              message: 'Bad Gateway: downstream service unreachable',
              requestId: reqWithId.requestId,
            });
          }
        },
      },
    });
  }
}
