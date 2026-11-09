import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import type { Product } from "@/lib/db/schemas/product.schema";

// Stock for a product variant, per Shopify location. Shopify is the source
// of truth for the quantity columns; only `low_stock_threshold` is
// CRM-only. See docs/schema.md.
@Entity("inventory_levels")
@Unique(["productId", "shopifyLocationId"])
export class InventoryLevel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { name: "product_id" })
  productId!: string;

  // Shopify ids are 64-bit; the pg driver returns `bigint` columns as
  // strings to avoid losing precision in a JS number.
  @Column("bigint", { name: "shopify_inventory_item_id" })
  shopifyInventoryItemId!: string;

  @Column("bigint", { name: "shopify_location_id" })
  shopifyLocationId!: string;

  // Cached label for the CRM UI.
  @Column("text", { name: "location_name", nullable: true })
  locationName?: string | null;

  // Sellable quantity (Shopify `available`).
  @Column("integer")
  available!: number;

  // Physical count (Shopify `on_hand`).
  @Column("integer", { name: "on_hand" })
  onHand!: number;

  // Reserved for orders (Shopify `committed`).
  @Column("integer")
  committed!: number;

  // CRM alert threshold (optional).
  @Column("integer", { name: "low_stock_threshold", nullable: true })
  lowStockThreshold?: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column("timestamptz", { name: "synced_at", nullable: true })
  syncedAt?: Date | null;

  @ManyToOne("Product", (product: Product) => product.inventoryLevels, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "product_id" })
  product!: Product;
}
