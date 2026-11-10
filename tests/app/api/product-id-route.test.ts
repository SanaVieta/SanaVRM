import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "@/app/api/product/[id]/route";

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
  return new NextRequest(`http://localhost/api/product/${id}`, {
    method: "PATCH",
    body,
    headers: { "content-type": "application/json" },
  });
}

function idRequest(method: string) {
  return new NextRequest(`http://localhost/api/product/${id}`, { method });
}

describe("GET /api/product/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the product by id", async () => {
    repo.findOne.mockResolvedValue({ id, shopifyVariantId: "1" });

    const response = await GET(idRequest("GET"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id });
  });

  it("returns 404 when the product does not exist", async () => {
    repo.findOne.mockResolvedValue(null);

    const response = await GET(idRequest("GET"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/product/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findOne.mockResolvedValue({ id, shopifyVariantId: "1" });
    repo.merge.mockImplementation((target, input) =>
      Object.assign(target, input),
    );
    repo.save.mockImplementation(async (entity) => entity);
  });

  it("returns the product updated from the JSON body", async () => {
    const response = await PATCH(
      patchRequest(JSON.stringify({ notes: "restock soon" })),
      { params: Promise.resolve({ id }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id,
      notes: "restock soon",
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

describe("DELETE /api/product/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the product", async () => {
    repo.delete.mockResolvedValue({ affected: 1 });

    const response = await DELETE(idRequest("DELETE"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(204);
  });

  it("returns 404 when the product does not exist", async () => {
    repo.delete.mockResolvedValue({ affected: 0 });

    const response = await DELETE(idRequest("DELETE"), {
      params: Promise.resolve({ id }),
    });

    expect(response.status).toBe(404);
  });
});
