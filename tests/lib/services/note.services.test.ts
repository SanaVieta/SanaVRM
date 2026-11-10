import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNote, updateNote } from "@/lib/services/note.services";

const id = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";
const customerId = "7a1c9e2d-5b3f-4a8c-9d0e-2f3a4b5c6d7e";

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

describe("note services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.create.mockImplementation((input) => ({ id, ...input }));
    repo.save.mockImplementation(async (entity) => entity);
    repo.merge.mockImplementation((target, input) =>
      Object.assign(target, input),
    );
  });

  it("rejects create without exactly one target", async () => {
    await expect(createNote({ body: "hello" })).rejects.toMatchObject({
      statusCode: 400,
      message:
        "A note must attach to exactly one of customer, order, or inventory",
    });
    await expect(
      createNote({ body: "hello", customerId, orderId: customerId }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("accepts create with a single customer target", async () => {
    await expect(
      createNote({ body: "hello", customerId }),
    ).resolves.toMatchObject({ body: "hello", customerId });
  });

  it("rejects update that clears all targets", async () => {
    repo.findOne.mockResolvedValue({
      id,
      body: "hello",
      customerId,
      orderId: null,
      inventoryId: null,
    });

    await expect(
      updateNote(id, {
        customerId: null,
        orderId: null,
        inventoryId: null,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
