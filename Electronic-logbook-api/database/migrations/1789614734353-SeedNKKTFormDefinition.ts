/**
 * Seed FormDefinition for NKKT (Nhật ký khai thác thủy sản - Thông tư 01/2022/TT-BNNPTNT).
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedNKKTFormDefinition1789614734353
  implements MigrationInterface
{
  name = 'SeedNKKTFormDefinition1789614734353';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO form_definitions (
        id, form_code, name, description, version, form_type,
        is_active, effective_from, effective_to, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'NKKT',
        'Nhật ký khai thác thủy sản',
        'Mẫu số 01 - Theo Thông tư 01/2022/TT-BNNPTNT',
        '1.0',
        'REGULATORY',
        true,
        '2022-03-04T00:00:00Z',
        '2099-12-31T23:59:59Z',
        now(),
        now()
      )
      ON CONFLICT (form_code) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM form_definitions
      WHERE form_code = 'NKKT';
    `);
  }
}

