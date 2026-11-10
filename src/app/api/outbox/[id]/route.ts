import type { NextRequest } from "next/server";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import {
  deleteOutboxEntry,
  getOutboxEntryById,
  updateOutboxEntry,
} from "@/lib/services/outbox.services";
import { patchOutboxSchema } from "@/lib/validation/outbox.validation";
import { type IdParam, idParamSchema } from "@/lib/validation/param.validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  return handleRequest(
    async (args: IdParam) => {
      return await getOutboxEntryById(args.id);
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
      return await updateOutboxEntry(params.id, body);
    },
    request,
    {
      schema: patchOutboxSchema,
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
      await deleteOutboxEntry(params.id);
    },
    request,
    { schema: idParamSchema, body: { id: id } },
  );
}
