import { ApiError } from "next/dist/server/api-utils";
import type { EntityManager, Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteByIdOrThrow,
  findPaginated,
  handleTransaction,
  normalizePagination,
  requireEntity,
} from "@/lib/services/service-utils";

const transactionMock = vi.hoisted(() => vi.fn());
const getDbMock = vi.hoisted(() =>
  vi.fn(async () => ({
    transaction: transactionMock,
  })),
);

vi.mock("@/lib/db/getDB", () => ({ getDb: getDbMock }));

describe("handleTransaction", () => {
  const manager = { getRepository: vi.fn() } as unknown as EntityManager;

  beforeEach(() => {
    vi.clearAllMocks();
    transactionMock.mockImplementation(async (runInTransaction) =>
      runInTransaction(manager),
    );
  });

  it("obtains a connection via getDb", async () => {
    await handleTransaction(async () => "ok");
    expect(getDbMock).toHaveBeenCalledOnce();
  });

  it("runs the callback with the transactional manager", async () => {
    const fn = vi.fn(async (transactionManager: EntityManager) => {
      expect(transactionManager).toBe(manager);
      return 42;
    });

    await handleTransaction(fn);

    expect(transactionMock).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(manager);
  });

  it("returns the callback result", async () => {
    await expect(handleTransaction(async () => ({ id: "x" }))).resolves.toEqual(
      { id: "x" },
    );
  });

  it("rejects when the callback throws", async () => {
    const error = new Error("rollback me");
    await expect(
      handleTransaction(async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });
});

describe("normalizePagination", () => {
  it("uses defaults when params are omitted", () => {
    expect(normalizePagination()).toEqual({ limit: 10, offset: 0 });
  });

  it("clamps limit to the allowed range", () => {
    expect(normalizePagination({ limit: 0 }).limit).toBe(1);
    expect(normalizePagination({ limit: 500 }).limit).toBe(100);
    expect(normalizePagination({ offset: -3 }).offset).toBe(0);
  });
});

describe("findPaginated", () => {
  it("returns data, total, and normalized pagination metadata", async () => {
    const data = [{ id: "1" }, { id: "2" }];
    const repo = {
      findAndCount: vi.fn(async () => [data, 42]),
    };

    await expect(
      findPaginated(
        repo as unknown as Repository<{ id: string; createdAt: Date }>,
        { limit: 2, offset: 5 },
      ),
    ).resolves.toEqual({
      data,
      total: 42,
      limit: 2,
      offset: 5,
    });

    expect(repo.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: "DESC" },
      skip: 5,
      take: 2,
    });
  });

  it("sorts by createdAt ASC when requested", async () => {
    const repo = {
      findAndCount: vi.fn(async () => [[], 0]),
    };

    await findPaginated(
      repo as unknown as Repository<{ id: string; createdAt: Date }>,
      { createdAt: "ASC" },
    );

    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: "ASC" } }),
    );
  });
});

describe("requireEntity", () => {
  it("returns the entity when present", () => {
    expect(requireEntity({ id: "1" }, "Customer")).toEqual({ id: "1" });
  });

  it("throws a 404 ApiError when missing", () => {
    expect(() => requireEntity(null, "Customer")).toThrow(ApiError);
    try {
      requireEntity(undefined, "Customer");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(404);
      expect((error as ApiError).message).toBe("Customer not found");
    }
  });
});

describe("deleteByIdOrThrow", () => {
  it("resolves when a row is deleted", async () => {
    const repo = { delete: async () => ({ affected: 1 }) };
    await expect(
      deleteByIdOrThrow(repo, "id", "Customer"),
    ).resolves.toBeUndefined();
  });

  it("throws a 404 ApiError when no row is deleted", async () => {
    const repo = { delete: async () => ({ affected: 0 }) };
    await expect(
      deleteByIdOrThrow(repo, "id", "Customer"),
    ).rejects.toMatchObject({ statusCode: 404, message: "Customer not found" });
  });
});
