import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lead/import/route";

const repo = vi.hoisted(() => ({
  findOne: vi.fn(),
  create: vi.fn(),
  merge: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/lib/services/service-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/service-utils")>()),
  handleTransaction: vi.fn(async (callback) =>
    callback({ getRepository: () => repo }),
  ),
}));

function importRequest(rows: unknown[], duplicate: string) {
  return new NextRequest("http://localhost/api/lead/import", {
    method: "POST",
    body: JSON.stringify({ rows, duplicate }),
  });
}

describe("POST /api/lead/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((value) => ({ ...value }));
    repo.merge.mockImplementation((target, value) =>
      Object.assign(target, value),
    );
    repo.save.mockImplementation(async (value) => value);
  });

  it("creates leads and preserves the imported creation date", async () => {
    const response = await POST(
      importRequest(
        [
          {
            firstName: "New",
            email: "new@example.com",
            status: "new",
            createdAt: "2026-10-01T00:00:00.000Z",
          },
        ],
        "skip",
      ),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      created: 1,
      updated: 0,
      skipped: 0,
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
      }),
    );
  });

  it("skips or updates an existing email according to the selected option", async () => {
    repo.findOne.mockResolvedValue({ id: "existing", firstName: "Old" });
    const rows = [
      { firstName: "Changed", email: "same@example.com", status: "qualified" },
    ];
    const skipped = await POST(importRequest(rows, "skip"));
    expect(await skipped.json()).toEqual({
      created: 0,
      updated: 0,
      skipped: 1,
    });
    expect(repo.save).not.toHaveBeenCalled();
    const updated = await POST(importRequest(rows, "update"));
    expect(await updated.json()).toEqual({
      created: 0,
      updated: 1,
      skipped: 0,
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing", firstName: "Changed" }),
    );
  });

  it("rejects invalid status and an empty import", async () => {
    expect(
      (await POST(importRequest([{ status: "processed" }], "skip"))).status,
    ).toBe(400);
    expect((await POST(importRequest([], "update"))).status).toBe(400);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
