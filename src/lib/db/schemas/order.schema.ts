import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Customer } from "@/lib/db/schemas/customer.schema";

// Shopify is the source of truth for this table; SanaVRM holds a read-only
// mirror, refreshed via the Admin API and webhooks. See docs/schema.md.
// Line items (order_items) are implemented separately.
@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Shopify ids are 64-bit; the pg driver returns `bigint` columns as
  // strings to avoid losing precision in a JS number.
  @Column("bigint", { name: "shopify_order_id", unique: true })
  shopifyOrderId!: string;

  @Column("uuid", { name: "customer_id" })
  customerId!: string;

  // The pg driver returns `numeric` columns as strings to avoid losing
  // precision in a JS number.
  @Column("numeric", { name: "total_price", nullable: true })
  totalPrice?: string | null;

  @Column("text", { name: "financial_status", nullable: true })
  financialStatus?: string | null;

  @Column("text", { name: "fulfillment_status", nullable: true })
  fulfillmentStatus?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column("timestamptz", { name: "synced_at", nullable: true })
  syncedAt?: Date | null;

  @ManyToOne("Customer", (customer: Customer) => customer.orders, {
    nullable: false,
  })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;
}
