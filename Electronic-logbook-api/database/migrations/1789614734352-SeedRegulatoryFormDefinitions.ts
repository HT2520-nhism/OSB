/**
 * Seed FormDefinitions for regulatory forms (M01, M02, M03).
 *
 * Background:
 *   The RegulatoryFormsService requires an active FormDefinition row whose
 *   `form_code` matches the enum value (M01, M02, M03) before it can create
 *   a FormSubmission. Without a seed, hitting `POST /forms/m03` (or m01/m02)
 *   returns 404 "Active FormDefinition for code M03 not found".
 *
 * This migration inserts the three baseline definitions (idempotent — uses
 * ON CONFLICT) so the regulatory flows work out of the box on a fresh DB.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRegulatoryFormDefinitions1789614734352
  implements MigrationInterface
{
  name = 'SeedRegulatoryFormDefinitions1789614734352';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // M01 — Giấy biên nhận sản phẩm thủy sản bốc dỡ
    await queryRunner.query(`
      INSERT INTO form_definitions (
        id, form_code, name, description, version, form_type,
        is_active, effective_from, effective_to, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'M01',
        'Giấy biên nhận sản phẩm thủy sản bốc dỡ',
        'Mẫu 01 - Theo Thông tư 31/2025/TT-BNNPTNT',
        '1.0',
        'REGULATORY',
        true,
        '2025-01-01T00:00:00Z',
        '2025-12-31T23:59:59Z',
        now(),
        now()
      )
      ON CONFLICT (form_code) DO NOTHING;
    `);

    // M02 — Biên bản kiểm tra tàu cá cập cảng
    await queryRunner.query(`
      INSERT INTO form_definitions (
        id, form_code, name, description, version, form_type,
        is_active, effective_from, effective_to, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'M02',
        'Biên bản kiểm tra tàu cá cập cảng',
        'Mẫu 02 - Theo Thông tư 31/2025/TT-BNNPTNT',
        '1.0',
        'REGULATORY',
        true,
        '2025-01-01T00:00:00Z',
        '2025-12-31T23:59:59Z',
        now(),
        now()
      )
      ON CONFLICT (form_code) DO NOTHING;
    `);

    // M03 — Biên bản kiểm tra tàu cá rời cảng
    await queryRunner.query(`
      INSERT INTO form_definitions (
        id, form_code, name, description, version, form_type,
        is_active, effective_from, effective_to, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'M03',
        'Biên bản kiểm tra tàu cá rời cảng',
        'Mẫu 03 - Theo Thông tư 31/2025/TT-BNNPTNT',
        '1.0',
        'REGULATORY',
        true,
        '2025-01-01T00:00:00Z',
        '2025-12-31T23:59:59Z',
        now(),
        now()
      )
      ON CONFLICT (form_code) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM form_definitions
      WHERE form_code IN ('M01', 'M02', 'M03');
    `);
  }
}
