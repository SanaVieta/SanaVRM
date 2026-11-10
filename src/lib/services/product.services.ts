import type { Product } from "@/lib/db/schemas/product.schema";
import { Product as ProductEntity } from "@/lib/db/schemas/product.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
} from "@/lib/services/service-utils";

const resourceName = "Product";

export type CreateProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "inventoryLevels"
>;

export type UpdateProductInput = Partial<CreateProductInput>;

export async function listProducts(
  pagination?: PaginationParams,
): Promise<PaginatedResult<Product>> {
  const repo = await getEntityRepository(ProductEntity);
  return findPaginated(repo, pagination);
}

export async function getProductById(id: string): Promise<Product> {
  const repo = await getEntityRepository(ProductEntity);
  const product = await repo.findOne({ where: { id } });
  return requireEntity(product, resourceName);
}

export async function createProduct(
  input: CreateProductInput,
): Promise<Product> {
  const repo = await getEntityRepository(ProductEntity);
  const product = repo.create(input);
  return repo.save(product);
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<Product> {
  const repo = await getEntityRepository(ProductEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );
  repo.merge(existing, input);
  return repo.save(existing);
}

export async function deleteProduct(id: string): Promise<void> {
  const repo = await getEntityRepository(ProductEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
