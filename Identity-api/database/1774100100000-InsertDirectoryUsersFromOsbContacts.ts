import { MigrationInterface, QueryRunner } from 'typeorm';

import { BackofficeRole } from '../src/constants/enums/backoffice-role.enum';
import { EntityName } from '../src/constants/enums/entity-name.enum';

import { DIRECTORY_USERS } from './data/directory-users-from-osb-contacts';

/**
 * Seed / cập nhật user theo danh bạ NV OSB (PDF 03.03.2026) + gán backoffice role theo chức danh.
 * Chạy sau ReorganizeCompanyStructure1767760000000.
 */
export class InsertDirectoryUsersFromOsbContacts1774100100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "${EntityName.USER}" SET "email" = TRIM("email") WHERE "email" <> TRIM("email")`,
    );

    for (const row of DIRECTORY_USERS) {
      const company = await queryRunner.query(
        `SELECT "id" FROM "${EntityName.COMPANY}" WHERE "name" = $1 LIMIT 1`,
        [row.company],
      );
      const companyId = company[0]?.id;
      if (!companyId) {
        throw new Error(`Company not found: ${row.company}`);
      }

      const dept = await queryRunner.query(
        `SELECT d."id" FROM "${EntityName.DEPARTMENT}" d
         WHERE d."company_id" = $1 AND d."name" = $2 LIMIT 1`,
        [companyId, row.department],
      );
      const departmentId = dept[0]?.id;
      if (!departmentId) {
        throw new Error(
          `Department not found: ${row.company} / ${row.department}`,
        );
      }

      const roleId = await this.resolveBackofficeRoleId(
        queryRunner,
        departmentId,
        row.role,
      );
      if (!roleId) {
        throw new Error(
          `Backoffice role not found for ${row.email} (${row.department}, ${row.role})`,
        );
      }

      await queryRunner.query(
        `INSERT INTO "${EntityName.USER}"
         ("name", "email", "dob", "phone_number", "company_id", "department_id")
         VALUES($1, $2, $3::timestamp, $4, $5, $6)
         ON CONFLICT ("email") DO UPDATE SET
           "name" = EXCLUDED."name",
           "dob" = EXCLUDED."dob",
           "phone_number" = EXCLUDED."phone_number",
           "company_id" = EXCLUDED."company_id",
           "department_id" = EXCLUDED."department_id"`,
        [
          row.name,
          row.email,
          row.dob,
          row.phone,
          companyId,
          departmentId,
        ],
      );

      const users = await queryRunner.query(
        `SELECT "id" FROM "${EntityName.USER}" WHERE "email" = $1 LIMIT 1`,
        [row.email],
      );
      const userId = users[0]?.id;
      if (!userId) {
        throw new Error(`User upsert failed: ${row.email}`);
      }

      await queryRunner.query(
        `DELETE FROM "users_backoffice_roles" WHERE "user_id" = $1`,
        [userId],
      );
      await queryRunner.query(
        `INSERT INTO "users_backoffice_roles"("user_id", "backoffice_role_id") VALUES($1, $2)`,
        [userId, roleId],
      );
    }
  }

  private async resolveBackofficeRoleId(
    queryRunner: QueryRunner,
    departmentId: number,
    preferred: BackofficeRole,
  ): Promise<number | null> {
    const order: BackofficeRole[] = [preferred];
    if (preferred === BackofficeRole.DIRECTOR) {
      order.push(BackofficeRole.ADMIN, BackofficeRole.USER);
    } else if (preferred === BackofficeRole.DEPUTY_DIRECTOR) {
      order.push(BackofficeRole.ADMIN, BackofficeRole.USER);
    } else if (preferred === BackofficeRole.ADMIN) {
      order.push(BackofficeRole.USER);
    }
    for (const r of order) {
      const rows = await queryRunner.query(
        `SELECT "id" FROM "${EntityName.BACKOFFICE_ROLE}"
         WHERE "department_id" = $1 AND "role" = $2 LIMIT 1`,
        [departmentId, r],
      );
      if (rows[0]?.id) {
        return rows[0].id;
      }
    }
    return null;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const emails = DIRECTORY_USERS.map((r) => r.email);
    await queryRunner.query(
      `DELETE FROM "users_backoffice_roles" WHERE "user_id" IN
       (SELECT "id" FROM "${EntityName.USER}" WHERE "email" = ANY($1::text[]))`,
      [emails],
    );
    await queryRunner.query(
      `DELETE FROM "${EntityName.USER}" WHERE "email" = ANY($1::text[])`,
      [emails],
    );
  }
}
