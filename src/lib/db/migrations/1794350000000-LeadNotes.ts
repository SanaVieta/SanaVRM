import type { MigrationInterface, QueryRunner } from "typeorm";

export class LeadNotes1794350000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notes" ADD "lead_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "CHK_0c3ec3c7bed68867b8f2b799f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "CHK_note_exactly_one_target" CHECK (num_nonnulls("lead_id", "customer_id", "order_id", "inventory_id") = 1)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_note_lead_id" ON "notes" ("lead_id") WHERE "lead_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "FK_note_lead_id" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_note_lead_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_note_lead_id"`);
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "CHK_note_exactly_one_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ADD CONSTRAINT "CHK_0c3ec3c7bed68867b8f2b799f2" CHECK (num_nonnulls("customer_id", "order_id", "inventory_id") = 1)`,
    );
    await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN "lead_id"`);
  }
}
