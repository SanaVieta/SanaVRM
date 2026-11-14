"use client";

import { useState } from "react";
import {
  Pager,
  Panel,
  Pill,
  Table,
  TableBody,
  TableHeader,
  Truncate,
} from "@/components/crm/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { callApi, importLeadsInBatches } from "@/lib/crm-api";
import { type LeadRecord, leadName } from "@/lib/crm-types";
import {
  chunkImportRows,
  csvColumns,
  downloadLeadTemplate,
  type ImportRow,
  parseLeadCsv,
  splitName,
} from "@/lib/import-leads";

const statuses = ["new", "contacted", "qualified", "converted", "lost"];

export function AddLeadDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submitLead(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await callApi("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...splitName(String(values.get("name") ?? "")),
          phone: String(values.get("phone") ?? "") || null,
          email: String(values.get("email") ?? "") || null,
          city: String(values.get("city") ?? "") || null,
          state: String(values.get("state") ?? "") || null,
          status: values.get("status"),
        }),
      });
      form.reset();
      onClose();
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add lead.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>
            Enter the same fields as the customer data master list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitLead} className="grid gap-4 sm:grid-cols-2">
          <label htmlFor="new-name" className="sm:col-span-2">
            Full name
            <Input id="new-name" name="name" required className="mt-1 h-11" />
          </label>
          <label htmlFor="new-phone">
            Phone
            <Input id="new-phone" name="phone" className="mt-1 h-11" />
          </label>
          <label htmlFor="new-email">
            Email
            <Input
              id="new-email"
              name="email"
              type="email"
              className="mt-1 h-11"
            />
          </label>
          <label htmlFor="new-city">
            City
            <Input id="new-city" name="city" className="mt-1 h-11" />
          </label>
          <label htmlFor="new-state">
            State
            <Input id="new-state" name="state" className="mt-1 h-11" />
          </label>
          <label>
            Status
            <select
              name="status"
              className="mt-1 h-11 w-full rounded-lg border border-[#B9C7AC] bg-white px-3"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            {error && (
              <p role="alert" className="mb-3 text-[#8A2A1B]">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={busy} type="submit">
                {busy ? "Adding…" : "Add lead"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImportLeadsDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [duplicate, setDuplicate] = useState<"skip" | "update">("skip");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [importBatch, setImportBatch] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [result, setResult] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [previewSize, setPreviewSize] = useState(5);
  async function selectFile(file?: File) {
    setRows([]);
    setError("");
    setResult("");
    setPreviewPage(1);
    setFileName(file?.name ?? "");
    if (!file) return;
    try {
      setRows(parseLeadCsv(await file.text()));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not read the CSV.",
      );
    }
  }
  async function importRows() {
    setBusy(true);
    setError("");
    setImportBatch(null);
    try {
      const response = await importLeadsInBatches(
        rows,
        duplicate,
        (current, total) => setImportBatch({ current, total }),
      );
      setResult(
        `${response.created} added, ${response.updated} updated, ${response.skipped} skipped.`,
      );
      setRows([]);
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not import leads.",
      );
    } finally {
      setBusy(false);
      setImportBatch(null);
    }
  }
  const batchTotal = chunkImportRows(rows).length;
  const previewCurrent = Math.min(
    previewPage,
    Math.max(1, Math.ceil(rows.length / previewSize)),
  );
  const previewVisible = rows.slice(
    (previewCurrent - 1) * previewSize,
    previewCurrent * previewSize,
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto p-4 sm:max-w-[52rem]">
        <DialogHeader>
          <DialogTitle>Import leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a file, check how columns map to lead fields, then import.
          </DialogDescription>
        </DialogHeader>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#B9C7AC] bg-[#F5F7F1] p-4 text-center font-semibold text-[#124A0A]">
          Choose a CSV file
          <input
            aria-label="Choose a CSV file"
            type="file"
            accept=".csv,text/csv"
            className="mt-3 max-w-full text-sm"
            onChange={(event) => selectFile(event.target.files?.[0])}
          />
        </label>
        <p className="text-sm text-[#4F5E4B]">
          Columns: {csvColumns.join(", ")}. Status: {statuses.join(", ")}.
        </p>
        {rows.length > 0 && (
          <Panel label="Import preview">
            <h3
              title={`Preview · ${fileName} (${rows.length} leads)`}
              className="border-b border-[#DFE6D6] px-5 py-4 text-lg font-bold text-[#124A0A]"
            >
              <span className="block truncate">
                Preview · {fileName} ({rows.length} leads)
              </span>
            </h3>
            <div className="min-w-0 overflow-x-auto">
              <Table>
                <TableHeader
                  headers={[
                    "Full name",
                    "Phone",
                    "Email",
                    "City",
                    "State",
                    "Status",
                  ]}
                />
                <TableBody
                  rows={previewVisible}
                  getKey={(row) => rows.indexOf(row)}
                >
                  {(row) => (
                    <tr className="border-t border-[#E8EEE0]">
                      <td className="max-w-[240px] px-4 py-3 font-semibold">
                        <Truncate>
                          {[row.firstName, row.lastName]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </Truncate>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.phone || "—"}
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        <Truncate>{row.email || "—"}</Truncate>
                      </td>
                      <td className="max-w-[160px] px-4 py-3">
                        <Truncate>{row.city || "—"}</Truncate>
                      </td>
                      <td className="max-w-[100px] px-4 py-3">
                        <Truncate>{row.state || "—"}</Truncate>
                      </td>
                      <td className="px-4 py-3">
                        <Pill
                          tone={
                            row.status === "lost"
                              ? "danger"
                              : row.status === "new"
                                ? "neutral"
                                : "good"
                          }
                        >
                          {row.status}
                        </Pill>
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </div>
            <Pager
              page={previewCurrent}
              setPage={setPreviewPage}
              size={previewSize}
              setSize={(value) => {
                setPreviewSize(value);
                setPreviewPage(1);
              }}
              count={rows.length}
              noun="leads"
            />
          </Panel>
        )}
        <fieldset className="space-y-2">
          <legend className="font-semibold">If an email already exists</legend>
          <label className="flex gap-2">
            <input
              type="radio"
              name="duplicate"
              checked={duplicate === "skip"}
              onChange={() => setDuplicate("skip")}
            />
            Skip it and keep the current lead
          </label>
          <label className="flex gap-2">
            <input
              type="radio"
              name="duplicate"
              checked={duplicate === "update"}
              onChange={() => setDuplicate("update")}
            />
            Update the current lead with the CSV values
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="text-[#8A2A1B]">
            {error}
          </p>
        )}
        {result && <output className="block text-[#124A0A]">{result}</output>}
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="outline" onClick={downloadLeadTemplate}>
            Download template
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button disabled={!rows.length || busy} onClick={importRows}>
              {busy && importBatch && importBatch.total > 1
                ? `Importing batch ${importBatch.current} of ${importBatch.total}…`
                : busy
                  ? "Importing…"
                  : batchTotal > 1
                    ? `Import ${rows.length} leads (${batchTotal} batches)`
                    : `Import ${rows.length} leads`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditLeadDialog({
  open,
  onClose,
  lead,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadRecord | null;
  onSaved: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function saveLead(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      await callApi(`/api/lead/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(values.get("firstName") ?? "") || null,
          lastName: String(values.get("lastName") ?? "") || null,
          phone: String(values.get("phone") ?? "") || null,
          email: String(values.get("email") ?? "") || null,
          city: String(values.get("city") ?? "") || null,
          state: String(values.get("state") ?? "") || null,
          status: values.get("status"),
        }),
      });
      onClose();
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update lead.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit lead</DialogTitle>
          <DialogDescription>
            Update the lead’s contact details and status.
          </DialogDescription>
        </DialogHeader>
        {lead && (
          <form
            key={lead.id}
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={saveLead}
          >
            {(
              [
                "firstName",
                "lastName",
                "phone",
                "email",
                "city",
                "state",
              ] as const
            ).map((field) => (
              <label
                key={field}
                htmlFor={`edit-${field}-${lead.id}`}
                className="capitalize"
              >
                {field.replace(/([A-Z])/g, " $1")}
                <Input
                  id={`edit-${field}-${lead.id}`}
                  name={field}
                  defaultValue={lead[field] ?? ""}
                  type={field === "email" ? "email" : "text"}
                  className="mt-1 h-11"
                />
              </label>
            ))}
            <label htmlFor={`edit-status-${lead.id}`}>
              Status
              <select
                id={`edit-status-${lead.id}`}
                name="status"
                defaultValue={lead.status}
                className="mt-1 h-11 w-full rounded-lg border border-[#B9C7AC] bg-white px-3"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              {error && (
                <p role="alert" className="text-[#8A2A1B]">
                  {error}
                </p>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteLeadDialog({
  open,
  onClose,
  lead,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  lead: LeadRecord | null;
  onDeleted: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function confirmDelete() {
    if (!lead) return;
    setBusy(true);
    setError("");
    try {
      await callApi(`/api/lead/${lead.id}`, { method: "DELETE" });
      onClose();
      onDeleted();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete lead.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete lead</DialogTitle>
          <DialogDescription>
            {lead
              ? `Are you sure you want to delete ${leadName(lead)}? This cannot be undone.`
              : "Are you sure you want to delete this lead? This cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-[#8A2A1B]">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-500 text-white hover:bg-red-600"
            disabled={busy}
            onClick={() => void confirmDelete()}
          >
            {busy ? "Deleting…" : "Delete lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
