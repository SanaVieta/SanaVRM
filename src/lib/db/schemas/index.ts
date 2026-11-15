import { Customer } from "@/lib/db/schemas/customer.schema";
import { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";
import { Lead } from "@/lib/db/schemas/lead.schema";
import { Note } from "@/lib/db/schemas/note.schema";
import { Order } from "@/lib/db/schemas/order.schema";
import { OrderItem } from "@/lib/db/schemas/order-item.schema";
import { Outbox } from "@/lib/db/schemas/outbox.schema";
import { Product } from "@/lib/db/schemas/product.schema";

// TypeORM identifies entities by `class.name`. The production bundle shortens
// those names, and different classes can end up with the same one.
const namedEntities = [
  [Customer, "Customer"],
  [Lead, "Lead"],
  [Order, "Order"],
  [Product, "Product"],
  [InventoryLevel, "InventoryLevel"],
  [Note, "Note"],
  [OrderItem, "OrderItem"],
  [Outbox, "Outbox"],
] as const;

export function preserveEntityNames(): void {
  for (const [entity, name] of namedEntities) {
    Object.defineProperty(entity, "name", { value: name, configurable: true });
  }
}

preserveEntityNames();

export default namedEntities.map(([entity]) => entity);
