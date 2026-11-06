/**
 * PHASE 7 — Add operational columns to outbox_events.
 *
 * Adds:
 *  - correlation_id  (uuid nullable)
 *  - causation_id    (uuid nullable)
 *  - event_version   (integer default 1)
 *  - last_error      (text nullable)
 *  - last_error_at   (timestamptz nullable)
 *  - claimed_by      (varchar(255) nullable)
 *  - claimed_at      (timestamptz nullable)
 *  - updated_at      (timestamptz default now() not null)
 *
 * Adds index on (status, available_at, created_at) for the worker polling path.
 *
 * Reversible.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboxEventsPhase7Columns1789357756615 implements MigrationInterface {
  name = 'OutboxEventsPhase7Columns1789357756615';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE outbox_events
        ADD COLUMN IF NOT EXISTS correlation_id uuid NULL,
        ADD COLUMN IF NOT EXISTS causation_id   uuid NULL,
        ADD COLUMN IF NOT EXISTS event_version  integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS last_error     text NULL,
        ADD COLUMN IF NOT EXISTS last_error_at  timestamptz NULL,
        ADD COLUMN IF NOT EXISTS claimed_by     varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS claimed_at     timestamptz NULL,
        ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_poll
        ON outbox_events (status, available_at, created_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_aggregate
        ON outbox_events (aggregate_type, aggregate_id, created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_outbox_aggregate;
      DROP INDEX IF EXISTS idx_outbox_poll;
      ALTER TABLE outbox_events
        DROP COLUMN IF EXISTS updated_at,
        DROP COLUMN IF EXISTS claimed_at,
        DROP COLUMN IF EXISTS claimed_by,
        DROP COLUMN IF EXISTS last_error_at,
        DROP COLUMN IF EXISTS last_error,
        DROP COLUMN IF EXISTS event_version,
        DROP COLUMN IF EXISTS causation_id,
        DROP COLUMN IF EXISTS correlation_id;
    `);
  }
}
