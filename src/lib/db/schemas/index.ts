import { Customer } from "@/lib/db/schemas/customer.schema";
import { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";
import { Lead } from "@/lib/db/schemas/lead.schema";
import { Note } from "@/lib/db/schemas/note.schema";
import { Order } from "@/lib/db/schemas/order.schema";
import { OrderItem } from "@/lib/db/schemas/order-item.schema";
import { Outbox } from "@/lib/db/schemas/outbox.schema";
import { Product } from "@/lib/db/schemas/product.schema";

export default [
  Customer,
  Lead,
  Order,
  Product,
  InventoryLevel,
  Note,
  OrderItem,
  Outbox,
];
