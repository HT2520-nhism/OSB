import { MigrationInterface, QueryRunner } from 'typeorm';

import { Department } from '../src/constants/enums/department.enum';
import { CompanyType } from '../src/constants/enums/company-type.enum';
import { EntityName } from '../src/constants/enums/entity-name.enum';

export class migrations1767754577376 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const companies = await queryRunner.query(
      `SELECT "id", "name", "type" FROM "${EntityName.COMPANY}"`,
    );

    if (!companies.length) {
      throw new Error(
        'No company found. Please run InsertCompany migration first.',
      );
    }

    for (const company of companies) {
      await Promise.all(
        Object.values(Department).map((department) =>
          queryRunner.query(
            `INSERT INTO "${EntityName.DEPARTMENT}"("name", "company_id") VALUES($1, $2)`,
            [department, company.id],
          ),
        ),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "${EntityName.DEPARTMENT}"`);
  }
}
