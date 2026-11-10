import { ApiError } from "next/dist/server/api-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLead, updateLead } from "@/lib/services/lead.services";

const id = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";
const customerId = "7a1c9e2d-5b3f-4a8c-9d0e-2f3a4b5c6d7e";
const now = new Date();

const repo = vi.hoisted(() => ({
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  merge: vi.fn(),
}));

vi.mock("@/lib/db/getDB", () => ({
  getDb: vi.fn(async () => ({
    getRepository: vi.fn(() => repo),
  })),
}));

describe("lead services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.create.mockImplementation((input) => ({
      id,
      status: "new",
      ...input,
    }));
    repo.save.mockImplementation(async (entity) => entity);
    repo.merge.mockImplementation((target, input) =>
      Object.assign(target, input),
    );
  });

  it("rejects create when only customerId is set", async () => {
    await expect(
      createLead({ customerId, status: "new" }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "customerId and linkedAt must be set or cleared together",
    });
  });

  it("accepts create when customerId and linkedAt are set together", async () => {
    await expect(
      createLead({
        status: "new",
        customerId,
        linkedAt: now,
      }),
    ).resolves.toMatchObject({ customerId, linkedAt: now });
  });

  it("rejects update that breaks the link invariant", async () => {
    repo.findOne.mockResolvedValue({
      id,
      status: "new",
      customerId: null,
      linkedAt: null,
    });

    await expect(updateLead(id, { customerId })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
