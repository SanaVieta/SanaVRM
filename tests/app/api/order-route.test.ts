import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/order/route";

const repo = vi.hoisted(() => ({
  findAndCount: vi.fn(),
}));

vi.mock("@/lib/db/getDB", () => ({
  getDb: vi.fn(async () => ({
    getRepository: vi.fn(() => repo),
  })),
}));

function listRequest(query = "") {
  return new NextRequest(`http://localhost/api/order${query}`);
}

describe("GET /api/order", () => {
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
