import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

// Rows queued here are sent to Shopify by the sync layer's outbound flow.
// See docs/decisions/two-way-sync-webhook.md. No FK on `entityId`: it is a
// polymorphic reference, and the sync layer reads the current row at send
// time rather than storing a payload snapshot.
export const OUTBOX_ENTITIES = [
  "customers",
  "orders",
  "leads",
  "products",
  "inventory",
] as const;

export type OutboxEntityName = (typeof OUTBOX_ENTITIES)[number];

@Entity("outbox")
export class Outbox {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("enum", {
    enum: OUTBOX_ENTITIES,
    enumName: "outbox_entity",
    name: "entity",
  })
  entity!: OutboxEntityName;

  // Row id in `entity`, read at send time.
  @Column("uuid", { name: "entity_id" })
  entityId!: string;

  @Column("text")
  operation!: "create" | "update" | "delete";

  // The cron job filters on this. Defaults to "pending" since every row
  // starts unsent (not stated explicitly in the decision doc, inferred
  // from "the cron job filters on this").
  @Column("text", { default: "pending" })
  status!: "pending" | "sent" | "failed";

  // Incremented on each try. Defaults to 0, inferred the same way as
  // `status` above.
  @Column("integer", { default: 0 })
  attempts!: number;

  // Last failure detail, null on success.
  @Column("text", { name: "last_error", nullable: true })
  lastError?: string | null;

  @Column("text", { name: "idempotency_key", unique: true })
  idempotencyKey!: string;

  // Shopify ids are 64-bit; the pg driver returns `bigint` columns as
  // strings to avoid losing precision in a JS number. Nullable; needed
  // for update and delete, not create.
  @Column("bigint", { name: "shopify_id", nullable: true })
  shopifyId?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
