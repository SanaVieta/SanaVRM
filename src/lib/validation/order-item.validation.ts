import { z } from "zod";
import {
  numericSchema,
  shopifyIdSchema,
  uuidSchema,
} from "@/lib/validation/common";

export const orderItemSchema = z.object({
  id: uuidSchema,
  shopifyLineItemId: shopifyIdSchema,
  orderId: uuidSchema,
  productId: uuidSchema,
  shopifyVariantId: shopifyIdSchema.nullish(),
  title: z.string().nullish(),
  sku: z.string().nullish(),
  quantity: z.int().nonnegative(),
  unitPrice: numericSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  syncedAt: z.date().nullish(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
