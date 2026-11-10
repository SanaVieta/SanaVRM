import type { NextRequest } from "next/server";
import { handleRequest } from "@/lib/api-utils";
import { listOrders } from "@/lib/services/order.services";
import { paginationQuerySchema } from "@/lib/validation/pagination.validation";

export async function GET(request: NextRequest) {
  return handleRequest((pagination) => listOrders(pagination), request, {
    schema: paginationQuerySchema,
    body: Object.fromEntries(request.nextUrl.searchParams),
  });
}
