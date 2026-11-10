import { ApiError } from "next/dist/server/api-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from "@/lib/services/customer.services";

const id = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";

const repo = vi.hoisted(() => ({
  find: vi.fn(),
  findAndCount: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  merge: vi.fn(),
  delete: vi.fn(),
}));

const getDbMock = vi.hoisted(() =>
  vi.fn(async () => ({
    getRepository: vi.fn(() => repo),
  })),
);

vi.mock("@/lib/db/getDB", () => ({ getDb: getDbMock }));

describe("customer services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.create.mockImplementation((input) => ({ id, ...input }));
    repo.save.mockImplementation(async (entity) => entity);
    repo.merge.mockImplementation((target, input) =>
      Object.assign(target, input),
    );
  });

  it("lists customers with pagination metadata", async () => {
    const rows = [{ id, shopifyCustomerId: "1" }];
    repo.findAndCount.mockResolvedValue([rows, 1]);

    await expect(listCustomers({ limit: 10, offset: 0 })).resolves.toEqual({
      data: rows,
      total: 1,
      limit: 10,
      offset: 0,
    });
    expect(repo.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: "DESC" },
      skip: 0,
      take: 10,
    });
  });

  it("returns a customer by id", async () => {
    const row = { id, shopifyCustomerId: "1" };
    repo.findOne.mockResolvedValue(row);

    await expect(getCustomerById(id)).resolves.toEqual(row);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id } });
  });

  it("throws 404 when a customer is missing", async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(getCustomerById(id)).rejects.toMatchObject({
      statusCode: 404,
      message: "Customer not found",
    });
  });

  it("creates a customer", async () => {
    const input = { shopifyCustomerId: "99" };

    await expect(createCustomer(input)).resolves.toMatchObject({
      id,
      shopifyCustomerId: "99",
    });
    expect(repo.create).toHaveBeenCalledWith(input);
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it("updates a customer", async () => {
    const existing = { id, shopifyCustomerId: "1", tags: null };
    repo.findOne.mockResolvedValue(existing);

    await expect(updateCustomer(id, { tags: ["vip"] })).resolves.toMatchObject({
      id,
      tags: ["vip"],
    });
    expect(repo.merge).toHaveBeenCalledWith(existing, { tags: ["vip"] });
  });

  it("throws 404 when updating a missing customer", async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(updateCustomer(id, { tags: ["vip"] })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("deletes a customer", async () => {
    repo.delete.mockResolvedValue({ affected: 1 });

    await expect(deleteCustomer(id)).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith(id);
  });

  it("throws 404 when deleting a missing customer", async () => {
    repo.delete.mockResolvedValue({ affected: 0 });

    await expect(deleteCustomer(id)).rejects.toMatchObject({
      statusCode: 404,
      message: "Customer not found",
    });
  });
});
