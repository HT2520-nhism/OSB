/**
 * PHASE 8 — Add owner_id to incidents for user-scoped visibility.
 *
 * This enables direct owner-based filtering for incidents.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncidentOwnerId1789530919173 implements MigrationInterface {
  name = 'AddIncidentOwnerId1789530919173';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE incidents
        ADD COLUMN IF NOT EXISTS owner_id uuid NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_owner_id
        ON incidents (owner_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_incidents_owner_id;
      ALTER TABLE incidents DROP COLUMN IF EXISTS owner_id;
    `);
  }
}
