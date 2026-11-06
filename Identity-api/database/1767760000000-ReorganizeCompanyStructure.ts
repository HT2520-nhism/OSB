import { MigrationInterface, QueryRunner } from 'typeorm';

import { BackofficeRole } from '../src/constants/enums/backoffice-role.enum';
import { EntityName } from '../src/constants/enums/entity-name.enum';

/**
 * Sắp xếp lại cấu trúc tổ chức theo bộ máy công ty:
 * - Holding: 5 Ban (Ban giám đốc, Ban trợ lý, Ban Tài chính - Kế toán, Ban Nhân sự - Hành chính, Ban Thương mại)
 * - Mỗi đơn vị con có phòng ban riêng + role Giám đốc trung tâm
 */
export class ReorganizeCompanyStructure1767760000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Lưu ý: enum 'director', 'deputy_director' phải được thêm trước bởi 1767754578500-AddBackofficeRoleEnumValues

    // 1. Lấy holding
    const holding = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.COMPANY}" WHERE "type" = 'holding' LIMIT 1`,
    );
    const holdingId = holding[0]?.id;
    if (!holdingId) {
      throw new Error('Holding company not found');
    }

    // 2. Đổi tên HighTech nếu có, thêm Phòng Dịch vụ VAS (nếu chưa có)
    await queryRunner.query(
      `UPDATE "${EntityName.COMPANY}" SET "name" = 'Công ty TNHH Công nghệ cao OSB (Hightech)'
       WHERE "name" = 'Công ty TNHH Công nghệ cao - HighTech'`,
    );

    const vasExists = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.COMPANY}" WHERE "name" = $1`,
      ['Phòng Dịch vụ VAS'],
    );
    if (vasExists.length === 0) {
      await queryRunner.query(
        `INSERT INTO "${EntityName.COMPANY}"("name", "type", "parent_company_id") VALUES($1, $2, $3)`,
        ['Phòng Dịch vụ VAS', 'subsidiary', holdingId],
      );
    }

    // 3. Cập nhật users (bỏ FK department) rồi xóa backoffice_roles, departments
    await queryRunner.query(
      `UPDATE "${EntityName.USER}" SET department_id = NULL`,
    );
    await queryRunner.query(`DELETE FROM "users_backoffice_roles"`);
    await queryRunner.query(`DELETE FROM "${EntityName.BACKOFFICE_ROLE}"`);
    await queryRunner.query(`DELETE FROM "${EntityName.DEPARTMENT}"`);

    // 4. Định nghĩa cấu trúc: company name -> [{ deptName, roles[] }]
    const HOLDING_DEPTS = [
      {
        name: 'Ban giám đốc',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban trợ lý',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Tài chính - Kế toán',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Nhân sự - Hành chính',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Thương mại',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
    ];

    const TT1_DEPTS = [
      {
        name: 'Phòng Kỹ thuật triển khai',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Giám đốc Trung tâm',
        roles: [BackofficeRole.DIRECTOR],
      },
    ];

    const TT3_DEPTS = [
      {
        name: 'Phòng Nghiệp vụ',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Giám đốc Trung tâm',
        roles: [BackofficeRole.DIRECTOR],
      },
    ];

    const SATELLITE_DEPTS = [
      {
        name: 'Phòng Kỹ thuật và Triển khai Dự án phía Bắc',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng Kỹ thuật và Triển khai Dự án phía Nam',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng Kinh doanh 1',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng Kinh doanh 2',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng Điều hành Mạng',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng Dịch vụ Seacom',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Bộ phận Hành chính Tổng hợp',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Giám đốc Trung tâm',
        roles: [BackofficeRole.DIRECTOR],
      },
    ];

    const OSB_ECOM1_DEPTS = [
      {
        name: 'Phòng Kinh doanh 1',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng BSD 1',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Giám đốc Trung tâm',
        roles: [BackofficeRole.DIRECTOR],
      },
    ];

    const OSB_ECOM2_DEPTS = [
      {
        name: 'Phòng Kinh doanh 2',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng BSD 2',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Bộ phận Hành chính',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Giám đốc Trung tâm',
        roles: [BackofficeRole.DIRECTOR],
      },
    ];

    const VAS_DEPTS = [
      {
        name: 'Phòng Dịch vụ VAS',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Ban Giám đốc Trung tâm',
        roles: [BackofficeRole.DIRECTOR],
      },
    ];

    const HIGHTECH_DEPTS = [
      {
        name: 'Ban Giám đốc Công ty',
        roles: [BackofficeRole.DIRECTOR, BackofficeRole.DEPUTY_DIRECTOR],
      },
      {
        name: 'Phòng Kinh doanh - Dự án',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng Thiết kế - Nghiên cứu phát triển',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
      {
        name: 'Phòng Tích hợp - Sản xuất',
        roles: [BackofficeRole.ADMIN, BackofficeRole.USER],
      },
    ];

    const COMPANY_DEPTS: Record<string, typeof HOLDING_DEPTS> = {
      'Tập đoàn OSB': HOLDING_DEPTS,
      'Trung tâm tích hợp hệ thống 1': TT1_DEPTS,
      'Trung tâm tích hợp hệ thống 3': TT3_DEPTS,
      'Trung tâm vệ tinh': SATELLITE_DEPTS,
      'Trung tâm dịch vụ thương mại điện tử 1 (OSB Ecom 1)': OSB_ECOM1_DEPTS,
      'Trung tâm dịch vụ thương mại điện tử 2 (OSB Ecom 2)': OSB_ECOM2_DEPTS,
      'Phòng Dịch vụ VAS': VAS_DEPTS,
      'Công ty TNHH Công nghệ cao OSB (Hightech)': HIGHTECH_DEPTS,
    };

    for (const [companyName, depts] of Object.entries(COMPANY_DEPTS)) {
      const companies = await queryRunner.query(
        `SELECT "id" FROM "${EntityName.COMPANY}" WHERE "name" = $1`,
        [companyName],
      );
      if (companies.length === 0) continue;

      const companyId = companies[0].id;

      for (const dept of depts) {
        const deptInsert = await queryRunner.query(
          `INSERT INTO "${EntityName.DEPARTMENT}"("name", "company_id") VALUES($1, $2) RETURNING "id"`,
          [dept.name, companyId],
        );
        const deptId = deptInsert[0]?.id;
        if (!deptId) continue;

        for (const role of dept.roles) {
          await queryRunner.query(
            `INSERT INTO "${EntityName.BACKOFFICE_ROLE}"("department_id", "role") VALUES($1, $2)`,
            [deptId, role],
          );
        }
      }
    }

    // 5. Gán lại department cho users seed (Trung tâm vệ tinh - Phòng Dịch vụ Seacom)
    const satellite = await queryRunner.query(
      `SELECT "id" FROM "${EntityName.COMPANY}" WHERE "name" = 'Trung tâm vệ tinh' LIMIT 1`,
    );
    const seacomDept = await queryRunner.query(
      `SELECT d."id" FROM "${EntityName.DEPARTMENT}" d
       JOIN "${EntityName.COMPANY}" c ON d.company_id = c.id
       WHERE d.name = 'Phòng Dịch vụ Seacom' AND c.name = 'Trung tâm vệ tinh' LIMIT 1`,
    );
    if (satellite[0] && seacomDept[0]) {
      await queryRunner.query(
        `UPDATE "${EntityName.USER}" SET company_id = $1, department_id = $2
         WHERE email IN ('vanvh@osbholding.com', 'dungdtp@seacom.net.vn', 'dungdtp@seacom.net.vn ', 'cuongpd@seacom.net.vn')`,
        [satellite[0].id, seacomDept[0].id],
      );

      // Gán role ADMIN (trưởng phòng) cho users seed
      const adminRole = await queryRunner.query(
        `SELECT br."id" FROM "${EntityName.BACKOFFICE_ROLE}" br
         JOIN "${EntityName.DEPARTMENT}" d ON br.department_id = d.id
         WHERE d.id = $1 AND br.role = $2 LIMIT 1`,
        [seacomDept[0].id, BackofficeRole.ADMIN],
      );
      if (adminRole[0]) {
        const users = await queryRunner.query(
          `SELECT "id" FROM "${EntityName.USER}" WHERE email IN ('vanvh@osbholding.com', 'dungdtp@seacom.net.vn', 'dungdtp@seacom.net.vn ', 'cuongpd@seacom.net.vn')`,
        );
        for (const u of users) {
          await queryRunner.query(
            `INSERT INTO "users_backoffice_roles"("user_id", "backoffice_role_id") VALUES($1, $2) ON CONFLICT ("user_id", "backoffice_role_id") DO NOTHING`,
            [u.id, adminRole[0].id],
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "${EntityName.USER}" SET department_id = NULL`,
    );
    await queryRunner.query(`DELETE FROM "users_backoffice_roles"`);
    await queryRunner.query(`DELETE FROM "${EntityName.BACKOFFICE_ROLE}"`);
    await queryRunner.query(`DELETE FROM "${EntityName.DEPARTMENT}"`);
  }
}
