import { z } from "zod";
import {
  numericSchema,
  shopifyIdSchema,
  uuidSchema,
} from "@/lib/validation/common";
import { idParamSchema } from "@/lib/validation/param.validation";

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
  syncedAt: z.coerce.date().nullish(),
});

// id and the timestamps are database-managed.
export const updateCustomerSchema = customerSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const patchCustomerSchema = z.object({
  body: updateCustomerSchema,
  params: idParamSchema,
});

export type CustomerInput = z.infer<typeof customerSchema>;
