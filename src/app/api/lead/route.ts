import type { NextRequest } from "next/server";
import { handleRequest } from "@/lib/api-utils";
import { listLeads } from "@/lib/services/lead.services";
import { paginationQuerySchema } from "@/lib/validation/pagination.validation";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const createdAt = params.get("createdAt");

  const body = {
    offset: params.get("offset")
      ? parseInt(params.get("offset") ?? "0", 10)
      : 0,
    limit: params.get("limit") ? parseInt(params.get("limit") ?? "10", 10) : 10,
    ...(createdAt ? { createdAt } : {}),
  };
  return handleRequest(
    async (pagination) => {
      return await listLeads(pagination);
    },
    req,
    { schema: paginationQuerySchema, body },
  );
}
