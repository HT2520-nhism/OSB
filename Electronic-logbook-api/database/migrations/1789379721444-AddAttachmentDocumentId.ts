/**
 * PHASE 8 — Add document_id logical reference to attachments.
 *
 * This is a logical reference only — no FK to the Document Service DB.
 * New attachments should be created via the Document Service; legacy
 * attachments keep their existing metadata and gain an optional document_id.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttachmentDocumentId1789379721444 implements MigrationInterface {
  name = 'AddAttachmentDocumentId1789379721444';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE attachments
        ADD COLUMN IF NOT EXISTS document_id uuid NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_attachments_document_id
        ON attachments (document_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_attachments_document_id;
      ALTER TABLE attachments DROP COLUMN IF EXISTS document_id;
    `);
  }
}
