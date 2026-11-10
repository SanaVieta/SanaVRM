import type { NextRequest } from "next/server";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import {
  deleteCustomer,
  getCustomerById,
  updateCustomer,
} from "@/lib/services/customer.services";
import { patchCustomerSchema } from "@/lib/validation/customer.validation";
import { type IdParam, idParamSchema } from "@/lib/validation/param.validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  return handleRequest(
    async (args: IdParam) => {
      return await getCustomerById(args.id);
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
      return await updateCustomer(params.id, body);
    },
    request,
    {
      schema: patchCustomerSchema,
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
      await deleteCustomer(params.id);
    },
    request,
    { schema: idParamSchema, body: { id: id } },
  );
}
