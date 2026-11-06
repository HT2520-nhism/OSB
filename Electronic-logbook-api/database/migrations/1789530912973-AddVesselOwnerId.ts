/**
 * PHASE 8 — Add owner_id to vessels for user-scoped visibility.
 *
 * This enables:
 * 1. User-scoped filtering on GET /vessels
 * 2. Ownership-based authorization
 * 3. Personalization - users only see their own vessels
 *
 * owner_id is denormalized for fast filtering. The relationship
 * to users is managed through vessel_owners table separately.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVesselOwnerId1789530912973 implements MigrationInterface {
  name = 'AddVesselOwnerId1789530912973';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vessels
        ADD COLUMN IF NOT EXISTS owner_id uuid NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vessels_owner_id
        ON vessels (owner_id);
    `);

    // Update existing vessels to set owner_id from vessel_owners if exists
    await queryRunner.query(`
      UPDATE vessels v
      SET owner_id = vo.user_id
      FROM vessel_owners vo
      WHERE v.id = vo.vessel_id
        AND vo.is_current = true
        AND v.owner_id IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_vessels_owner_id;
      ALTER TABLE vessels DROP COLUMN IF EXISTS owner_id;
    `);
  }
}
