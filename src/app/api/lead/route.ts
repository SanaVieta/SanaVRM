import { ApiError } from "next/dist/server/api-utils";
import type { NextRequest } from "next/server";
import { handleRequest } from "@/lib/api-utils";
import { listLeads } from "@/lib/services/lead.services";
import {
  type CreatedAtSort,
  paginationQuerySchema,
} from "@/lib/validation/pagination.validation";

export async function GET(req: NextRequest) {
  // offset, limit, createdAtSort
  const params = req.nextUrl.searchParams;

  const body = {
    offset: params.get("offset")
      ? parseInt(params.get("offset") ?? "0", 10)
      : 0,
    limit: params.get("limit") ? parseInt(params.get("limit") ?? "10", 10) : 10,
    createdAtSort: params.get("createdAtSort") as CreatedAtSort | undefined,
  };
  return handleRequest(
    async (pagination) => {
      const leads = await listLeads(pagination);
      if (leads.data.length === 0) {
        throw new ApiError(404, "Leads not found");
      }
      return leads;
    },
    req,
    { schema: paginationQuerySchema, body },
  );
}
