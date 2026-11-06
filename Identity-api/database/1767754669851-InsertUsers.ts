import { MigrationInterface, QueryRunner } from 'typeorm';

import { Gender } from '../src/constants/enums/gender.enum';
import { Department } from '../src/constants/enums/department.enum';
import { CompanyType } from '../src/constants/enums/company-type.enum';
import { EntityName } from '../src/constants/enums/entity-name.enum';

export class migrations1767754669851 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const satelliteCenter = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.COMPANY}" WHERE "name" = $1`,
      ['Trung tâm vệ tinh'],
    );

    const satelliteCenterId = satelliteCenter[0]?.id;

    if (!satelliteCenterId) {
      throw new Error(
        'Satellite center not found. Please run InsertCompany migration first.',
      );
    }

    const seacomDepartment = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.DEPARTMENT}" WHERE "name" = $1 AND "company_id" = $2`,
      [Department.SEACOM_SERVICE, satelliteCenterId],
    );

    const seacomDepartmentId = seacomDepartment[0]?.id;

    if (!seacomDepartmentId) {
      throw new Error(
        'Seacom department not found. Please run InsertDepartment migration first.',
      );
    }

    await queryRunner.query(
      `INSERT INTO "${EntityName.USER}"("name", "email", "gender", "join_date", "dob", "phone_number", "company_id", "department_id") VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'Vũ Hữu Văn',
        'vanvh@osbholding.com',
        Gender.MALE,
        new Date('2018-02-06T00:00:00.000Z'),
        new Date('1974-01-03T00:00:00.000Z'),
        '+84909090909',
        satelliteCenterId,
        seacomDepartmentId,
      ],
    );

    await queryRunner.query(
      `INSERT INTO "${EntityName.USER}"("name", "email", "gender", "join_date", "dob", "phone_number", "company_id", "department_id") VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'Đoàn Thị Phương Dung ',
        'dungdtp@seacom.net.vn',
        Gender.FEMALE,
        new Date('2018-02-06T00:00:00.000Z'),
        new Date('1974-01-03T00:00:00.000Z'),
        '+84909090909',
        satelliteCenterId,
        seacomDepartmentId,
      ],
    );

    await queryRunner.query(
      `INSERT INTO "${EntityName.USER}"("name", "email", "gender", "join_date", "dob", "phone_number", "company_id", "department_id") VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,

      [
        'Phạm Đức Cường',
        'cuongpd@seacom.net.vn',
        Gender.MALE,
        new Date('2023-02-06T00:00:00.000Z'),
        new Date('2003-01-03T00:00:00.000Z'),
        '+84909090909',
        satelliteCenterId,
        seacomDepartmentId,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "${EntityName.USER}" WHERE "email" IN ($1, $2, $3)`,
      ['cuongpd@seacom.net.vn', 'vanvh@osbholding.com', 'dungdtp@seacom.net.vn'],
    );
  }
}
