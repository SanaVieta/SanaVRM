import type { MigrationInterface, QueryRunner } from "typeorm";
import {
  lockPublicTableFromPostgrest,
  unlockPublicTableForPostgrest,
} from "@/lib/db/migration-utils";

export class MigrationsTableRls1794360000000 implements MigrationInterface {
  name = "MigrationsTableRls1794360000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await lockPublicTableFromPostgrest(queryRunner, "migrations");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await unlockPublicTableForPostgrest(queryRunner, "migrations");
  }
}
