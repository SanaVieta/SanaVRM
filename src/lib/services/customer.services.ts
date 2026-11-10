import type { Customer } from "@/lib/db/schemas/customer.schema";
import { Customer as CustomerEntity } from "@/lib/db/schemas/customer.schema";
import {
  deleteByIdOrThrow,
  findPaginated,
  getEntityRepository,
  type PaginatedResult,
  type PaginationParams,
  requireEntity,
} from "@/lib/services/service-utils";

const resourceName = "Customer";

export type CreateCustomerInput = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt" | "lead" | "orders"
>;

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export async function listCustomers(
  pagination?: PaginationParams,
): Promise<PaginatedResult<Customer>> {
  const repo = await getEntityRepository(CustomerEntity);
  return findPaginated(repo, pagination);
}

export async function getCustomerById(id: string): Promise<Customer> {
  const repo = await getEntityRepository(CustomerEntity);
  const customer = await repo.findOne({ where: { id } });
  return requireEntity(customer, resourceName);
}

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<Customer> {
  const repo = await getEntityRepository(CustomerEntity);
  const customer = repo.create(input);
  return repo.save(customer);
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  const repo = await getEntityRepository(CustomerEntity);
  const existing = requireEntity(
    await repo.findOne({ where: { id } }),
    resourceName,
  );
  repo.merge(existing, input);
  return repo.save(existing);
}

export async function deleteCustomer(id: string): Promise<void> {
  const repo = await getEntityRepository(CustomerEntity);
  await deleteByIdOrThrow(repo, id, resourceName);
}
