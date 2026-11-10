import { z } from "zod";
import { LEAD_STATUSES } from "@/lib/db/schemas/lead.schema";
import { uuidSchema } from "@/lib/validation/common";
import { idParamSchema } from "@/lib/validation/param.validation";

export const LINK_SOURCES = ["auto_email", "manual", "unlinked"] as const;

const leadBaseSchema = z.object({
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
  linkedAt: z.coerce.date().nullish(),
  linkSource: z.enum(LINK_SOURCES).nullish(),
  importBatchId: uuidSchema.nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const leadSchema = leadBaseSchema.refine(
  (lead) => (lead.customerId == null) === (lead.linkedAt == null),
  {
    message: "customerId and linkedAt must be set or cleared together",
    path: ["linkedAt"],
  },
);

// id and the timestamps are database-managed. The customerId/linkedAt pairing
// cannot be a refinement on a partial, so updateLead re-checks it.
export const updateLeadSchema = leadBaseSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const patchLeadSchema = z.object({
  body: updateLeadSchema,
  params: idParamSchema,
});

export const createLeadSchema = leadBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LeadInput = z.infer<typeof leadSchema>;
