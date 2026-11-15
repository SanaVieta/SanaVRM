import type { QueryRunner } from "typeorm";

/**
 * Deny PostgREST (anon / authenticated) access to a new public table.
 * Safe on local Docker where those roles do not exist.
 * See docs/decisions/2026-11-14-public-schema-rls-migrations.md.
 */
export async function lockPublicTableFromPostgrest(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<void> {
  await queryRunner.query(
    `ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`,
  );
  await queryRunner.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE "${tableName}" FROM anon;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE "${tableName}" FROM authenticated;
      END IF;
    END $$;
  `);
}

export async function unlockPublicTableForPostgrest(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<void> {
  await queryRunner.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        GRANT ALL ON TABLE "${tableName}" TO anon;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT ALL ON TABLE "${tableName}" TO authenticated;
      END IF;
    END $$;
  `);
  await queryRunner.query(
    `ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY`,
  );
}
