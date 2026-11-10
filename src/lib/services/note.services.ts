import { ApiError } from "next/dist/server/api-utils";
import type { Note } from "@/lib/db/schemas/note.schema";
import { Note as NoteEntity } from "@/lib/db/schemas/note.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
} from "@/lib/services/service-utils";

const resourceName = "Note";

export type CreateNoteInput = Omit<
  Note,
  "id" | "createdAt" | "customer" | "order" | "inventoryLevel"
>;

export type UpdateNoteInput = Partial<CreateNoteInput>;

function assertNoteTarget(input: {
  customerId?: string | null;
  orderId?: string | null;
  inventoryId?: string | null;
}): void {
  const targetCount = [
    input.customerId,
    input.orderId,
    input.inventoryId,
  ].filter((target) => target != null).length;

  if (targetCount !== 1) {
    throw new ApiError(
      400,
      "A note must attach to exactly one of customer, order, or inventory",
    );
  }
}

export async function listNotes(
  pagination?: PaginationParams,
): Promise<PaginatedResult<Note>> {
  const repo = await getEntityRepository(NoteEntity);
  return findPaginated(repo, pagination);
}

export async function getNoteById(id: string): Promise<Note> {
  const repo = await getEntityRepository(NoteEntity);
  const note = await repo.findOne({ where: { id } });
  return requireEntity(note, resourceName);
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  assertNoteTarget(input);
  const repo = await getEntityRepository(NoteEntity);
  const note = repo.create(input);
  return repo.save(note);
}

export async function updateNote(
  id: string,
  input: UpdateNoteInput,
): Promise<Note> {
  const repo = await getEntityRepository(NoteEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );

  const merged = { ...existing, ...input };
  assertNoteTarget({
    customerId: merged.customerId,
    orderId: merged.orderId,
    inventoryId: merged.inventoryId,
  });

  repo.merge(existing, input);
  return repo.save(existing);
}

export async function deleteNote(id: string): Promise<void> {
  const repo = await getEntityRepository(NoteEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
