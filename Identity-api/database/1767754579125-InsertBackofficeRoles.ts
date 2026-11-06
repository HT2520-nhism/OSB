import { MigrationInterface, QueryRunner } from 'typeorm';

import { BackofficeRole } from '../src/constants/enums/backoffice-role.enum';
import { EntityName } from '../src/constants/enums/entity-name.enum';

export class migrations1767754579125 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const departments = await queryRunner.query(
      `SELECT id FROM "${EntityName.DEPARTMENT}"`
    );

    for (const department of departments) {
      for (const role of Object.values(BackofficeRole)) {
        await queryRunner.query(
          `INSERT INTO "${EntityName.BACKOFFICE_ROLE}"("department_id", "role") VALUES($1, $2)`,
          [department.id, role],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "${EntityName.BACKOFFICE_ROLE}"`);
  }
}
