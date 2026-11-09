import { ApiError } from "next/dist/server/api-utils";
import { describe, expect, it, vi } from "vitest";
import { handleRequest } from "@/lib/api-utils";

describe("handleRequest", () => {
  it("returns a synchronous callback result as JSON", async () => {
    const callback = vi.fn(() => ({ items: ["one", "two"] }));

    const response = await handleRequest(callback);

    expect(callback).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: ["one", "two"] });
  });

  it("awaits an asynchronous callback before returning JSON", async () => {
    const response = await handleRequest(async () => [{ id: 1 }]);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 1 }]);
  });

  it.each([400, 404, 401, 403])(
    "returns the status and message of an ApiError (%i)",
    async (statusCode) => {
      const response = await handleRequest(async () => {
        throw new ApiError(statusCode, "Expected failure");
      });

      expect(response.status).toBe(statusCode);
      expect(await response.json()).toEqual({ error: "Expected failure" });
    },
  );

  it("returns a safe error response when the callback fails", async () => {
    const error = new Error("private details");
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await handleRequest(async () => {
        throw error;
      });

      expect(logError).toHaveBeenCalledWith("Request failed", error);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Internal Server Error" });
    } finally {
      logError.mockRestore();
    }
  });
});
