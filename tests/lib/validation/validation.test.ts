import { describe, expect, it } from "vitest";
import {
  customerSchema,
  updateCustomerSchema,
} from "@/lib/validation/customer.validation";
import {
  inventoryLevelSchema,
  updateInventoryLevelSchema,
} from "@/lib/validation/inventory-level.validation";
import { leadSchema, updateLeadSchema } from "@/lib/validation/lead.validation";
import { noteSchema } from "@/lib/validation/note.validation";
import {
  orderSchema,
  updateOrderSchema,
} from "@/lib/validation/order.validation";
import { orderItemSchema } from "@/lib/validation/order-item.validation";
import {
  outboxSchema,
  updateOutboxSchema,
} from "@/lib/validation/outbox.validation";
import { idParamSchema } from "@/lib/validation/param.validation";
import {
  productSchema,
  updateProductSchema,
} from "@/lib/validation/product.validation";

const id = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";
const otherId = "7a1c9e2d-5b3f-4a8c-9d0e-2f3a4b5c6d7e";
const now = new Date();
const timestamps = { createdAt: now, updatedAt: now };

describe("customerSchema", () => {
  const customer = { id, shopifyCustomerId: "123", ...timestamps };

  it("accepts a minimal customer and nullable fields", () => {
    expect(customerSchema.safeParse(customer).success).toBe(true);
    expect(
      customerSchema.safeParse({
        ...customer,
        email: null,
        tags: ["vip"],
        lifetimeValue: "120.50",
        syncedAt: null,
      }).success,
    ).toBe(true);
  });

  it("rejects a bad shopify id, email, and lifetime value", () => {
    for (const bad of [
      { shopifyCustomerId: "abc" },
      { email: "nope" },
      { lifetimeValue: "12,5" },
    ]) {
      expect(customerSchema.safeParse({ ...customer, ...bad }).success).toBe(
        false,
      );
    }
  });
});

describe("updateCustomerSchema", () => {
  it("makes every field optional and strips database-managed ones", () => {
    expect(updateCustomerSchema.safeParse({}).success).toBe(true);
    expect(
      updateCustomerSchema.parse({
        id: otherId,
        createdAt: now,
        updatedAt: now,
        tags: ["vip"],
      }),
    ).toEqual({ tags: ["vip"] });
  });

  it("still validates the fields it keeps", () => {
    expect(
      updateCustomerSchema.safeParse({ shopifyCustomerId: "abc" }).success,
    ).toBe(false);
  });

  it("accepts syncedAt as a JSON date string", () => {
    const parsed = updateCustomerSchema.parse({
      syncedAt: now.toISOString(),
    });

    expect(parsed.syncedAt).toEqual(now);
  });
});

describe("leadSchema", () => {
  const lead = { id, status: "new", ...timestamps };

  it("accepts an unlinked lead", () => {
    expect(leadSchema.safeParse(lead).success).toBe(true);
  });

  it("requires customerId and linkedAt together", () => {
    expect(
      leadSchema.safeParse({ ...lead, customerId: otherId, linkedAt: now })
        .success,
    ).toBe(true);
    expect(leadSchema.safeParse({ ...lead, customerId: otherId }).success).toBe(
      false,
    );
    expect(leadSchema.safeParse({ ...lead, linkedAt: now }).success).toBe(
      false,
    );
  });

  it("rejects unknown status and link source", () => {
    expect(leadSchema.safeParse({ ...lead, status: "won" }).success).toBe(
      false,
    );
    expect(leadSchema.safeParse({ ...lead, linkSource: "csv" }).success).toBe(
      false,
    );
    expect(
      leadSchema.safeParse({ ...lead, linkSource: "manual" }).success,
    ).toBe(true);
  });
});

describe("updateLeadSchema", () => {
  it("makes every field optional", () => {
    expect(updateLeadSchema.safeParse({}).success).toBe(true);
    expect(updateLeadSchema.safeParse({ status: "new" }).success).toBe(true);
  });

  it("strips the database-managed id, createdAt, and updatedAt", () => {
    const parsed = updateLeadSchema.parse({
      id: otherId,
      createdAt: now,
      updatedAt: now,
      city: "Austin",
    });

    expect(parsed).toEqual({ city: "Austin" });
  });

  it("still validates the fields it keeps", () => {
    expect(updateLeadSchema.safeParse({ status: "won" }).success).toBe(false);
    expect(updateLeadSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("accepts linkedAt as a JSON date string", () => {
    const parsed = updateLeadSchema.parse({
      customerId: otherId,
      linkedAt: now.toISOString(),
    });

    expect(parsed.linkedAt).toEqual(now);
  });
});

describe("orderSchema", () => {
  const order = {
    id,
    shopifyOrderId: "9007199254740993",
    customerId: otherId,
    ...timestamps,
  };

  it("accepts a 64-bit shopify id and numeric total", () => {
    expect(
      orderSchema.safeParse({ ...order, totalPrice: "19.99" }).success,
    ).toBe(true);
  });

  it("requires a customer", () => {
    const { customerId: _customerId, ...withoutCustomer } = order;
    expect(orderSchema.safeParse(withoutCustomer).success).toBe(false);
  });
});

describe("updateOrderSchema", () => {
  it("makes every field optional and strips database-managed ones", () => {
    expect(updateOrderSchema.safeParse({}).success).toBe(true);
    expect(
      updateOrderSchema.parse({
        id: otherId,
        createdAt: now,
        updatedAt: now,
        financialStatus: "paid",
      }),
    ).toEqual({ financialStatus: "paid" });
  });

  it("still validates the fields it keeps", () => {
    expect(updateOrderSchema.safeParse({ customerId: "123" }).success).toBe(
      false,
    );
  });

  it("accepts syncedAt as a JSON date string", () => {
    expect(
      updateOrderSchema.parse({ syncedAt: now.toISOString() }).syncedAt,
    ).toEqual(now);
  });
});

describe("orderItemSchema", () => {
  const item = {
    id,
    shopifyLineItemId: "1",
    orderId: otherId,
    productId: id,
    quantity: 2,
    unitPrice: "9.99",
    ...timestamps,
  };

  it("accepts a valid line item", () => {
    expect(orderItemSchema.safeParse(item).success).toBe(true);
  });

  it("rejects fractional or negative quantity and a missing price", () => {
    expect(orderItemSchema.safeParse({ ...item, quantity: 1.5 }).success).toBe(
      false,
    );
    expect(orderItemSchema.safeParse({ ...item, quantity: -1 }).success).toBe(
      false,
    );
    const { unitPrice: _unitPrice, ...withoutPrice } = item;
    expect(orderItemSchema.safeParse(withoutPrice).success).toBe(false);
  });
});

describe("productSchema", () => {
  const product = {
    id,
    shopifyProductId: "1",
    shopifyVariantId: "2",
    ...timestamps,
  };

  it("accepts each product status", () => {
    for (const status of ["active", "draft", "archived"]) {
      expect(productSchema.safeParse({ ...product, status }).success).toBe(
        true,
      );
    }
  });

  it("rejects unknown status and invalid image url", () => {
    expect(
      productSchema.safeParse({ ...product, status: "deleted" }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({ ...product, imageUrl: "not a url" }).success,
    ).toBe(false);
  });
});

describe("updateProductSchema", () => {
  it("makes every field optional and strips database-managed ones", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(true);
    expect(
      updateProductSchema.parse({
        id: otherId,
        createdAt: now,
        updatedAt: now,
        notes: "restock soon",
      }),
    ).toEqual({ notes: "restock soon" });
  });

  it("still validates the fields it keeps", () => {
    expect(updateProductSchema.safeParse({ status: "deleted" }).success).toBe(
      false,
    );
  });

  it("accepts syncedAt as a JSON date string", () => {
    expect(
      updateProductSchema.parse({ syncedAt: now.toISOString() }).syncedAt,
    ).toEqual(now);
  });
});

describe("inventoryLevelSchema", () => {
  const level = {
    id,
    productId: otherId,
    shopifyInventoryItemId: "1",
    shopifyLocationId: "2",
    available: 5,
    onHand: 6,
    committed: 1,
    ...timestamps,
  };

  it("accepts negative available and an optional threshold", () => {
    expect(
      inventoryLevelSchema.safeParse({ ...level, available: -2 }).success,
    ).toBe(true);
    expect(
      inventoryLevelSchema.safeParse({ ...level, lowStockThreshold: 3 })
        .success,
    ).toBe(true);
  });

  it("rejects fractional quantities and negative threshold", () => {
    expect(
      inventoryLevelSchema.safeParse({ ...level, onHand: 1.5 }).success,
    ).toBe(false);
    expect(
      inventoryLevelSchema.safeParse({ ...level, lowStockThreshold: -1 })
        .success,
    ).toBe(false);
  });
});

describe("updateInventoryLevelSchema", () => {
  it("makes every field optional and strips database-managed ones", () => {
    expect(updateInventoryLevelSchema.safeParse({}).success).toBe(true);
    expect(
      updateInventoryLevelSchema.parse({
        id: otherId,
        createdAt: now,
        updatedAt: now,
        lowStockThreshold: 5,
      }),
    ).toEqual({ lowStockThreshold: 5 });
  });

  it("still validates the fields it keeps", () => {
    expect(updateInventoryLevelSchema.safeParse({ onHand: 1.5 }).success).toBe(
      false,
    );
  });

  it("accepts syncedAt as a JSON date string", () => {
    expect(
      updateInventoryLevelSchema.parse({ syncedAt: now.toISOString() })
        .syncedAt,
    ).toEqual(now);
  });
});

describe("noteSchema", () => {
  const note = { id, body: "Called back", createdAt: now };

  it("accepts exactly one target", () => {
    for (const target of ["customerId", "orderId", "inventoryId"]) {
      expect(noteSchema.safeParse({ ...note, [target]: otherId }).success).toBe(
        true,
      );
    }
  });

  it("rejects zero or multiple targets and an empty body", () => {
    expect(noteSchema.safeParse(note).success).toBe(false);
    expect(
      noteSchema.safeParse({ ...note, customerId: otherId, orderId: id })
        .success,
    ).toBe(false);
    expect(
      noteSchema.safeParse({ ...note, customerId: otherId, body: "" }).success,
    ).toBe(false);
  });
});

describe("outboxSchema", () => {
  const row = {
    id,
    entity: "leads",
    entityId: otherId,
    operation: "create",
    status: "pending",
    attempts: 0,
    idempotencyKey: "lead-1-create",
    createdAt: now,
  };

  it("accepts a pending row and an optional shopify id", () => {
    expect(outboxSchema.safeParse(row).success).toBe(true);
    expect(
      outboxSchema.safeParse({ ...row, shopifyId: "42", lastError: null })
        .success,
    ).toBe(true);
  });

  it("rejects unknown enums, negative attempts, and an empty key", () => {
    for (const bad of [
      { entity: "notes" },
      { operation: "upsert" },
      { status: "queued" },
      { attempts: -1 },
      { idempotencyKey: "" },
    ]) {
      expect(outboxSchema.safeParse({ ...row, ...bad }).success).toBe(false);
    }
  });
});

describe("updateOutboxSchema", () => {
  it("makes every field optional and strips database-managed ones", () => {
    expect(updateOutboxSchema.safeParse({}).success).toBe(true);
    expect(
      updateOutboxSchema.parse({
        id: otherId,
        createdAt: now,
        status: "sent",
      }),
    ).toEqual({ status: "sent" });
  });

  it("still validates the fields it keeps", () => {
    expect(updateOutboxSchema.safeParse({ status: "queued" }).success).toBe(
      false,
    );
  });
});

describe("idParamSchema", () => {
  it("accepts a uuid id", () => {
    expect(idParamSchema.parse({ id })).toEqual({ id });
  });

  it("rejects a missing or non-uuid id", () => {
    expect(idParamSchema.safeParse({}).success).toBe(false);
    expect(idParamSchema.safeParse({ id: "123" }).success).toBe(false);
    expect(idParamSchema.safeParse({ id: ["a", "b"] }).success).toBe(false);
  });
});
