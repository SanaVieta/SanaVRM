import type { Order } from "@/lib/db/schemas/order.schema";
import { Order as OrderEntity } from "@/lib/db/schemas/order.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
  saveEntity,
} from "@/lib/services/service-utils";

const resourceName = "Order";

export type CreateOrderInput = Omit<
  Order,
  "id" | "createdAt" | "updatedAt" | "customer"
>;

export type UpdateOrderInput = Partial<CreateOrderInput>;

export async function listOrders(
  pagination?: PaginationParams,
): Promise<PaginatedResult<Order>> {
  const repo = await getEntityRepository(OrderEntity);
  return findPaginated(repo, pagination, { relations: { customer: true } });
}

export async function getOrderById(id: string): Promise<Order> {
  const repo = await getEntityRepository(OrderEntity);
  const order = await repo.findOne({ where: { id } });
  return requireEntity(order, resourceName);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const repo = await getEntityRepository(OrderEntity);
  const order = repo.create(input);
  return saveEntity(repo, order, resourceName);
}

export async function updateOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<Order> {
  const repo = await getEntityRepository(OrderEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );
  repo.merge(existing, input);
  return saveEntity(repo, existing, resourceName);
}

export async function deleteOrder(id: string): Promise<void> {
  const repo = await getEntityRepository(OrderEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
