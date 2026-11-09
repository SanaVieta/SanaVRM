import type { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { Customer } from "@/lib/db/schemas/customer.schema";
import { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";
import { Lead } from "@/lib/db/schemas/lead.schema";
import { Order } from "@/lib/db/schemas/order.schema";
import { Product } from "@/lib/db/schemas/product.schema";
import { seedData, seedDatabase } from "@/lib/db/seed";

function buildFakeDataSource() {
  const calls: { entity: unknown; rows: unknown[]; conflict: string[] }[] = [];
  const upsert = vi.fn();
  const dataSource = {
    getRepository: (entity: unknown) => ({
      upsert: async (rows: unknown[], conflict: string[]) => {
        upsert(entity);
        calls.push({ entity, rows, conflict });
      },
    }),
  } as unknown as DataSource;
  return { dataSource, calls };
}

describe("seedDatabase", () => {
  it("seeds every entity, parents before children", async () => {
    const { dataSource, calls } = buildFakeDataSource();

    await seedDatabase(dataSource);

    expect(calls.map((call) => call.entity)).toEqual([
      Customer,
      Lead,
      Product,
      Order,
      InventoryLevel,
    ]);
    for (const call of calls) {
      expect(call.rows.length).toBeGreaterThan(0);
      expect(call.conflict).toEqual(["id"]);
    }
  });

  it("only references ids that are seeded", () => {
    const customerIds = new Set(seedData.customers.map((row) => row.id));
    const productIds = new Set(seedData.products.map((row) => row.id));

    for (const order of seedData.orders) {
      expect(customerIds.has(order.customerId)).toBe(true);
    }
    for (const level of seedData.inventoryLevels) {
      expect(productIds.has(level.productId)).toBe(true);
    }
    for (const lead of seedData.leads) {
      if (lead.customerId) expect(customerIds.has(lead.customerId)).toBe(true);
    }
  });

  it("keeps lead links consistent with the table check and unique index", () => {
    const linkedCustomers = seedData.leads
      .map((lead) => lead.customerId)
      .filter(Boolean);

    expect(new Set(linkedCustomers).size).toBe(linkedCustomers.length);
    expect(linkedCustomers.length).toBeGreaterThan(0);
    for (const lead of seedData.leads) {
      expect(lead.customerId == null).toBe(lead.linkedAt == null);
    }
  });

  it("refuses to run in production", async () => {
    const { dataSource, calls } = buildFakeDataSource();
    vi.stubEnv("NODE_ENV", "production");

    await expect(seedDatabase(dataSource)).rejects.toThrow(/production/i);
    expect(calls).toHaveLength(0);

    vi.unstubAllEnvs();
  });
});
