import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";

// Shopify's own closed set for product status (docs/schema.md).
export const PRODUCT_STATUSES = ["active", "draft", "archived"] as const;

export type ProductStatusName = (typeof PRODUCT_STATUSES)[number];

// Shopify is the source of truth for this table; SanaVRM holds a read-only
// mirror, refreshed via the Admin API and webhooks (only `notes` is
// written locally). Each row is one variant (Shopify's sellable SKU);
// inventory lives in `inventory_levels`, not here. See docs/schema.md.
@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Shared by every variant row of the same Shopify product; not unique on
  // its own. Indexed so a variant can be resolved to its product quickly
  // during sync.
  @Index()
  @Column("bigint", { name: "shopify_product_id" })
  shopifyProductId!: string;

  // Shopify ids are 64-bit; the pg driver returns `bigint` columns as
  // strings to avoid losing precision in a JS number.
  @Column("bigint", { name: "shopify_variant_id", unique: true })
  shopifyVariantId!: string;

  @Column("text", { nullable: true })
  title?: string | null;

  // Repeated on every variant row of the product.
  @Column("text", { nullable: true })
  vendor?: string | null;

  @Column("text", { name: "product_type", nullable: true })
  productType?: string | null;

  @Column("enum", {
    enum: PRODUCT_STATUSES,
    enumName: "product_status",
    nullable: true,
  })
  status?: ProductStatusName | null;

  // Variant image, falling back to the product's featured image; null if
  // neither exists.
  @Column("text", { name: "image_url", nullable: true })
  imageUrl?: string | null;

  @Column("text", { nullable: true })
  sku?: string | null;

  // The pg driver returns `numeric` columns as strings to avoid losing
  // precision in a JS number.
  @Column("numeric", { nullable: true })
  price?: string | null;

  @Column("boolean", { name: "tracks_inventory", nullable: true })
  tracksInventory?: boolean | null;

  // CRM-only.
  @Column("text", { nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column("timestamptz", { name: "synced_at", nullable: true })
  syncedAt?: Date | null;

  @OneToMany(
    "InventoryLevel",
    (inventoryLevel: InventoryLevel) => inventoryLevel.product,
  )
  inventoryLevels?: InventoryLevel[];
}
