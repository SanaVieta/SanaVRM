import { afterEach, describe, expect, it, vi } from "vitest";
import { importLeadsInBatches } from "@/lib/crm-api";
import type { ImportRow } from "@/lib/import-leads";
import { MAX_IMPORT_ROWS } from "@/lib/lead-import-limits";

const row = (index: number): ImportRow => ({
  firstName: `Lead${index}`,
  lastName: null,
  phone: null,
  email: `lead${index}@example.com`,
  city: null,
  state: null,
  status: "new",
});

describe("importLeadsInBatches", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts each chunk and aggregates counts", async () => {
    const rows = Array.from({ length: MAX_IMPORT_ROWS + 2 }, (_, index) =>
      row(index),
    );
    const fetchMock = vi.fn(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { rows: ImportRow[] };
      return new Response(
        JSON.stringify({
          created: body.rows.length,
          updated: 0,
          skipped: 0,
        }),
        { status: 201 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const progress: Array<{ current: number; total: number }> = [];
    const result = await importLeadsInBatches(
      rows,
      "skip",
      (current, total) => {
        progress.push({ current, total });
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      created: MAX_IMPORT_ROWS + 2,
      updated: 0,
      skipped: 0,
    });
    expect(progress).toEqual([
      { current: 1, total: 2 },
      { current: 2, total: 2 },
    ]);
  });
});
