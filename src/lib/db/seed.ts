import type { DataSource } from "typeorm";
import { Customer } from "@/lib/db/schemas/customer.schema";
import { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";
import { Lead } from "@/lib/db/schemas/lead.schema";
import { Order } from "@/lib/db/schemas/order.schema";
import { Product } from "@/lib/db/schemas/product.schema";

// Fictional development data only (example.com addresses, 555 numbers).
// Fixed ids make the seed idempotent (rows are upserted by primary key)
// and let rows reference each other without a lookup.
const id = (kind: string, n: number) =>
  `${kind}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const customerIds = [id("c", 1), id("c", 2), id("c", 3)];
const productIds = [id("a", 1), id("a", 2), id("a", 3)];

const customers: (Partial<Customer> & { id: string })[] = [
  {
    id: customerIds[0],
    shopifyCustomerId: "9000000001",
    email: "ada.lovelace@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    phone: "555-0101",
    tags: ["vip"],
    lifetimeValue: "184.50",
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    id: customerIds[1],
    shopifyCustomerId: "9000000002",
    email: "grace.hopper@example.com",
    firstName: "Grace",
    lastName: "Hopper",
    phone: "555-0102",
    tags: [],
    lifetimeValue: "59.00",
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    id: customerIds[2],
    shopifyCustomerId: "9000000003",
    email: "alan.turing@example.com",
    firstName: "Alan",
    lastName: "Turing",
    phone: null,
    tags: null,
    lifetimeValue: "0",
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
];

const leads: (Partial<Lead> & { id: string })[] = [
  {
    // Linked to Ada by email: customer_id and linked_at are set together.
    id: id("1", 1),
    email: "ada.lovelace@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    phone: "555-0101",
    city: "London",
    state: "UK",
    source: "csv:2026-11-campaign",
    status: "qualified",
    tags: ["campaign"],
    customerId: customerIds[0],
    linkedAt: new Date("2026-11-02T09:00:00Z"),
    linkSource: "auto_email",
  },
  {
    id: id("1", 2),
    email: "katherine.johnson@example.com",
    firstName: "Katherine",
    lastName: "Johnson",
    phone: "555-0201",
    city: "Hampton",
    state: "VA",
    source: "webinar",
    status: "contacted",
    notes: "Asked about bulk pricing.",
  },
  {
    id: id("1", 3),
    email: null,
    firstName: "Linus",
    lastName: "Walker",
    phone: "555-0202",
    city: "Austin",
    state: "TX",
    source: "manual",
    status: "new",
  },
];

const products: (Partial<Product> & { id: string })[] = [
  {
    id: productIds[0],
    shopifyProductId: "8000000001",
    shopifyVariantId: "8100000001",
    title: "Sample Tonic - 30 ml",
    vendor: "SanaVieta",
    productType: "Tonic",
    status: "active",
    imageUrl: "https://example.com/images/sample-tonic.png",
    sku: "SAMPLE-TONIC-30",
    price: "24.00",
    tracksInventory: true,
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    // Second variant of the same Shopify product.
    id: productIds[1],
    shopifyProductId: "8000000001",
    shopifyVariantId: "8100000002",
    title: "Sample Tonic - 60 ml",
    vendor: "SanaVieta",
    productType: "Tonic",
    status: "active",
    imageUrl: "https://example.com/images/sample-tonic.png",
    sku: "SAMPLE-TONIC-60",
    price: "42.00",
    tracksInventory: true,
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    id: productIds[2],
    shopifyProductId: "8000000002",
    shopifyVariantId: "8100000003",
    title: "Sample Balm",
    vendor: "SanaVieta",
    productType: "Balm",
    status: "draft",
    imageUrl: null,
    sku: "SAMPLE-BALM",
    price: "18.50",
    tracksInventory: false,
    notes: "Not launched yet.",
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
];

const orders: (Partial<Order> & { id: string; customerId: string })[] = [
  {
    id: id("b", 1),
    shopifyOrderId: "7000000001",
    customerId: customerIds[0],
    totalPrice: "66.00",
    financialStatus: "paid",
    fulfillmentStatus: "fulfilled",
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    id: id("b", 2),
    shopifyOrderId: "7000000002",
    customerId: customerIds[0],
    totalPrice: "118.50",
    financialStatus: "partially_refunded",
    fulfillmentStatus: "fulfilled",
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    id: id("b", 3),
    shopifyOrderId: "7000000003",
    customerId: customerIds[1],
    totalPrice: "59.00",
    financialStatus: "pending",
    fulfillmentStatus: null,
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
];

const inventoryLevels: (Partial<InventoryLevel> & {
  id: string;
  productId: string;
})[] = [
  {
    id: id("d", 1),
    productId: productIds[0],
    shopifyInventoryItemId: "6000000001",
    shopifyLocationId: "5000000001",
    locationName: "Main warehouse",
    available: 120,
    onHand: 130,
    committed: 10,
    lowStockThreshold: 25,
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    id: id("d", 2),
    productId: productIds[1],
    shopifyInventoryItemId: "6000000002",
    shopifyLocationId: "5000000001",
    locationName: "Main warehouse",
    available: 8,
    onHand: 8,
    committed: 0,
    lowStockThreshold: 15,
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
  {
    id: id("d", 3),
    productId: productIds[1],
    shopifyInventoryItemId: "6000000002",
    shopifyLocationId: "5000000002",
    locationName: "Retail store",
    available: 14,
    onHand: 14,
    committed: 0,
    syncedAt: new Date("2026-11-01T12:00:00Z"),
  },
];

export const seedData = {
  customers,
  leads,
  products,
  orders,
  inventoryLevels,
};

// Inserts the rows above, parents before children. Safe to re-run: rows
// are upserted by id. The tables must already exist (run migrations first).
export async function seedDatabase(dataSource: DataSource) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed the database in production.");
  }

  await dataSource.getRepository(Customer).upsert(seedData.customers, ["id"]);
  await dataSource.getRepository(Lead).upsert(seedData.leads, ["id"]);
  await dataSource.getRepository(Product).upsert(seedData.products, ["id"]);
  await dataSource.getRepository(Order).upsert(seedData.orders, ["id"]);
  await dataSource
    .getRepository(InventoryLevel)
    .upsert(seedData.inventoryLevels, ["id"]);
}
