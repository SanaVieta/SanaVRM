import { describe, expect, it } from "vitest";
import { paginationQuerySchema } from "@/lib/validation/pagination.validation";

describe("paginationQuerySchema", () => {
  it("applies defaults", () => {
    expect(paginationQuerySchema.parse({})).toEqual({
      limit: 10,
      offset: 0,
      createdAt: "DESC",
    });
  });

  it("coerces string query values", () => {
    expect(paginationQuerySchema.parse({ limit: "25", offset: "5" })).toEqual({
      limit: 25,
      offset: 5,
      createdAt: "DESC",
    });
  });

  it("accepts createdAt sort direction", () => {
    expect(paginationQuerySchema.parse({ createdAt: "ASC" }).createdAt).toBe(
      "ASC",
    );
  });

  it("rejects limit above the maximum", () => {
    expect(paginationQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it("rejects a negative offset", () => {
    expect(paginationQuerySchema.safeParse({ offset: -1 }).success).toBe(false);
  });
});
