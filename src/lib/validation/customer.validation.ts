import { z } from "zod";
import {
  numericSchema,
  shopifyIdSchema,
  uuidSchema,
} from "@/lib/validation/common";

export const customerSchema = z.object({
  id: uuidSchema,
  shopifyCustomerId: shopifyIdSchema,
  email: z.email().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  phone: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  lifetimeValue: numericSchema.nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncedAt: z.date().nullish(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
