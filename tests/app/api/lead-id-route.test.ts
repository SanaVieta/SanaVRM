import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/lead/[id]/route";

const id = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";

const repo = vi.hoisted(() => ({
  findOne: vi.fn(),
  save: vi.fn(),
  merge: vi.fn(),
}));

vi.mock("@/lib/db/getDB", () => ({
  getDb: vi.fn(async () => ({
    getRepository: vi.fn(() => repo),
  })),
}));

function patchRequest(body: string) {
  return new NextRequest(`http://localhost/api/lead/${id}`, {
    method: "PATCH",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/lead/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findOne.mockResolvedValue({
      id,
      status: "new",
      customerId: null,
      linkedAt: null,
      notes: null,
    });
    repo.merge.mockImplementation((target, input) =>
      Object.assign(target, input),
    );
    repo.save.mockImplementation(async (entity) => entity);
  });

  it("returns the lead updated from the JSON body", async () => {
    const response = await PATCH(
      patchRequest(JSON.stringify({ notes: "called" })),
      { params: Promise.resolve({ id }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id, notes: "called" });
  });

  it("returns 400 when the body is not JSON", async () => {
    const response = await PATCH(patchRequest("{"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body" });
  });
});
