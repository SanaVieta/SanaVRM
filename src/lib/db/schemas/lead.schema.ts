import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Customer } from "@/lib/db/schemas/customer.schema";

// `new` -> `contacted` -> `qualified` -> `converted`, with `lost` as an
// exit from any state. `converted` is the trigger: the app sets a lead's
// status to `converted` to queue the outbound Shopify customer creation
// (see docs/decisions/two-way-sync-webhook.md), not `qualified`.
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;

export type LeadStatusName = (typeof LEAD_STATUSES)[number];

// CRM-only prospects. SanaVRM is the source of truth; a lead is not a
// Shopify entity. See docs/schema.md for the link-source state machine.
//
// `email` has a unique index in Postgres on `lower(email) where email is
// not null` for case-insensitive dedupe. TypeORM's `@Index` decorator can't
// express a functional (lower(...)) index, so that index must be created in
// a migration; the plain `unique: true` below only covers exact-match email.
@Entity("leads")
@Check(`("customer_id" IS NULL) = ("linked_at" IS NULL)`)
export class Lead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text", { unique: true, nullable: true })
  email?: string | null;

  @Column("text", { name: "first_name", nullable: true })
  firstName?: string | null;

  @Column("text", { name: "last_name", nullable: true })
  lastName?: string | null;

  @Column("text", { nullable: true })
  phone?: string | null;

  @Column("text", { nullable: true })
  city?: string | null;

  @Column("text", { nullable: true })
  state?: string | null;

  @Column("text", { nullable: true })
  company?: string | null;

  @Column("text", { nullable: true })
  source?: string | null;

  // Defaults to "new" since every lead starts there; not stated explicitly
  // in docs/schema.md, inferred from the lifecycle itself.
  @Column("enum", {
    enum: LEAD_STATUSES,
    enumName: "lead_status",
    default: "new",
  })
  status!: LeadStatusName;

  @Column("text", { array: true, nullable: true })
  tags?: string[] | null;

  @Column("text", { nullable: true })
  notes?: string | null;

  // Null until a matching Shopify customer exists for this lead. A customer
  // links to at most one lead (unique index below).
  @Index({ unique: true, where: '"customer_id" IS NOT NULL' })
  @Column("uuid", { name: "customer_id", nullable: true })
  customerId?: string | null;

  @Column("timestamptz", { name: "linked_at", nullable: true })
  linkedAt?: Date | null;

  // `auto_email` | `manual` | `unlinked`. Null = never evaluated/linked.
  @Column("text", { name: "link_source", nullable: true })
  linkSource?: string | null;

  @Column("uuid", { name: "import_batch_id", nullable: true })
  importBatchId?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne("Customer", (customer: Customer) => customer.lead, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "customer_id" })
  customer?: Customer | null;
}
