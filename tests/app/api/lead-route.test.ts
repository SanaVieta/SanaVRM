import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/lead/route";

const repo = vi.hoisted(() => ({
  findAndCount: vi.fn(),
}));

vi.mock("@/lib/db/getDB", () => ({
  getDb: vi.fn(async () => ({
    getRepository: vi.fn(() => repo),
  })),
}));

function listRequest(query = "") {
  return new NextRequest(`http://localhost/api/lead${query}`);
}

describe("GET /api/lead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findAndCount.mockResolvedValue([[], 0]);
  });

  it("sorts by createdAt ASC when the query asks for it", async () => {
    const response = await GET(listRequest("?createdAt=ASC"));

    expect(response.status).toBe(200);
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: "ASC" } }),
    );
  });
});
