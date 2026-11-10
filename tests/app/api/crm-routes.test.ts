import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET as getNotes,
  POST as postNote,
} from "@/app/api/lead/[id]/notes/route";
import { POST as postLead } from "@/app/api/lead/route";
import { GET as getOrders } from "@/app/api/order/route";
import { GET as getProducts } from "@/app/api/product/route";

const id = "3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b";
const repo = vi.hoisted(() => ({
  findAndCount: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/lib/db/getDB", () => ({
  getDb: vi.fn(async () => ({ getRepository: () => repo })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  repo.findAndCount.mockResolvedValue([[], 0]);
  repo.findOne.mockResolvedValue({ id });
  repo.find.mockResolvedValue([]);
  repo.create.mockImplementation((body) => ({ id, ...body }));
  repo.save.mockImplementation(async (body) => body);
});

describe("CRM API routes", () => {
  it("lists orders with customer data and pagination", async () => {
    const response = await getOrders(
      new NextRequest("http://localhost/api/order?limit=5&offset=2"),
    );
    expect(response.status).toBe(200);
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 2,
        relations: { customer: true },
      }),
    );
  });

  it("lists products with inventory levels and rejects invalid pagination", async () => {
    const response = await getProducts(
      new NextRequest("http://localhost/api/product?limit=5"),
    );
    expect(response.status).toBe(200);
    expect(repo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ relations: { inventoryLevels: true } }),
    );
    const invalid = await getProducts(
      new NextRequest("http://localhost/api/product?limit=0"),
    );
    expect(invalid.status).toBe(400);
  });

  it("creates a lead with validated input", async () => {
    const response = await postLead(
      new NextRequest("http://localhost/api/lead", {
        method: "POST",
        body: JSON.stringify({
          firstName: "A",
          email: "a@example.com",
          status: "new",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "new", firstName: "A" }),
    );
    const invalid = await postLead(
      new NextRequest("http://localhost/api/lead", {
        method: "POST",
        body: JSON.stringify({ email: "bad" }),
      }),
    );
    expect(invalid.status).toBe(400);
  });

  it("reads and creates notes for the requested lead", async () => {
    const context = { params: Promise.resolve({ id }) };
    const response = await getNotes(
      new NextRequest(`http://localhost/api/lead/${id}/notes`),
      context,
    );
    expect(response.status).toBe(200);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { leadId: id } }),
    );
    const created = await postNote(
      new NextRequest(`http://localhost/api/lead/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ body: "Follow up" }),
      }),
      context,
    );
    expect(created.status).toBe(201);
    expect(repo.create).toHaveBeenCalledWith({ leadId: id, body: "Follow up" });
    const empty = await postNote(
      new NextRequest(`http://localhost/api/lead/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ body: " " }),
      }),
      context,
    );
    expect(empty.status).toBe(400);
  });
});
