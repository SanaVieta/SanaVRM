import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "@/lib/db/schemas/order.schema";
import { Product } from "@/lib/db/schemas/product.schema";

// Shopify is the source of truth for this table; SanaVRM holds a
// read-only mirror, refreshed via the Admin API and webhooks. One row per
// Shopify order line item. `title`, `sku`, and `unit_price` are snapshots
// from purchase time, so order history stays correct if the product
// changes later. See docs/schema.md (### order_items).
@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Shopify ids are 64-bit; the pg driver returns `bigint` columns as
  // strings to avoid losing precision in a JS number.
  @Column("bigint", { name: "shopify_line_item_id", unique: true })
  shopifyLineItemId!: string;

  @Column("uuid", { name: "order_id" })
  orderId!: string;

  @Column("uuid", { name: "product_id" })
  productId!: string;

  // Kept so the row survives product deletion.
  @Column("bigint", { name: "shopify_variant_id", nullable: true })
  shopifyVariantId?: string | null;

  // Snapshot at purchase time.
  @Column("text", { nullable: true })
  title?: string | null;

  // Snapshot at purchase time.
  @Column("text", { nullable: true })
  sku?: string | null;

  @Column("integer")
  quantity!: number;

  // Snapshot at purchase time. The pg driver returns `numeric` columns as
  // strings to avoid losing precision in a JS number.
  @Column("numeric", { name: "unit_price" })
  unitPrice!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column("timestamptz", { name: "synced_at", nullable: true })
  syncedAt?: Date | null;

  // A line item belongs to exactly one order.
  @ManyToOne(() => Order, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order!: Order;

  // A product row referenced by an order item cannot be deleted (mark it
  // `status = 'archived'` instead).
  @ManyToOne(() => Product, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" })
  product!: Product;
}
