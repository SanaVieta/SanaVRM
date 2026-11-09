import { z } from "zod";
import {
  numericSchema,
  shopifyIdSchema,
  uuidSchema,
} from "@/lib/validation/common";

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

export type OrderInput = z.infer<typeof orderSchema>;
