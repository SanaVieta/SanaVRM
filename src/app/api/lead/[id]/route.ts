import type { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import {
  deleteLead,
  getLeadById,
  updateLead,
} from "@/lib/services/lead.services";
import { leadSchema } from "@/lib/validation/lead.validation";
import { type IdParam, idParamSchema } from "@/lib/validation/param.validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  return handleRequest(
    async (args: IdParam) => {
      const lead = await getLeadById(args.id);
      return lead;
    },
    request,
    { schema: idParamSchema, body: await params },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  const updateLeaSchema = leadSchema
    .omit({ id: true, createdAt: true, updatedAt: true })
    .partial();
  const patchLeadSchema = z.object({
    body: updateLeaSchema,
    params: idParamSchema,
  });
  const updateLeadBody = await getRequestBody<typeof updateLeaSchema>(request);
  const id = (await params).id;
  return handleRequest(
    async ({ body, params }) => {
      await updateLead(params.id, body);
    },
    request,
    { schema: patchLeadSchema, body: { body: updateLeadBody, params: { id: id } } },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
): Promise<Response> {
  const id = (await params).id;
  return handleRequest(
    async (args: IdParam) => {
      await deleteLead(id);
    },
    request,
    { schema: idParamSchema, body: await params },
  );
}
