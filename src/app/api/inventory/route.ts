import type { NextRequest } from "next/server";
import { handleRequest } from "@/lib/api-utils";
import { listInventoryLevels } from "@/lib/services/inventory-level.services";
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
      return await listInventoryLevels(pagination);
    },
    req,
    { schema: paginationQuerySchema, body },
  );
}
