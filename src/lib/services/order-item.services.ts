import type { OrderItem } from "@/lib/db/schemas/order-item.schema";
import { OrderItem as OrderItemEntity } from "@/lib/db/schemas/order-item.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
} from "@/lib/services/service-utils";

const resourceName = "Order item";

export type CreateOrderItemInput = Omit<
  OrderItem,
  "id" | "createdAt" | "updatedAt" | "order" | "product"
>;

export type UpdateOrderItemInput = Partial<CreateOrderItemInput>;

export async function listOrderItems(
  pagination?: PaginationParams,
): Promise<PaginatedResult<OrderItem>> {
  const repo = await getEntityRepository(OrderItemEntity);
  return findPaginated(repo, pagination);
}

export async function getOrderItemById(id: string): Promise<OrderItem> {
  const repo = await getEntityRepository(OrderItemEntity);
  const orderItem = await repo.findOne({ where: { id } });
  return requireEntity(orderItem, resourceName);
}

export async function createOrderItem(
  input: CreateOrderItemInput,
): Promise<OrderItem> {
  const repo = await getEntityRepository(OrderItemEntity);
  const orderItem = repo.create(input);
  return repo.save(orderItem);
}

export async function updateOrderItem(
  id: string,
  input: UpdateOrderItemInput,
): Promise<OrderItem> {
  const repo = await getEntityRepository(OrderItemEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );
  repo.merge(existing, input);
  return repo.save(existing);
}

export async function deleteOrderItem(id: string): Promise<void> {
  const repo = await getEntityRepository(OrderItemEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
