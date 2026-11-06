import { MigrationInterface, QueryRunner } from 'typeorm';

import { Department } from '../src/constants/enums/department.enum';
import { BackofficeRole } from '../src/constants/enums/backoffice-role.enum';
import { EntityName } from '../src/constants/enums/entity-name.enum';
import { CompanyType } from '../src/constants/enums/company-type.enum';

export class migrations1767757377257 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Lấy users theo email
    const users = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.USER}" WHERE "email" IN ($1, $2, $3)`,
      ['cuongpd@seacom.net.vn', 'vanvh@osbholding.com', 'dungdtp@seacom.net.vn'],
    );

    if (users.length === 0) {
      throw new Error(
        'Users not found. Please run InsertUser migration first.',
      );
    }

    // Lấy công ty con: Trung tâm vệ tinh
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

    // Tìm backoffice role ADMIN của department IT
    const adminRole = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.BACKOFFICE_ROLE}" WHERE "department_id" = $1 AND "role" = $2`,
      [seacomDepartmentId, BackofficeRole.ADMIN],
    );

    const adminRoleId = adminRole[0]?.id;

    if (!adminRoleId) {
      throw new Error(
        'Admin backoffice role for IT department not found. Please run InsertBackofficeRoles migration first.',
      );
    }

    // Gán admin role Seacom cho tất cả users seed ở trên
    await Promise.all(
      users.map((user: { id: string }) =>
        queryRunner.query(
          `INSERT INTO "users_backoffice_roles"("user_id", "backoffice_role_id") VALUES($1, $2) ON CONFLICT DO NOTHING`,
          [user.id, adminRoleId],
        ),
      ),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users_backoffice_roles"`);
  }
}
