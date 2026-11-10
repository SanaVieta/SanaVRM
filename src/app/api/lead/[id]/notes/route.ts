import type { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import { Note } from "@/lib/db/schemas/note.schema";
import { getLeadById } from "@/lib/services/lead.services";
import { createNote } from "@/lib/services/note.services";
import { getEntityRepository } from "@/lib/services/service-utils";
import { type IdParam, idParamSchema } from "@/lib/validation/param.validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
) {
  return handleRequest(
    async ({ id }) => {
      await getLeadById(id);
      const repo = await getEntityRepository(Note);
      return repo.find({
        where: { leadId: id },
        order: { createdAt: "DESC", id: "DESC" },
      });
    },
    request,
    { schema: idParamSchema, body: await params },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<IdParam> },
) {
  const id = (await params).id;
  return handleRequest(
    async ({ params, body }) => {
      await getLeadById(params.id);
      return createNote({ leadId: params.id, body: body.body.trim() });
    },
    request,
    {
      schema: z.object({
        params: idParamSchema,
        body: z.object({ body: z.string().trim().min(1).max(5000) }),
      }),
      body: async () => ({
        params: { id },
        body: await getRequestBody<unknown>(request),
      }),
    },
  );
}
