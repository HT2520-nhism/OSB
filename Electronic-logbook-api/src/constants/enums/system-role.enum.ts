/**
 * PHASE 8 — System Roles for Electronic Logbook (shared constants).
 *
 * This enum mirrors logbook-identity-api's SystemRole enum.
 * Downstream services (electronic-logbook-api) use these values
 * for authorization decisions without needing to query the identity database.
 *
 * The canonical enum lives in logbook-identity-api and is embedded
 * in the JWT payload. This copy is for type safety in downstream services.
 *
 * IMPORTANT: Only the string values are used at runtime.
 * The enum definition here is for compile-time type checking.
 */
export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  USER = 'user',
}
