import type { Outbox } from "@/lib/db/schemas/outbox.schema";
import { Outbox as OutboxEntity } from "@/lib/db/schemas/outbox.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
  saveEntity,
} from "@/lib/services/service-utils";

const resourceName = "Outbox entry";

export type CreateOutboxInput = Omit<Outbox, "id" | "createdAt">;

export type UpdateOutboxInput = Partial<CreateOutboxInput>;

export async function listOutboxEntries(
  pagination?: PaginationParams,
): Promise<PaginatedResult<Outbox>> {
  const repo = await getEntityRepository(OutboxEntity);
  return findPaginated(repo, pagination);
}

export async function getOutboxEntryById(id: string): Promise<Outbox> {
  const repo = await getEntityRepository(OutboxEntity);
  const outbox = await repo.findOne({ where: { id } });
  return requireEntity(outbox, resourceName);
}

export async function createOutboxEntry(
  input: CreateOutboxInput,
): Promise<Outbox> {
  const repo = await getEntityRepository(OutboxEntity);
  const outbox = repo.create(input);
  return saveEntity(repo, outbox, resourceName);
}

export async function updateOutboxEntry(
  id: string,
  input: UpdateOutboxInput,
): Promise<Outbox> {
  const repo = await getEntityRepository(OutboxEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );
  repo.merge(existing, input);
  return saveEntity(repo, existing, resourceName);
}

export async function deleteOutboxEntry(id: string): Promise<void> {
  const repo = await getEntityRepository(OutboxEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
