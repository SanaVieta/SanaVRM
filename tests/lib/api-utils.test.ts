import { ApiError } from "next/dist/server/api-utils";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import { noteSchema } from "@/lib/validation/note.validation";

function createRequest(method = "GET") {
  return new NextRequest("http://localhost/api/test", { method });
}

function createJsonRequest(body: string) {
  return new NextRequest("http://localhost/api/test", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("getRequestBody", () => {
  it("returns the JSON object from the request", async () => {
    const request = createJsonRequest(
      JSON.stringify({ notes: "called", score: 2 }),
    );

    await expect(getRequestBody(request)).resolves.toEqual({
      notes: "called",
      score: 2,
    });
  });

  it("rejects when the request body is not JSON", async () => {
    const request = createJsonRequest("{");

    await expect(getRequestBody(request)).rejects.toThrow(SyntaxError);
  });
});

describe("handleRequest", () => {
  it.each([
    ["GET", 200],
    ["POST", 201],
    ["PUT", 200],
    ["PATCH", 200],
    ["DELETE", 204],
  ])("uses the %s request method to choose status %i", async (method, status) => {
    const response = await handleRequest(
      () => ({ ok: true }),
      createRequest(method),
    );

    expect(response.status).toBe(status);
  });

  it("returns a synchronous callback result as JSON", async () => {
    const callback = vi.fn(() => ({ items: ["one", "two"] }));

    const response = await handleRequest(callback, createRequest());

    expect(callback).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: ["one", "two"] });
  });

  it("awaits an asynchronous callback before returning JSON", async () => {
    const response = await handleRequest(
      async () => [{ id: 1 }],
      createRequest(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 1 }]);
  });

  it.each([
    400, 404, 401, 403,
  ])("returns the status and message of an ApiError (%i)", async (statusCode) => {
    const response = await handleRequest(async () => {
      throw new ApiError(statusCode, "Expected failure");
    }, createRequest());

    expect(response.status).toBe(statusCode);
    expect(await response.json()).toEqual({ error: "Expected failure" });
  });

  it("returns a safe error response when the callback fails", async () => {
    const error = new Error("private details");
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await handleRequest(async () => {
        throw error;
      }, createRequest());

      expect(logError).toHaveBeenCalledWith("Request failed", error);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Internal Server Error" });
    } finally {
      logError.mockRestore();
    }
  });

  it("passes the parsed body to the callback", async () => {
    const callback = vi.fn((body: { n: number }) => ({ doubled: body.n * 2 }));

    const response = await handleRequest(callback, createRequest(), {
      schema: z.object({ n: z.coerce.number() }),
      body: { n: "4" },
    });

    expect(callback).toHaveBeenCalledWith({ n: 4 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ doubled: 8 });
  });

  it("returns a 400 with the readable issues and skips the callback when validation fails", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const callback = vi.fn();

    try {
      const response = await handleRequest(callback, createRequest(), {
        schema: noteSchema,
        body: { body: "", customerId: "nope" },
      });

      expect(callback).not.toHaveBeenCalled();
      expect(logError).toHaveBeenCalledOnce();
      expect(response.status).toBe(400);
      const { error } = await response.json();
      expect(error).toEqual(expect.any(String));
      for (const field of ["id", "body", "customerId"]) {
        expect(error).toContain(field);
      }
    } finally {
      logError.mockRestore();
    }
  });

  it("validates with an async schema", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const schema = z.object({
      name: z.string().refine(async (name) => name !== "taken"),
    });

    try {
      const ok = await handleRequest(() => "fine", createRequest(), {
        schema,
        body: { name: "free" },
      });
      const taken = await handleRequest(() => "fine", createRequest(), {
        schema,
        body: { name: "taken" },
      });

      expect(ok.status).toBe(200);
      expect(taken.status).toBe(400);
    } finally {
      logError.mockRestore();
    }
  });

  it("returns a 500, not a 400, when the callback itself throws a ZodError", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const response = await handleRequest(
        async () => noteSchema.parse({ id: "x" }),
        createRequest(),
      );

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Internal Server Error" });
    } finally {
      logError.mockRestore();
    }
  });
});
