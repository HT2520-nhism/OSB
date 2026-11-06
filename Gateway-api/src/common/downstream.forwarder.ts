/**
 * Reusable HTTP helpers for downstream service passthrough controllers.
 *
 * All controllers follow the same pattern:
 *  - inject the Authorization header from the inbound request
 *  - forward to `${serviceUrl}/api/<resource>` using superagent
 *  - pipe the response (status + JSON body) back to the client
 *  - convert upstream errors via convertSuperAgentErrorToResponse
 *
 * Centralising the boring parts keeps each controller small and focused on
 * its Swagger annotations.
 *
 * superagent v8 type signatures are strict and per-method (no dynamic
 * `superagent(method, url)` overload), so we use a small dispatch table
 * keyed by HTTP verb.
 */

import * as superagent from 'superagent';

import { convertSuperAgentErrorToResponse } from '../helpers';

type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

export interface ForwardRequestOptions {
  /** Incoming request method (GET, POST, ...) */
  method: HttpMethod;
  /** Base URL of the downstream service (e.g. config.ELECTRONIC_LOGBOOK_API_URL) */
  baseUrl: string;
  /** Downstream resource path without leading slash (e.g. 'vessels' or 'sync/devices') */
  path: string;
  /** Outgoing `Authorization` header (already prefixed with 'Bearer ') */
  authorization?: string | null;
  /** JSON body for POST/PATCH/PUT */
  body?: unknown;
  /** Query string for GET — anything superagent.query() accepts */
  query?: object;
  /** Forwarded response object */
  res: any;
}

/**
 * Forwards the request to a downstream service and writes the response back.
 * Any failure is converted to a structured JSON error via
 * convertSuperAgentErrorToResponse.
 */
export async function forwardToDownstream(
  opts: ForwardRequestOptions,
): Promise<any> {
  const url = `${opts.baseUrl}/api/${opts.path}`;
  try {
    let request: superagent.SuperAgentRequest;

    switch (opts.method) {
      case 'get':
        request = superagent.get(url);
        break;
      case 'post':
        request = superagent.post(url);
        break;
      case 'patch':
        request = superagent.patch(url);
        break;
      case 'put':
        request = superagent.put(url);
        break;
      case 'delete':
        request = superagent.del(url);
        break;
    }

    request.set('Authorization', opts.authorization || '');

    if (opts.query) {
      // Cast — superagent accepts a plain object whose values may be primitives
      request.query(opts.query as any);
    }
    if (opts.body !== undefined && opts.body !== null) {
      request.send(opts.body as any);
    }

    const { body, status } = await request;
    return opts.res.status(status).json(body);
  } catch (err) {
    return convertSuperAgentErrorToResponse(opts.res, err);
  }
}
