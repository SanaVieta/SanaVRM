import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/db/schemas/lead.schema";
import { uuidSchema } from "@/lib/validation/common";

export const LINK_SOURCES = ["auto_email", "manual", "unlinked"] as const;

export const leadSchema = z
  .object({
    id: uuidSchema,
    email: z.email().nullish(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    phone: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    company: z.string().nullish(),
    source: z.string().nullish(),
    status: z.enum(LEAD_STATUSES),
    tags: z.array(z.string()).nullish(),
    notes: z.string().nullish(),
    customerId: uuidSchema.nullish(),
    linkedAt: z.date().nullish(),
    linkSource: z.enum(LINK_SOURCES).nullish(),
    importBatchId: uuidSchema.nullish(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((lead) => (lead.customerId == null) === (lead.linkedAt == null), {
    message: "customerId and linkedAt must be set or cleared together",
    path: ["linkedAt"],
  });

export type LeadInput = z.infer<typeof leadSchema>;
