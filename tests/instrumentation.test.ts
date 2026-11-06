import { afterEach, describe, expect, it, vi } from "vitest";
import { register } from "@/instrumentation";

const getDb = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/getDB", () => ({ getDb }));

describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    getDb.mockReset();
  });

  it("connects to the database on the Node.js runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    getDb.mockResolvedValue({});

    await register();

    expect(getDb).toHaveBeenCalledTimes(1);
  });

  it("skips the database on the Edge runtime", async () => {
    vi.stubEnv("NEXT_RUNTIME", "edge");

    await register();

    expect(getDb).not.toHaveBeenCalled();
  });

  it("fails startup when the connection fails", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    getDb.mockRejectedValue(new Error("connection refused"));

    await expect(register()).rejects.toThrow("connection refused");
  });
});
