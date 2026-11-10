import type { NextRequest } from "next/server";
import { Raw } from "typeorm";
import { getRequestBody, handleRequest } from "@/lib/api-utils";
import { Lead } from "@/lib/db/schemas/lead.schema";
import {
  handleTransaction,
  rethrowQueryError,
} from "@/lib/services/service-utils";
import { importLeadSchema } from "@/lib/validation/lead.validation";

export async function POST(request: NextRequest) {
  return handleRequest(
    async ({ rows, duplicate }) => {
      try {
        return await handleTransaction(async (manager) => {
          const repo = manager.getRepository(Lead);
          let created = 0;
          let updated = 0;
          let skipped = 0;
          for (const row of rows) {
            const existing = row.email
              ? await repo.findOne({
                  where: {
                    email: Raw((alias) => `lower(${alias}) = lower(:email)`, {
                      email: row.email,
                    }),
                  },
                })
              : null;
            if (existing && duplicate === "skip") {
              skipped++;
              continue;
            }
            const { createdAt, ...fields } = row;
            const value = existing
              ? repo.merge(existing, fields)
              : repo.create(fields);
            if (createdAt) value.createdAt = new Date(createdAt);
            await repo.save(value);
            if (existing) updated++;
            else created++;
          }
          return { created, updated, skipped };
        });
      } catch (error) {
        rethrowQueryError(error, "Lead", {
          email: "A lead with this email already exists",
        });
      }
    },
    request,
    {
      schema: importLeadSchema,
      body: () => getRequestBody<unknown>(request),
    },
  );
}
