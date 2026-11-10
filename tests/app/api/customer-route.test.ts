import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/customer/route";

const repo = vi.hoisted(() => ({
  findAndCount: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/lib/db/getDB", () => ({
  getDb: vi.fn(async () => ({
    getRepository: vi.fn(() => repo),
  })),
}));

function listRequest(query = "") {
  return new NextRequest(`http://localhost/api/customer${query}`);
}

function postRequest(body: string) {
  return new NextRequest("http://localhost/api/customer", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/customer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findAndCount.mockResolvedValue([[], 0]);
  });

  it("sorts by createdAt ASC when the query asks for it", async () => {
    const response = await GET(listRequest("?createdAt=ASC"));

    expect(response.status).toBe(200);
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: "ASC", id: "ASC" } }),
    );
  });

  it("uses limit and offset from the query", async () => {
    const response = await GET(listRequest("?limit=25&offset=5"));

    expect(response.status).toBe(200);
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25, skip: 5 }),
    );
  });

  it.each([
    "limit=10abc",
    "offset=5abc",
  ])("returns 400 when %s is not an integer", async (query) => {
    const response = await GET(listRequest(`?${query}`));

    expect(response.status).toBe(400);
    expect(repo.findAndCount).not.toHaveBeenCalled();
  });
});

describe("POST /api/customer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.create.mockImplementation((input) => input);
    repo.save.mockImplementation(async (entity) => ({
      id: "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b",
      ...entity,
    }));
  });

  it("creates a customer from the JSON body", async () => {
    const response = await POST(
      postRequest(JSON.stringify({ shopifyCustomerId: "123" })),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ shopifyCustomerId: "123" });
  });

  it("returns 400 when the shopify id is not numeric", async () => {
    const response = await POST(
      postRequest(JSON.stringify({ shopifyCustomerId: "abc" })),
    );

    expect(response.status).toBe(400);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not JSON", async () => {
    const response = await POST(postRequest("{"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body" });
  });
});
