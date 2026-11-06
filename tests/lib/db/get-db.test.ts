import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sleepMock = vi.hoisted(() => vi.fn(async (_ms: number) => undefined));
const dataSource = vi.hoisted(() => ({
  isInitialized: false,
  initialize: vi.fn(),
}));

vi.mock("node:timers/promises", () => ({ setTimeout: sleepMock }));
vi.mock("@/lib/db/data-source", () => ({ AppDataSource: dataSource }));

// getDb keeps module-level state, so every test loads a fresh copy.
async function loadGetDb() {
  vi.resetModules();
  return (await import("@/lib/db/getDB")).getDb;
}

async function connectDataSource() {
  dataSource.isInitialized = true;
  return dataSource;
}

describe("getDb", () => {
  beforeEach(() => {
    dataSource.isInitialized = false;
    dataSource.initialize.mockReset();
    sleepMock.mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the existing connection without initializing again", async () => {
    dataSource.isInitialized = true;
    const getDb = await loadGetDb();

    await expect(getDb()).resolves.toBe(dataSource);
    expect(dataSource.initialize).not.toHaveBeenCalled();
  });

  it("connects on the first attempt without waiting", async () => {
    dataSource.initialize.mockImplementation(connectDataSource);
    const getDb = await loadGetDb();

    await expect(getDb()).resolves.toBe(dataSource);
    expect(dataSource.initialize).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it("retries after a failed attempt, then connects", async () => {
    dataSource.initialize
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockImplementation(connectDataSource);
    const getDb = await loadGetDb();

    await expect(getDb()).resolves.toBe(dataSource);
    expect(dataSource.initialize).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after 3 attempts and rethrows the last error", async () => {
    const error = new Error("connection refused");
    dataSource.initialize.mockRejectedValue(error);
    const getDb = await loadGetDb();

    await expect(getDb()).rejects.toBe(error);
    expect(dataSource.initialize).toHaveBeenCalledTimes(4);
    expect(sleepMock).toHaveBeenCalledTimes(3);
  });

  it("shares one set of attempts between concurrent callers", async () => {
    dataSource.initialize.mockRejectedValue(new Error("connection refused"));
    const getDb = await loadGetDb();

    const results = await Promise.allSettled([getDb(), getDb(), getDb()]);

    expect(results.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
      "rejected",
    ]);
    expect(dataSource.initialize).toHaveBeenCalledTimes(4);
  });

  it("starts a fresh set of attempts after giving up", async () => {
    dataSource.initialize.mockRejectedValue(new Error("connection refused"));
    const getDb = await loadGetDb();
    await expect(getDb()).rejects.toThrow("connection refused");

    dataSource.initialize.mockImplementation(connectDataSource);

    await expect(getDb()).resolves.toBe(dataSource);
  });
});
