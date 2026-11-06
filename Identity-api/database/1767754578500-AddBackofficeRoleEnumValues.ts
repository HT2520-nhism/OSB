import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Thêm enum values 'director', 'deputy_director' cho backoffice_role.
 * Phải chạy TRƯỚC InsertBackofficeRoles (1767754579125): enum ban đầu chỉ có admin, user.
 * Phải tách riêng vì PostgreSQL không cho dùng enum mới trong cùng transaction với ALTER TYPE ADD VALUE.
 */
export class AddBackofficeRoleEnumValues1767754578500
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const val of ['director', 'deputy_director']) {
      try {
        await queryRunner.query(
          `ALTER TYPE "public"."backoffice_role_role_enum" ADD VALUE '${val}'`,
        );
      } catch (err: any) {
        const msg = String(err?.message ?? err?.driverError ?? '');
        if (msg.includes('already exists') || msg.includes('duplicate')) continue;
        throw err;
      }
    }
  }

  public async down(): Promise<void> {
    // PostgreSQL không hỗ trợ xóa enum value dễ dàng
  }
}
