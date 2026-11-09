import { z } from "zod";
import { shopifyIdSchema, uuidSchema } from "@/lib/validation/common";

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

export type InventoryLevelInput = z.infer<typeof inventoryLevelSchema>;
