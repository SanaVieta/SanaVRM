import { ApiError } from "next/dist/server/api-utils";
import { QueryFailedError, type Repository } from "typeorm";
import type { Lead } from "@/lib/db/schemas/lead.schema";
import { Lead as LeadEntity } from "@/lib/db/schemas/lead.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
} from "@/lib/services/service-utils";

const resourceName = "Lead";

export type CreateLeadInput = Omit<
  Lead,
  "id" | "createdAt" | "updatedAt" | "customer"
>;

export type UpdateLeadInput = Partial<CreateLeadInput>;

const UNIQUE_VIOLATION = "23505";

const uniqueViolationMessages: Record<string, string> = {
  customer_id: "Customer is already linked to another lead",
  email: "A lead with this email already exists",
};

// Postgres reports the offending column in `detail` as "Key (column)=(value)
// ...". Only the column is used, so the message never echoes the value.
function toConflictError(error: unknown): unknown {
  if (!(error instanceof QueryFailedError)) return error;
  const { code, detail } = error.driverError as {
    code?: string;
    detail?: string;
  };
  if (code !== UNIQUE_VIOLATION) return error;
  const column = detail?.match(/^Key \(([^)]+)\)/)?.[1] ?? "";
  return new ApiError(
    409,
    uniqueViolationMessages[column] ?? `${resourceName} already exists`,
  );
}

async function saveLead(repo: Repository<Lead>, entity: Lead): Promise<Lead> {
  try {
    return await repo.save(entity);
  } catch (error) {
    throw toConflictError(error);
  }
}

function assertLeadLinkFields(input: {
  customerId?: string | null;
  linkedAt?: Date | null;
}): void {
  if ((input.customerId == null) !== (input.linkedAt == null)) {
    throw new ApiError(
      400,
      "customerId and linkedAt must be set or cleared together",
    );
  }
}

export async function listLeads(
  pagination?: PaginationParams,
): Promise<PaginatedResult<Lead>> {
  const repo = await getEntityRepository(LeadEntity);
  return findPaginated(repo, pagination);
}

export async function getLeadById(id: string): Promise<Lead> {
  const repo = await getEntityRepository(LeadEntity);
  const lead = await repo.findOne({ where: { id } });
  return requireEntity(lead, resourceName);
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  assertLeadLinkFields(input);
  const repo = await getEntityRepository(LeadEntity);
  const lead = repo.create(input);
  return saveLead(repo, lead);
}

export async function updateLead(
  id: string,
  input: UpdateLeadInput,
): Promise<Lead> {
  const repo = await getEntityRepository(LeadEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );

  const merged = { ...existing, ...input };
  assertLeadLinkFields({
    customerId: merged.customerId,
    linkedAt: merged.linkedAt,
  });

  repo.merge(existing, input);
  return saveLead(repo, existing);
}

export async function deleteLead(id: string): Promise<void> {
  const repo = await getEntityRepository(LeadEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
