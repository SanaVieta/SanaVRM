import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Lead } from "@/lib/db/schemas/lead.schema";
import type { Order } from "@/lib/db/schemas/order.schema";

// Shopify is the source of truth for this table. SanaVRM holds a read-only
// mirror of these columns, refreshed via the Admin API and webhooks; only
// `tags` and `lifetime_value` are written locally. See docs/schema.md.
@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Shopify ids are 64-bit; the pg driver returns `bigint` columns as
  // strings to avoid losing precision in a JS number.
  @Column("bigint", { name: "shopify_customer_id", unique: true })
  shopifyCustomerId!: string;

  @Column("text", { nullable: true })
  email?: string | null;

  @Column("text", { name: "first_name", nullable: true })
  firstName?: string | null;

  @Column("text", { name: "last_name", nullable: true })
  lastName?: string | null;

  @Column("text", { nullable: true })
  phone?: string | null;

  // CRM-only, not synced to Shopify.
  @Column("text", { array: true, nullable: true })
  tags?: string[] | null;

  // CRM cache derived from orders. The pg driver returns `numeric` columns
  // as strings to avoid losing precision in a JS number.
  @Column("numeric", { name: "lifetime_value", nullable: true })
  lifetimeValue?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // Null until the first successful Shopify sync.
  @Column("timestamptz", { name: "synced_at", nullable: true })
  syncedAt?: Date | null;

  @OneToOne("Lead", (lead: Lead) => lead.customer)
  lead?: Lead | null;

  @OneToMany("Order", (order: Order) => order.customer)
  orders?: Order[];
}
