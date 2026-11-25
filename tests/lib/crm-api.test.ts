import { afterEach, describe, expect, it, vi } from "vitest";
import {
  callApi,
  POLL_INTERVAL_MS,
  readCollection,
  startPolling,
} from "@/lib/crm-api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

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

describe("startPolling", () => {
  function stubDocument(hidden: boolean) {
    const listeners = new Set<() => void>();
    const documentStub = {
      hidden,
      addEventListener: (_type: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) =>
        listeners.delete(listener),
    };
    vi.stubGlobal("document", documentStub);
    return {
      documentStub,
      fireVisibilityChange: () => {
        for (const listener of listeners) listener();
      },
      listeners,
    };
  }

  it("polls every 20 seconds while the tab is visible", () => {
    vi.useFakeTimers();
    stubDocument(false);
    const run = vi.fn();
    startPolling(run);

    vi.advanceTimersByTime(POLL_INTERVAL_MS - 1);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(POLL_INTERVAL_MS);
    expect(run).toHaveBeenCalledTimes(2);
    expect(POLL_INTERVAL_MS).toBe(20_000);
  });

  it("skips polls while the tab is hidden and refreshes on return", () => {
    vi.useFakeTimers();
    const { documentStub, fireVisibilityChange } = stubDocument(true);
    const run = vi.fn();
    startPolling(run);

    vi.advanceTimersByTime(POLL_INTERVAL_MS * 3);
    fireVisibilityChange();
    expect(run).not.toHaveBeenCalled();

    documentStub.hidden = false;
    fireVisibilityChange();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("stops the timer and listener when stopped", () => {
    vi.useFakeTimers();
    const { listeners } = stubDocument(false);
    const run = vi.fn();
    const stop = startPolling(run);

    stop();
    vi.advanceTimersByTime(POLL_INTERVAL_MS * 3);
    expect(run).not.toHaveBeenCalled();
    expect(listeners.size).toBe(0);
  });
});
