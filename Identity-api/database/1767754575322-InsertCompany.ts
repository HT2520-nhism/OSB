import { MigrationInterface, QueryRunner } from 'typeorm';

import { CompanyType } from '../src/constants/enums/company-type.enum';
import { EntityName } from '../src/constants/enums/entity-name.enum';

export class migrations1767754575322 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "${EntityName.COMPANY}"("name", "type") VALUES($1, $2) RETURNING "id"`,
      ['Tập đoàn OSB', CompanyType.HOLDING],
    );

    const holdingCompany = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.COMPANY}" WHERE "name" = $1 AND "type" = $2`,
      ['Tập đoàn OSB', CompanyType.HOLDING],
    );

    const holdingCompanyId = holdingCompany[0]?.id;

    if (holdingCompanyId) {
      await queryRunner.query(
        `INSERT INTO "${EntityName.COMPANY}"("name", "type", "parent_company_id") VALUES($1, $2, $3)`,
        ['Trung tâm vệ tinh', CompanyType.SUBSIDIARY, holdingCompanyId],
      );

      await queryRunner.query(
        `INSERT INTO "${EntityName.COMPANY}"("name", "type", "parent_company_id") VALUES($1, $2, $3)`,
        [
          'Công ty TNHH Công nghệ cao - HighTech',
          CompanyType.SUBSIDIARY,
          holdingCompanyId,
        ],
      );

      await queryRunner.query(
        `INSERT INTO "${EntityName.COMPANY}"("name", "type", "parent_company_id") VALUES($1, $2, $3)`,
        [
          'Trung tâm tích hợp hệ thống 1',
          CompanyType.SUBSIDIARY,
          holdingCompanyId,
        ],
      );

      await queryRunner.query(
        `INSERT INTO "${EntityName.COMPANY}"("name", "type", "parent_company_id") VALUES($1, $2, $3)`,
        [
          'Trung tâm tích hợp hệ thống 3',
          CompanyType.SUBSIDIARY,
          holdingCompanyId,
        ],
      );

      await queryRunner.query(
        `INSERT INTO "${EntityName.COMPANY}"("name", "type", "parent_company_id") VALUES($1, $2, $3)`,
        [
          'Trung tâm dịch vụ thương mại điện tử 1 (OSB Ecom 1)',
          CompanyType.SUBSIDIARY,
          holdingCompanyId,
        ],
      );

      await queryRunner.query(
        `INSERT INTO "${EntityName.COMPANY}"("name", "type", "parent_company_id") VALUES($1, $2, $3)`,
        [
          'Trung tâm dịch vụ thương mại điện tử 2 (OSB Ecom 2)',
          CompanyType.SUBSIDIARY,
          holdingCompanyId,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "${EntityName.COMPANY}"`);
  }
}
