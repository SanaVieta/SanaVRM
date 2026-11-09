import { z } from "zod";

export const uuidSchema = z.uuid();

// The pg driver returns `bigint` columns (Shopify ids) as strings.
export const shopifyIdSchema = z.string().regex(/^\d+$/);

// The pg driver returns `numeric` columns (prices) as strings.
export const numericSchema = z.string().regex(/^-?\d+(\.\d+)?$/);
