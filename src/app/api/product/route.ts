import type { NextRequest } from "next/server";
import { handleRequest } from "@/lib/api-utils";
import { listProducts } from "@/lib/services/product.services";
import { paginationQuerySchema } from "@/lib/validation/pagination.validation";

export async function GET(request: NextRequest) {
  return handleRequest((pagination) => listProducts(pagination), request, {
    schema: paginationQuerySchema,
    body: Object.fromEntries(request.nextUrl.searchParams),
  });
}
