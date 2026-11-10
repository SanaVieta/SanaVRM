import { z } from "zod";
import { PRODUCT_STATUSES } from "@/lib/db/schemas/product.schema";
import {
  numericSchema,
  shopifyIdSchema,
  uuidSchema,
} from "@/lib/validation/common";
import { idParamSchema } from "@/lib/validation/param.validation";

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
  syncedAt: z.coerce.date().nullish(),
});

// id and the timestamps are database-managed.
export const updateProductSchema = productSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const patchProductSchema = z.object({
  body: updateProductSchema,
  params: idParamSchema,
});

export type ProductInput = z.infer<typeof productSchema>;
