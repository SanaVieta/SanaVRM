import type { NextRequest } from "next/server";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import {
  deleteOrder,
  getOrderById,
  updateOrder,
} from "@/lib/services/order.services";
import { patchOrderSchema } from "@/lib/validation/order.validation";
import { type IdParam, idParamSchema } from "@/lib/validation/param.validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  return handleRequest(
    async (args: IdParam) => {
      return await getOrderById(args.id);
    },
    request,
    { schema: idParamSchema, body: await params },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  const id = (await params).id;
  return handleRequest(
    async ({ body, params }) => {
      return await updateOrder(params.id, body);
    },
    request,
    {
      schema: patchOrderSchema,
      body: async () => ({
        body: await getRequestBody<unknown>(request),
        params: { id: id },
      }),
    },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  const id = (await params).id;
  return handleRequest(
    async (params: IdParam) => {
      await deleteOrder(params.id);
    },
    request,
    { schema: idParamSchema, body: { id: id } },
  );
}
