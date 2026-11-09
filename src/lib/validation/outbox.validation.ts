import { z } from "zod";
import { OUTBOX_ENTITIES } from "@/lib/db/schemas/outbox.schema";
import { shopifyIdSchema, uuidSchema } from "@/lib/validation/common";

export const OUTBOX_OPERATIONS = ["create", "update", "delete"] as const;
export const OUTBOX_STATUSES = ["pending", "sent", "failed"] as const;

export const outboxSchema = z.object({
  id: uuidSchema,
  entity: z.enum(OUTBOX_ENTITIES),
  entityId: uuidSchema,
  operation: z.enum(OUTBOX_OPERATIONS),
  status: z.enum(OUTBOX_STATUSES),
  attempts: z.int().nonnegative(),
  lastError: z.string().nullish(),
  idempotencyKey: z.string().min(1),
  // Needed for update and delete, not create.
  shopifyId: shopifyIdSchema.nullish(),
  createdAt: z.date(),
});

export type OutboxInput = z.infer<typeof outboxSchema>;
