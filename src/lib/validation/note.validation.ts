import { z } from "zod";
import { uuidSchema } from "@/lib/validation/common";

export const noteSchema = z
  .object({
    id: uuidSchema,
    body: z.string().min(1),
    customerId: uuidSchema.nullish(),
    orderId: uuidSchema.nullish(),
    inventoryId: uuidSchema.nullish(),
    createdAt: z.date(),
  })
  // Mirrors the DB check: num_nonnulls(customer_id, order_id, inventory_id) = 1.
  .refine(
    (note) =>
      [note.customerId, note.orderId, note.inventoryId].filter(
        (target) => target != null,
      ).length === 1,
    {
      message:
        "A note must attach to exactly one of customer, order, or inventory",
      path: ["customerId"],
    },
  );

export type NoteInput = z.infer<typeof noteSchema>;
