import { MigrationInterface, QueryRunner } from 'typeorm';

export class migrations1767675011832 implements MigrationInterface {
  name = 'migrations1767675011832';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "department" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "company_id" integer NOT NULL, CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3b9d2f4811f4c45f1ab7030ec0" ON "department" ("company_id", "name") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."backoffice_role_role_enum" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "backoffice_role" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "role" "public"."backoffice_role_role_enum" NOT NULL, "department_id" integer, CONSTRAINT "PK_57616c6cccfcebfe03cf4cb84f1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "department_role_unique" ON "backoffice_role" ("department_id", "role") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_gender_enum" AS ENUM('nam', 'nữ')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "gender" "public"."user_gender_enum", "email" character varying NOT NULL, "dob" TIMESTAMP, "phone_number" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "join_date" TIMESTAMP, "leave_date" TIMESTAMP, "identity_card_number" character varying, "insurance_number" character varying, "tax_number" character varying, "position" character varying, "updated_by" uuid, "company_id" integer, "department_id" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_type_enum" AS ENUM('holding', 'subsidiary')`,
    );
    await queryRunner.query(
      `CREATE TABLE "company" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" "public"."company_type_enum" NOT NULL, "parent_company_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a76c5cd486f7779bd9c319afd27" UNIQUE ("name"), CONSTRAINT "PK_056f7854a7afdba7cbd6d45fc20" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users_backoffice_roles" ("user_id" uuid NOT NULL, "backoffice_role_id" integer NOT NULL, CONSTRAINT "PK_8ed05d6799855b2263768015299" PRIMARY KEY ("user_id", "backoffice_role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_45b4351661f54f05009545c077" ON "users_backoffice_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_918b40f6745ae96407886af53e" ON "users_backoffice_roles" ("backoffice_role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "department" ADD CONSTRAINT "FK_f840e8ae1c80c7acb64dc668118" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice_role" ADD CONSTRAINT "FK_5d97594dc874069ac18f68738be" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_9e70b5f9d7095018e86970c7874" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_afd2c87bee70dd5557f48911e66" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD CONSTRAINT "FK_53ab29a2f8fc6e6ccf9f3dade2c" FOREIGN KEY ("parent_company_id") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_backoffice_roles" ADD CONSTRAINT "FK_45b4351661f54f05009545c077d" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_backoffice_roles" ADD CONSTRAINT "FK_918b40f6745ae96407886af53e7" FOREIGN KEY ("backoffice_role_id") REFERENCES "backoffice_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_backoffice_roles" DROP CONSTRAINT "FK_918b40f6745ae96407886af53e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_backoffice_roles" DROP CONSTRAINT "FK_45b4351661f54f05009545c077d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" DROP CONSTRAINT "FK_53ab29a2f8fc6e6ccf9f3dade2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_afd2c87bee70dd5557f48911e66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_9e70b5f9d7095018e86970c7874"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backoffice_role" DROP CONSTRAINT "FK_5d97594dc874069ac18f68738be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "department" DROP CONSTRAINT "FK_f840e8ae1c80c7acb64dc668118"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_918b40f6745ae96407886af53e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_45b4351661f54f05009545c077"`,
    );
    await queryRunner.query(`DROP TABLE "users_backoffice_roles"`);
    await queryRunner.query(`DROP TABLE "company"`);
    await queryRunner.query(`DROP TYPE "public"."company_type_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_gender_enum"`);
    await queryRunner.query(`DROP INDEX "public"."department_role_unique"`);
    await queryRunner.query(`DROP TABLE "backoffice_role"`);
    await queryRunner.query(`DROP TYPE "public"."backoffice_role_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3b9d2f4811f4c45f1ab7030ec0"`,
    );
    await queryRunner.query(`DROP TABLE "department"`);
  }
}
