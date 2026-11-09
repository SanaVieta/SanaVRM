import { ApiError } from "next/dist/server/api-utils";
import type {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { getDb } from "@/lib/db/getDB";

export async function handleTransaction<T>(
  fn: (manager: EntityManager) => Promise<T>,
) {
  const db = await getDb();
  return await db.transaction(async (manager) => fn(manager));
}

export async function getEntityRepository<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
): Promise<Repository<T>> {
  const db = await getDb();
  return db.getRepository(entity);
}

export function requireEntity<T>(
  entity: T | null | undefined,
  resourceName: string,
): T {
  if (entity == null) {
    throw new ApiError(404, `${resourceName} not found`);
  }
  return entity;
}

type DeleteCapable = {
  delete: (id: string) => Promise<{ affected?: number | null }>;
};

export async function deleteByIdOrThrow(
  repo: DeleteCapable,
  id: string,
  resourceName: string,
): Promise<void> {
  const result = await repo.delete(id);
  if (!result.affected) {
    throw new ApiError(404, `${resourceName} not found`);
  }
}
