import { DataSource } from "typeorm";
import { describe, expect, it } from "vitest";
import schemas from "@/lib/db/schemas";
import { Customer } from "@/lib/db/schemas/customer.schema";
import { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";
import { Lead } from "@/lib/db/schemas/lead.schema";
import { Note } from "@/lib/db/schemas/note.schema";
import { Order } from "@/lib/db/schemas/order.schema";
import { OrderItem } from "@/lib/db/schemas/order-item.schema";
import { Outbox } from "@/lib/db/schemas/outbox.schema";
import { Product } from "@/lib/db/schemas/product.schema";

// These tests only build TypeORM's in-memory metadata (via a DataSource
// that is never connected or queried) to check column/relation mappings
// against docs/schema.md. "postgres" is required here because this
// TypeORM version only validates metadata against a real dialect; the
// connection fields are placeholders.
async function buildDataSource() {
  const dataSource = new DataSource({
    type: "postgres",
    host: "unused",
    port: 5432,
    username: "unused",
    password: "unused",
    database: "unused",
    entities: schemas,
  });
  await (
    dataSource as unknown as { buildMetadatas(): Promise<void> }
  ).buildMetadatas();
  return dataSource;
}

function findTable(dataSource: DataSource, tableName: string) {
  const metadata = dataSource.entityMetadatas.find(
    (entityMetadata) => entityMetadata.tableName === tableName,
  );
  if (!metadata) {
    throw new Error(`No entity metadata for table "${tableName}"`);
  }
  return metadata;
}

describe("db schemas", () => {
  it("registers exactly the eight implemented entities", async () => {
    const dataSource = await buildDataSource();

    expect(
      dataSource.entityMetadatas
        .map((entityMetadata) => entityMetadata.name)
        .sort(),
    ).toEqual(
      [
        "Customer",
        "Lead",
        "Order",
        "Product",
        "InventoryLevel",
        "Note",
        "OrderItem",
        "Outbox",
      ].sort(),
    );
  });

  it("maps customers to their documented table and columns", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "customers");

    expect(table.target).toBe(Customer);
    expect(table.columns.map((column) => column.databaseName)).toEqual(
      expect.arrayContaining([
        "id",
        "shopify_customer_id",
        "email",
        "first_name",
        "last_name",
        "phone",
        "tags",
        "lifetime_value",
        "created_at",
        "updated_at",
        "synced_at",
      ]),
    );
    expect(
      table.uniques.some((unique) =>
        unique.columns.some(
          (column) => column.databaseName === "shopify_customer_id",
        ),
      ),
    ).toBe(true);
  });

  it("links a lead to at most one customer, set/cleared together", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "leads");

    const customerRelation = table.relations.find(
      (relation) => relation.propertyName === "customer",
    );
    expect(customerRelation?.isOneToOne).toBe(true);
    expect(customerRelation?.onDelete).toBe("SET NULL");

    expect(
      table.indices.some(
        (index) =>
          index.isUnique &&
          index.columns.some((column) => column.databaseName === "customer_id"),
      ),
    ).toBe(true);
    expect(table.checks).toHaveLength(1);
    expect(table.checks[0]?.expression).toContain("linked_at");
  });

  it("constrains a lead's status to the documented lifecycle, defaulting to new", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "leads");

    const statusColumn = table.columns.find(
      (column) => column.propertyName === "status",
    );
    expect(statusColumn?.enum).toEqual([
      "new",
      "contacted",
      "qualified",
      "converted",
      "lost",
    ]);
    expect(statusColumn?.default).toBe("new");
  });

  it("requires every order to belong to a customer", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "orders");

    const customerRelation = table.relations.find(
      (relation) => relation.propertyName === "customer",
    );
    expect(customerRelation?.isManyToOne).toBe(true);
    expect(customerRelation?.isNullable).toBe(false);
    expect(table.target).toBe(Order);
  });

  it("indexes a product's shopify_product_id without making it unique", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "products");

    expect(
      table.uniques.some((unique) =>
        unique.columns.some(
          (column) => column.databaseName === "shopify_variant_id",
        ),
      ),
    ).toBe(true);

    expect(
      table.indices.some(
        (index) =>
          !index.isUnique &&
          index.columns.some(
            (column) => column.databaseName === "shopify_product_id",
          ),
      ),
    ).toBe(true);
    expect(table.target).toBe(Product);
  });

  it("constrains a product's status to Shopify's closed set", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "products");

    const statusColumn = table.columns.find(
      (column) => column.propertyName === "status",
    );
    expect(statusColumn?.enum).toEqual(["active", "draft", "archived"]);
    expect(statusColumn?.isNullable).toBe(true);
  });

  it("scopes an inventory level's shopify_location_id to its product", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "inventory_levels");

    const productRelation = table.relations.find(
      (relation) => relation.propertyName === "product",
    );
    expect(productRelation?.isManyToOne).toBe(true);
    expect(productRelation?.isNullable).toBe(false);
    expect(productRelation?.onDelete).toBe("CASCADE");

    expect(
      table.uniques.some(
        (unique) =>
          unique.columns.some(
            (column) => column.propertyName === "productId",
          ) &&
          unique.columns.some(
            (column) => column.databaseName === "shopify_location_id",
          ),
      ),
    ).toBe(true);
    expect(table.target).toBe(InventoryLevel);
  });

  it("exposes the inverse relations declared in docs/schema.md", async () => {
    const dataSource = await buildDataSource();

    const customers = findTable(dataSource, "customers");
    expect(
      customers.relations.some(
        (relation) => relation.propertyName === "lead" && relation.isOneToOne,
      ),
    ).toBe(true);
    expect(
      customers.relations.some(
        (relation) =>
          relation.propertyName === "orders" && relation.isOneToMany,
      ),
    ).toBe(true);

    const products = findTable(dataSource, "products");
    expect(
      products.relations.some(
        (relation) =>
          relation.propertyName === "inventoryLevels" && relation.isOneToMany,
      ),
    ).toBe(true);

    expect(Lead.name).toBe("Lead");
  });

  it("requires exactly one target on a note, each with a partial index", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "notes");

    expect(table.checks).toHaveLength(1);
    expect(table.checks[0]?.expression).toContain("num_nonnulls");

    for (const columnName of ["customer_id", "order_id", "inventory_id"]) {
      expect(
        table.indices.some((index) =>
          index.columns.some((column) => column.databaseName === columnName),
        ),
      ).toBe(true);
    }
    expect(table.target).toBe(Note);
  });

  it("restricts deleting a product referenced by an order item", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "order_items");

    const orderRelation = table.relations.find(
      (relation) => relation.propertyName === "order",
    );
    expect(orderRelation?.isNullable).toBe(false);
    expect(orderRelation?.onDelete).toBe("CASCADE");

    const productRelation = table.relations.find(
      (relation) => relation.propertyName === "product",
    );
    expect(productRelation?.isNullable).toBe(false);
    expect(productRelation?.onDelete).toBe("RESTRICT");
    expect(table.target).toBe(OrderItem);
  });

  it("constrains outbox rows to the documented entity names and a unique idempotency key", async () => {
    const dataSource = await buildDataSource();
    const table = findTable(dataSource, "outbox");

    const entityColumn = table.columns.find(
      (column) => column.propertyName === "entity",
    );
    expect(entityColumn?.enum).toEqual([
      "customers",
      "orders",
      "leads",
      "products",
      "inventory",
    ]);

    expect(
      table.uniques.some((unique) =>
        unique.columns.some(
          (column) => column.databaseName === "idempotency_key",
        ),
      ),
    ).toBe(true);
    expect(table.target).toBe(Outbox);
  });
});
