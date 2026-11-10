import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "@/lib/db/schemas/customer.schema";
import { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";
import { Lead } from "@/lib/db/schemas/lead.schema";
import { Order } from "@/lib/db/schemas/order.schema";

// CRM-only internal notes, many per record. SanaVRM is the source of
// truth. Each note attaches to exactly one CRM record.
@Entity("notes")
@Check(`num_nonnulls("lead_id", "customer_id", "order_id", "inventory_id") = 1`)
export class Note {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  body!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Index({ where: '"lead_id" IS NOT NULL' })
  @Column("uuid", { name: "lead_id", nullable: true })
  leadId?: string | null;

  @ManyToOne(() => Lead, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "lead_id" })
  lead?: Lead | null;

  @Index({ where: '"customer_id" IS NOT NULL' })
  @Column("uuid", { name: "customer_id", nullable: true })
  customerId?: string | null;

  @Index({ where: '"order_id" IS NOT NULL' })
  @Column("uuid", { name: "order_id", nullable: true })
  orderId?: string | null;

  @Index({ where: '"inventory_id" IS NOT NULL' })
  @Column("uuid", { name: "inventory_id", nullable: true })
  inventoryId?: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "customer_id" })
  customer?: Customer | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order?: Order | null;

  @ManyToOne(() => InventoryLevel, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_id" })
  inventoryLevel?: InventoryLevel | null;
}
