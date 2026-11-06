/**
 * PHASE 8 — Authorization: Add system_role column to account.
 *
 * This migration:
 *  1. Creates the system_role_enum PostgreSQL enum type.
 *  2. Adds the system_role column with default = 'user'.
 *  3. Seeds the target SUPER_ADMIN account (phamduccuong0123@gmail.com)
 *     by updating their existing account record.
 *  4. Is IDEMPOTENT — running it twice has no additional effect.
 *
 * The seed step (step 3) uses a subquery to find the account by email
 * so we don't need to hard-code the account UUID here.
 *
 * IMPORTANT: After this migration, runtime authorization MUST NOT check
 * by email. The email is ONLY used as the migration seed key.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemRole1793333058891 implements MigrationInterface {
  name = 'AddSystemRole1793333058891';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Create the enum type ─────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."system_role_enum" AS ENUM(
          'super_admin',
          'admin',
          'operator',
          'user'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ── 2. Add the column ─────────────────────────────────────────────────
    // Using DROP DEFAULT first avoids the "cannot use column default in
    // ALTER COLUMN" error if the column somehow already exists.
    await queryRunner.query(`
      ALTER TABLE "account"
      ADD COLUMN IF NOT EXISTS "system_role"
        "public"."system_role_enum"
        NOT NULL
        DEFAULT 'user'
    `);

    // ── 3. Seed SUPER_ADMIN for target email ───────────────────────────────
    // This is idempotent — the UPDATE affects 0 or 1 row.
    // We look up by email through the account_identifier join.
    await queryRunner.query(`
      UPDATE "account" AS a
      SET "system_role" = 'super_admin'
      FROM "account_identifier" AS ai
      WHERE ai."account_id" = a.id
        AND ai."type" = 'EMAIL'
        AND ai."normalized_value" = 'phamduccuong0123@gmail.com'
        AND a."system_role" != 'super_admin'
    `);

    // ── 4. Index ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_account_system_role"
        ON "account" ("system_role")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."IDX_account_system_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "account" DROP COLUMN IF EXISTS "system_role"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."system_role_enum"
    `);
  }
}
