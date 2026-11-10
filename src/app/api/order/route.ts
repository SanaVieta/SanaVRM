import type { NextRequest } from "next/server";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import { createOrder, listOrders } from "@/lib/services/order.services";
import { createOrderSchema } from "@/lib/validation/order.validation";
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
      return await listOrders(pagination);
    },
    req,
    { schema: paginationQuerySchema, body },
  );
}

export async function POST(req: NextRequest) {
  return handleRequest(
    async (body) => {
      return await createOrder(body);
    },
    req,
    {
      schema: createOrderSchema,
      body: () => getRequestBody<unknown>(req),
    },
  );
}
