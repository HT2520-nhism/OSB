import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPasswordLogin1774300000000 implements MigrationInterface {
  name = 'AddUserPasswordLogin1774300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password_hash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "login_username" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_login_username" UNIQUE ("login_username")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_login_username"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "login_username"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password_hash"`);
  }
}
