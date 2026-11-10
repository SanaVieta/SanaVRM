import type { NextRequest } from "next/server";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import {
  createInventoryLevel,
  listInventoryLevels,
} from "@/lib/services/inventory-level.services";
import { createInventoryLevelSchema } from "@/lib/validation/inventory-level.validation";
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

export async function POST(req: NextRequest) {
  return handleRequest(
    async (body) => {
      return await createInventoryLevel(body);
    },
    req,
    {
      schema: createInventoryLevelSchema,
      body: () => getRequestBody<unknown>(req),
    },
  );
}
