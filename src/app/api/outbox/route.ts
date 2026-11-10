import type { NextRequest } from "next/server";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import {
  createOutboxEntry,
  listOutboxEntries,
} from "@/lib/services/outbox.services";
import { createOutboxSchema } from "@/lib/validation/outbox.validation";
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
      return await listOutboxEntries(pagination);
    },
    req,
    { schema: paginationQuerySchema, body },
  );
}

export async function POST(req: NextRequest) {
  return handleRequest(
    async (body) => {
      return await createOutboxEntry(body);
    },
    req,
    {
      schema: createOutboxSchema,
      body: () => getRequestBody<unknown>(req),
    },
  );
}
