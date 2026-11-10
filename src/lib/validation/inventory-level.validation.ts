import { z } from "zod";
import { shopifyIdSchema, uuidSchema } from "@/lib/validation/common";
import { idParamSchema } from "@/lib/validation/param.validation";

export const inventoryLevelSchema = z.object({
  id: uuidSchema,
  productId: uuidSchema,
  shopifyInventoryItemId: shopifyIdSchema,
  shopifyLocationId: shopifyIdSchema,
  locationName: z.string().nullish(),
  // Shopify `available` can go negative when oversold.
  available: z.int(),
  onHand: z.int(),
  committed: z.int(),
  lowStockThreshold: z.int().nonnegative().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncedAt: z.date().nullish(),
});

// id and the timestamps are database-managed.
export const updateInventoryLevelSchema = inventoryLevelSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const patchInventoryLevelSchema = z.object({
  body: updateInventoryLevelSchema,
  params: idParamSchema,
});

export type InventoryLevelInput = z.infer<typeof inventoryLevelSchema>;
