/**
 * System-level roles for Electronic Logbook.
 *
 * These are global, administrative roles that control access to
 * system-wide operations — completely separate from AccountType (business
 * classification) and VesselMembershipRole (per-vessel access).
 *
 * These roles are stored on the Account record in logbook-identity-api
 * and embedded in the JWT payload so downstream services can enforce
 * them without querying the identity database.
 *
 * IMPORTANT: Authorization must NEVER be hard-coded by email or other
 * identifying fields. Only the role value (or accountId) should be used
 * in runtime authorization checks.
 *
 * Migration for phamduccuong0123@gmail.com -> SUPER_ADMIN:
 *   See database/migrations/XXXXXXXXXXXX-AddSystemRole.ts
 */
export enum SystemRole {
  /**
   * Full system access — all vessels, all accounts, all operations.
   * Use sparingly; most operations should go through OPERATOR or ADMIN.
   */
  SUPER_ADMIN = 'super_admin',

  /**
   * Business-level administration within a defined scope.
   * Can manage vessels, crew, and fishing operations.
   */
  ADMIN = 'admin',

  /**
   * Operational access to perform business tasks.
   * Can create fishing trips, log catches, etc.
   */
  OPERATOR = 'operator',

  /**
   * Default role — no administrative privileges.
   * Access is limited to vessels the user is a member of.
   */
  USER = 'user',
}
