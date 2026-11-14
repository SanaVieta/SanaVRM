import Papa from "papaparse";
import { z } from "zod";
import type { LeadStatus } from "@/lib/crm-types";
import { MAX_IMPORT_ROWS } from "@/lib/lead-import-limits";

export const csvColumns = [
  "Full Name",
  "Phone",
  "Email",
  "City",
  "State",
  "Status",
  "Creation Date",
] as const;

export { MAX_IMPORT_ROWS } from "@/lib/lead-import-limits";

const statuses: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

export type ImportRow = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  status: LeadStatus;
  createdAt?: string;
};

export function splitName(name: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

export function parseLeadCsv(text: string): ImportRow[] {
  const parsed = Papa.parse<Record<string, string>>(
    text.replace(/^\uFEFF/, ""),
    {
      delimiter: ",",
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
    },
  );
  const firstError = parsed.errors[0];
  if (firstError)
    throw new Error(
      `CSV row ${(firstError.row ?? 0) + 2}: ${firstError.message}`,
    );
  const missing = csvColumns.filter(
    (header) => !parsed.meta.fields?.includes(header),
  );
  if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
  if (!parsed.data.length) throw new Error("The CSV has no leads to import.");
  return parsed.data.map((row, index) => {
    const status = (row.Status ?? "").trim().toLowerCase();
    if (!statuses.includes(status as LeadStatus))
      throw new Error(
        `Row ${index + 2}: status must be ${statuses.join(", ")}.`,
      );
    const email = (row.Email ?? "").trim();
    if (email && !z.email().safeParse(email).success)
      throw new Error(`Row ${index + 2}: invalid email.`);
    const date = (row["Creation Date"] ?? "").trim();
    const createdAt = date ? new Date(date) : null;
    if (createdAt && Number.isNaN(createdAt.getTime()))
      throw new Error(`Row ${index + 2}: invalid creation date.`);
    return {
      ...splitName(row["Full Name"] ?? ""),
      phone: (row.Phone ?? "").trim() || null,
      email: email || null,
      city: (row.City ?? "").trim() || null,
      state: (row.State ?? "").trim() || null,
      status: status as LeadStatus,
      ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
    };
  });
}
/**
 * Chunks an array of rows into smaller arrays of a given size
 * @param rows - The rows to chunk.
 * @param batchSize - The size of each chunk. Defaults to the maximum number of rows allowed per import.
 * @returns The chunks of rows.
 */
export function chunkImportRows<T>(
  rows: T[],
  batchSize = MAX_IMPORT_ROWS,
): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    chunks.push(rows.slice(i, i + batchSize));
  }
  return chunks;
}

export function downloadLeadTemplate(): void {
  const blob = new Blob([`${csvColumns.join(",")}\n`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lead-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
