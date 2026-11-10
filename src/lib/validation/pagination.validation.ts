import { z } from "zod";

export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 100;

export const CREATED_AT_SORTS = ["ASC", "DESC"] as const;
export type CreatedAtSort = (typeof CREATED_AT_SORTS)[number];
export const DEFAULT_CREATED_AT_SORT: CreatedAtSort = "DESC";

export const paginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .default(DEFAULT_PAGE_LIMIT),
  offset: z.coerce.number().int().min(0).default(0),
  createdAt: z.enum(CREATED_AT_SORTS).default(DEFAULT_CREATED_AT_SORT),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
