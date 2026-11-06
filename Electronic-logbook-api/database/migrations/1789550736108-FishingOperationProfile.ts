/**
 * PHASE 8 — Fishing Operation Profile Migration.
 *
 * Creates:
 *  1. Sequence: fisherman_code_seq (for concurrent-safe ID generation)
 *  2. Table: fishing_operation_profiles
 *  3. Indexes: fisherman_code, user_id, status
 *  4. Unique constraints: user_id, fisherman_code
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FishingOperationProfile1789550736108 implements MigrationInterface {
  name = 'FishingOperationProfile1789550736108';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create sequence for fisherman code generation
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS fisherman_code_seq
        START 1
        INCREMENT 1
        MINVALUE 1
        MAXVALUE 9999999
        CACHE 1;
    `);

    // 2. Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fishing_operation_profiles (
        id            uuid              NOT NULL DEFAULT uuid_generate_v4(),
        user_id       uuid              NOT NULL,
        fisherman_code varchar(30)       NOT NULL,
        status        varchar(30)       NOT NULL DEFAULT 'ACTIVE',
        created_at    timestamptz       NOT NULL DEFAULT NOW(),
        updated_at    timestamptz       NOT NULL DEFAULT NOW(),

        CONSTRAINT pk_fishing_operation_profiles PRIMARY KEY (id),
        CONSTRAINT uq_fishing_operation_profiles_user_id UNIQUE (user_id),
        CONSTRAINT uq_fishing_operation_profiles_fisherman_code UNIQUE (fisherman_code)
      );
    `);

    // 3. Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_fishing_operation_profiles_fisherman_code
        ON fishing_operation_profiles (fisherman_code);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_fishing_operation_profiles_user_id
        ON fishing_operation_profiles (user_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_fishing_operation_profiles_status
        ON fishing_operation_profiles (status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS fishing_operation_profiles;`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS fisherman_code_seq;`);
  }
}
