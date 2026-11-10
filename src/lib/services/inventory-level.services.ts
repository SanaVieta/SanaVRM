import type { InventoryLevel } from "@/lib/db/schemas/inventory-level.schema";
import { InventoryLevel as InventoryLevelEntity } from "@/lib/db/schemas/inventory-level.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
} from "@/lib/services/service-utils";

const resourceName = "Inventory level";

export type CreateInventoryLevelInput = Omit<
  InventoryLevel,
  "id" | "createdAt" | "updatedAt" | "product"
>;

export type UpdateInventoryLevelInput = Partial<CreateInventoryLevelInput>;

export async function listInventoryLevels(
  pagination?: PaginationParams,
): Promise<PaginatedResult<InventoryLevel>> {
  const repo = await getEntityRepository(InventoryLevelEntity);
  return findPaginated(repo, pagination);
}

export async function getInventoryLevelById(
  id: string,
): Promise<InventoryLevel> {
  const repo = await getEntityRepository(InventoryLevelEntity);
  const inventoryLevel = await repo.findOne({ where: { id } });
  return requireEntity(inventoryLevel, resourceName);
}

export async function createInventoryLevel(
  input: CreateInventoryLevelInput,
): Promise<InventoryLevel> {
  const repo = await getEntityRepository(InventoryLevelEntity);
  const inventoryLevel = repo.create(input);
  return repo.save(inventoryLevel);
}

export async function updateInventoryLevel(
  id: string,
  input: UpdateInventoryLevelInput,
): Promise<InventoryLevel> {
  const repo = await getEntityRepository(InventoryLevelEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );
  repo.merge(existing, input);
  return repo.save(existing);
}

export async function deleteInventoryLevel(id: string): Promise<void> {
  const repo = await getEntityRepository(InventoryLevelEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
