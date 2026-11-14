import { describe, expect, it } from "vitest";
import {
  chunkImportRows,
  MAX_IMPORT_ROWS,
  parseLeadCsv,
  splitName,
} from "@/lib/import-leads";

const header = "Full Name,Phone,Email,City,State,Status,Creation Date\n";

describe("lead CSV import", () => {
  it("splits names and parses escaped CSV, dates and API statuses", () => {
    expect(splitName("  Mary Ann Smith ")).toEqual({
      firstName: "Mary",
      lastName: "Ann Smith",
    });
    expect(
      parseLeadCsv(
        `${header}"Mary Ann Smith","555, 0101",mary@example.com,London,UK,qualified,2026-11-01\n`,
      ),
    ).toEqual([
      {
        firstName: "Mary",
        lastName: "Ann Smith",
        phone: "555, 0101",
        email: "mary@example.com",
        city: "London",
        state: "UK",
        status: "qualified",
        createdAt: "2026-11-01T00:00:00.000Z",
      },
    ]);
  });

  it("chunks rows for batched API imports", () => {
    const rows = Array.from(
      { length: MAX_IMPORT_ROWS + 1 },
      (_, index) => index,
    );
    expect(chunkImportRows(rows)).toEqual([
      rows.slice(0, MAX_IMPORT_ROWS),
      rows.slice(MAX_IMPORT_ROWS),
    ]);
    expect(chunkImportRows([1, 2, 3])).toEqual([[1, 2, 3]]);
  });

  it("parses CSV files larger than one import batch", () => {
    const body = Array.from(
      { length: MAX_IMPORT_ROWS + 2 },
      () => "Pat,,pat@example.com,,,new,\n",
    ).join("");
    expect(parseLeadCsv(`${header}${body}`)).toHaveLength(MAX_IMPORT_ROWS + 2);
  });

  it("rejects missing columns, invalid status and bad email", () => {
    expect(() => parseLeadCsv("Email\na@example.com")).toThrow(
      "Missing columns",
    );
    expect(() =>
      parseLeadCsv(`${header}A,,a@example.com,,,processed,\n`),
    ).toThrow("status must be");
    expect(() => parseLeadCsv(`${header}A,,not-an-email,,,new,\n`)).toThrow(
      "invalid email",
    );
  });
});
