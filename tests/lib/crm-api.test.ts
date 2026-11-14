import { afterEach, describe, expect, it, vi } from "vitest";
import { callApi, readCollection } from "@/lib/crm-api";

afterEach(() => vi.unstubAllGlobals());

describe("callApi", () => {
  it("resolves without parsing JSON on 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error("No body");
        },
      }),
    );

    await expect(
      callApi<void>("/api/lead/1", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });
});

describe("readCollection", () => {
  it("loads every page without dropping rows at a page boundary", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => index);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: firstPage, total: 101 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [100], total: 101 }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const rows = await readCollection<number>("/api/lead");
    expect(rows).toHaveLength(101);
    expect(rows[100]).toBe(100);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/lead?limit=100&offset=0",
      "/api/lead?limit=100&offset=100",
    ]);
  });

  it("surfaces an API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unavailable" }),
      }),
    );
    await expect(readCollection("/api/lead")).rejects.toThrow("Unavailable");
  });
});
