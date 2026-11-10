import type { NextRequest } from "next/server";
import { handleRequest } from "@/lib/api-utils";
import { listLeads } from "@/lib/services/lead.services";
import { paginationQuerySchema } from "@/lib/validation/pagination.validation";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const body = {
    ...(params.has("offset") ? { offset: params.get("offset") } : {}),
    ...(params.has("limit") ? { limit: params.get("limit") } : {}),
    ...(params.has("createdAt") ? { createdAt: params.get("createdAt") } : {}),
  };
  return handleRequest(
    async (pagination) => {
      return await listLeads(pagination);
    },
    req,
    { schema: paginationQuerySchema, body },
  );
}
