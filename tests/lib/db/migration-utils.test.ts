import type { QueryRunner } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import {
  lockPublicTableFromPostgrest,
  unlockPublicTableForPostgrest,
} from "@/lib/db/migration-utils";

function queryRunnerMock(): QueryRunner {
  const query = vi.fn(async (_sql: string) => undefined);
  return { query } as unknown as QueryRunner;
}

describe("migration-utils", () => {
  it("enables RLS and revokes anon/authenticated when locking a table", async () => {
    const queryRunner = queryRunnerMock();

    await lockPublicTableFromPostgrest(queryRunner, "call_logs");

    expect(queryRunner.query).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(queryRunner.query).mock.calls;
    expect(calls[0]?.[0]).toContain(
      'ALTER TABLE "call_logs" ENABLE ROW LEVEL SECURITY',
    );
    expect(calls[1]?.[0]).toContain("anon");
    expect(calls[1]?.[0]).toContain("call_logs");
  });

  it("restores grants and disables RLS when unlocking a table", async () => {
    const queryRunner = queryRunnerMock();

    await unlockPublicTableForPostgrest(queryRunner, "call_logs");

    expect(queryRunner.query).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(queryRunner.query).mock.calls;
    expect(calls[1]?.[0]).toContain(
      'ALTER TABLE "call_logs" DISABLE ROW LEVEL SECURITY',
    );
  });
});
