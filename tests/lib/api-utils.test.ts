import { ApiError } from "next/dist/server/api-utils";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { handleRequest } from "@/lib/api-utils";
import { noteSchema } from "@/lib/validation/note.validation";

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

  it.each([
    400, 404, 401, 403,
  ])("returns the status and message of an ApiError (%i)", async (statusCode) => {
    const response = await handleRequest(async () => {
      throw new ApiError(statusCode, "Expected failure");
    });

    expect(response.status).toBe(statusCode);
    expect(await response.json()).toEqual({ error: "Expected failure" });
  });

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

  it("passes the parsed body to the callback", async () => {
    const callback = vi.fn((body: { n: number }) => ({ doubled: body.n * 2 }));

    const response = await handleRequest(callback, {
      schema: z.object({ n: z.coerce.number() }),
      body: { n: "4" },
    });

    expect(callback).toHaveBeenCalledWith({ n: 4 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ doubled: 8 });
  });

  it("returns a 400 with the issues and skips the callback when validation fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const callback = vi.fn();

    try {
      const body = { body: "", customerId: "nope" };
      const result = noteSchema.safeParse(body);
      if (result.success) throw new Error("expected validation to fail");

      const response = await handleRequest(callback, {
        schema: noteSchema,
        body,
      });

      expect(callback).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledOnce();
      expect(response.status).toBe(400);
      const { error } = await response.json();
      expect(error).toEqual(JSON.parse(JSON.stringify(result.error.issues)));
      expect(error.map((issue: { path: string[] }) => issue.path[0])).toEqual(
        expect.arrayContaining(["id", "body", "customerId"]),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("validates with an async schema", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const schema = z.object({
      name: z.string().refine(async (name) => name !== "taken"),
    });

    try {
      const ok = await handleRequest(() => "fine", {
        schema,
        body: { name: "free" },
      });
      const taken = await handleRequest(() => "fine", {
        schema,
        body: { name: "taken" },
      });

      expect(ok.status).toBe(200);
      expect(taken.status).toBe(400);
    } finally {
      warn.mockRestore();
    }
  });

  it("returns a 500, not a 400, when the callback itself throws a ZodError", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await handleRequest(async () =>
        noteSchema.parse({ id: "x" }),
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Internal Server Error" });
    } finally {
      logError.mockRestore();
    }
  });
});
