import { z } from "zod";
import { PRODUCT_STATUSES } from "@/lib/db/schemas/product.schema";
import {
  numericSchema,
  shopifyIdSchema,
  uuidSchema,
} from "@/lib/validation/common";

export const productSchema = z.object({
  id: uuidSchema,
  shopifyProductId: shopifyIdSchema,
  shopifyVariantId: shopifyIdSchema,
  title: z.string().nullish(),
  vendor: z.string().nullish(),
  productType: z.string().nullish(),
  status: z.enum(PRODUCT_STATUSES).nullish(),
  imageUrl: z.url().nullish(),
  sku: z.string().nullish(),
  price: numericSchema.nullish(),
  tracksInventory: z.boolean().nullish(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncedAt: z.date().nullish(),
});

export type ProductInput = z.infer<typeof productSchema>;
