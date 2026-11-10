import { z } from "zod";
import {
  numericSchema,
  shopifyIdSchema,
  uuidSchema,
} from "@/lib/validation/common";
import { idParamSchema } from "@/lib/validation/param.validation";

export const orderSchema = z.object({
  id: uuidSchema,
  shopifyOrderId: shopifyIdSchema,
  customerId: uuidSchema,
  totalPrice: numericSchema.nullish(),
  financialStatus: z.string().nullish(),
  fulfillmentStatus: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncedAt: z.date().nullish(),
});

// id and the timestamps are database-managed.
export const updateOrderSchema = orderSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const patchOrderSchema = z.object({
  body: updateOrderSchema,
  params: idParamSchema,
});

export type OrderInput = z.infer<typeof orderSchema>;
