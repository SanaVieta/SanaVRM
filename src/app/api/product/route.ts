import type { NextRequest } from "next/server";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import { createProduct, listProducts } from "@/lib/services/product.services";
import { paginationQuerySchema } from "@/lib/validation/pagination.validation";
import { createProductSchema } from "@/lib/validation/product.validation";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const body = {
    ...(params.has("offset") ? { offset: params.get("offset") } : {}),
    ...(params.has("limit") ? { limit: params.get("limit") } : {}),
    ...(params.has("createdAt") ? { createdAt: params.get("createdAt") } : {}),
  };
  return handleRequest(
    async (pagination) => {
      return await listProducts(pagination);
    },
    req,
    { schema: paginationQuerySchema, body },
  );
}

export async function POST(req: NextRequest) {
  return handleRequest(
    async (body) => {
      return await createProduct(body);
    },
    req,
    {
      schema: createProductSchema,
      body: () => getRequestBody<unknown>(req),
    },
  );
}
