import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "@/app/api/inventory/[id]/route";

const id = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";

const repo = vi.hoisted(() => ({
  findOne: vi.fn(),
  save: vi.fn(),
  merge: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/db/getDB", () => ({
  getDb: vi.fn(async () => ({
    getRepository: vi.fn(() => repo),
  })),
}));

function patchRequest(body: string) {
  return new NextRequest(`http://localhost/api/inventory/${id}`, {
    method: "PATCH",
    body,
    headers: { "content-type": "application/json" },
  });
}

function idRequest(method: string) {
  return new NextRequest(`http://localhost/api/inventory/${id}`, { method });
}

describe("GET /api/inventory/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the inventory level by id", async () => {
    repo.findOne.mockResolvedValue({ id, available: 5 });

    const response = await GET(idRequest("GET"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id });
  });

  it("returns 404 when the inventory level does not exist", async () => {
    repo.findOne.mockResolvedValue(null);

    const response = await GET(idRequest("GET"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/inventory/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findOne.mockResolvedValue({ id, available: 5 });
    repo.merge.mockImplementation((target, input) =>
      Object.assign(target, input),
    );
    repo.save.mockImplementation(async (entity) => entity);
  });

  it("returns the inventory level updated from the JSON body", async () => {
    const response = await PATCH(
      patchRequest(JSON.stringify({ lowStockThreshold: 3 })),
      { params: Promise.resolve({ id }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id,
      lowStockThreshold: 3,
    });
  });

  it("returns 400 when the body is not JSON", async () => {
    const response = await PATCH(patchRequest("{"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body" });
  });
});

describe("DELETE /api/inventory/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the inventory level", async () => {
    repo.delete.mockResolvedValue({ affected: 1 });

    const response = await DELETE(idRequest("DELETE"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(204);
  });

  it("returns 404 when the inventory level does not exist", async () => {
    repo.delete.mockResolvedValue({ affected: 0 });

    const response = await DELETE(idRequest("DELETE"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(404);
  });
});
