"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/crm-api";
import {
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
  const [result, setResult] = useState("");
  async function selectFile(file?: File) {
    setRows([]);
    setError("");
    setResult("");
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
    try {
      const response = await callApi<{
        created: number;
        updated: number;
        skipped: number;
      }>("/api/lead/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, duplicate }),
      });
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
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
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
          <div className="min-w-0">
            <h3 className="mb-2 font-semibold">
              Preview · {fileName} ({rows.length} leads)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Full name",
                      "Email",
                      "Phone",
                      "City",
                      "State",
                      "Status",
                    ].map((label) => (
                      <th key={label} className="border-b p-2">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, index) => (
                    <tr key={`${row.email ?? "row"}-${index}`}>
                      <td className="p-2">
                        {[row.firstName, row.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </td>
                      <td className="p-2">{row.email}</td>
                      <td className="p-2">{row.phone}</td>
                      <td className="p-2">{row.city}</td>
                      <td className="p-2">{row.state}</td>
                      <td className="p-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
              {busy ? "Importing…" : `Import ${rows.length} leads`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
