# Gateway Authorization Model

## Key Principles

The gateway-api is a **transport-layer proxy**. It must NOT make business
authorization decisions. The gateway's responsibilities are limited to:

1. **Forward** the `Authorization` header verbatim to downstream services.
2. **Preserve** the `x-request-id` (correlation ID) for distributed tracing.
3. **Reject** invalid upstream requests (e.g. malformed paths) WITHOUT
   leaking downstream URL information to the client.
4. **Map** HTTP status codes correctly:
   - 401 from downstream → 401 to client
   - 403 from downstream → 403 to client
   - 502 only when downstream is unreachable

## What the Gateway NEVER Does

- Does **not** evaluate JWT (token validation is downstream's responsibility).
- Does **not** check vessel ownership, system role, or vessel membership.
- Does **not** trust `systemRole`, `role`, or `vesselId` fields from
  request bodies.
- Does **not** implement any business authorization logic.

## Source of Truth

The source of truth for authorization is the **downstream service** that
owns the resource:

- `logbook-identity-api` → `systemRole`, JWT validation
- `electronic-logbook-api` → vessel ownership, vessel membership, action authorization

If a downstream service returns 403, the gateway forwards 403 without
modification. If a frontend receives a 403, it must check the downstream
service's authorization rules — not assume the gateway "knows" the answer.

## Audit Logging

The gateway does log:
- Request: `event=gateway.proxy.req` with `method`, `path`, `target`, `requestId`
- Response: `event=gateway.proxy.res` with `status` and `requestId`
- Error: `event=gateway.proxy.error` with `error.message` and `requestId`

It does **not** log:
- Authorization header (contains JWT)
- Request body (may contain sensitive data)
- Query parameters (may contain PII)

Sensitive operations (system role changes, vessel membership changes, etc.)
are logged in their respective downstream services, not at the gateway.

## Enforcement Pattern

```
Client
  │
  │ Authorization: Bearer <jwt>
  ▼
Gateway (forward Authorization header, preserve x-request-id)
  │
  │ Authorization: Bearer <jwt>
  ▼
Downstream Service (validate JWT, evaluate systemRole + vessel membership + resource authorization)
  │
  │ 200 / 403 / 404
  ▼
Client
```

This means:
- A SUPER_ADMIN authentication token can only be elevated by the identity service.
- Vessel membership is always verified by electronic-logbook-api against its own database.
- The gateway has zero authority to grant access.
