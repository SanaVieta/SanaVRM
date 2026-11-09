import { ApiError } from "next/dist/server/api-utils";
import type {
  EntityManager,
  EntityTarget,
  FindManyOptions,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { getDb } from "@/lib/db/getDB";
import {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from "@/lib/validation/pagination.validation";

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

export function normalizePagination(params?: PaginationParams): {
  limit: number;
  offset: number;
} {
  const rawLimit = params?.limit ?? DEFAULT_PAGE_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_PAGE_LIMIT);
  const offset = Math.max(params?.offset ?? 0, 0);
  return { limit, offset };
}

export async function findPaginated<T extends ObjectLiteral>(
  repo: Repository<T>,
  pagination?: PaginationParams,
  options?: Omit<FindManyOptions<T>, "skip" | "take">,
): Promise<PaginatedResult<T>> {
  const { limit, offset } = normalizePagination(pagination);
  const [data, total] = await repo.findAndCount({
    ...options,
    skip: offset,
    take: limit,
  });
  return { data, total, limit, offset };
}

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
