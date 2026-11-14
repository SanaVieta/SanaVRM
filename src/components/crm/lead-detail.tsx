"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  DataState,
  PageHeader,
  Panel,
  Pill,
  Truncate,
} from "@/components/crm/shared";
import { Shell } from "@/components/crm/shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callApi, readCollection } from "@/lib/crm-api";
import {
  formatDate,
  formatMoney,
  type LeadRecord,
  leadName,
  type NoteRecord,
  type OrderRecord,
} from "@/lib/crm-types";

const statuses = ["new", "contacted", "qualified", "converted", "lost"];

function NoteItem({ note }: { note: NoteRecord }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="min-w-0 rounded-lg bg-[#F5F7F1] p-3">
      <button
        type="button"
        aria-expanded={expanded}
        title={expanded ? "Show less" : "Show full note"}
        onClick={() => setExpanded((value) => !value)}
        className="block w-full cursor-pointer text-left"
      >
        <span
          className={`break-words whitespace-pre-wrap ${expanded ? "block" : "line-clamp-3"}`}
        >
          {note.body}
        </span>
      </button>
      <time className="text-xs text-[#4F5E4B]" dateTime={note.createdAt}>
        {formatDate(note.createdAt)}
      </time>
    </li>
  );
}

export function LeadDetail({ id }: { id: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    void revision;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const [leadData, noteData, orderData] = await Promise.all([
          callApi<LeadRecord>(`/api/lead/${id}`, { signal: controller.signal }),
          callApi<NoteRecord[]>(`/api/lead/${id}/notes`, {
            signal: controller.signal,
          }),
          readCollection<OrderRecord>("/api/order", controller.signal),
        ]);
        setLead(leadData);
        setNotes(noteData);
        setOrders(orderData);
        setLoading(false);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        console.error("Could not load lead detail", cause);
        setError("Could not load lead details. Try again.");
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id, revision]);

  async function saveNote(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      await callApi(`/api/lead/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteText }),
      });
      setNoteText("");
      refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not save note.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setActionError("");
    const values = new FormData(event.currentTarget);
    try {
      await callApi(`/api/lead/${id}`, {
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
      setEditing(false);
      refresh();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not update lead.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteLead() {
    setBusy(true);
    setActionError("");
    try {
      await callApi(`/api/lead/${id}`, { method: "DELETE" });
      setDeleteConfirmOpen(false);
      router.push("/");
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not delete lead.",
      );
    } finally {
      setBusy(false);
    }
  }

  const customerOrders = orders.filter(
    (order) => lead?.customerId && order.customerId === lead.customerId,
  );
  return (
    <Shell>
      <Link
        href="/"
        className="mb-5 inline-block font-semibold text-[#1B6510] hover:underline"
      >
        ‹ All leads
      </Link>
      <DataState loading={loading} error={error} retry={refresh} />
      {!loading && !error && lead && (
        <>
          <PageHeader
            title={leadName(lead)}
            description={`${lead.status} · Created ${formatDate(lead.createdAt)}`}
            actions={
              <>
                <Button
                  onClick={() => {
                    setActionError("");
                    setEditing(true);
                  }}
                >
                  Edit lead
                </Button>
                <Button
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={() => {
                    setActionError("");
                    setDeleteConfirmOpen(true);
                  }}
                >
                  Delete lead
                </Button>
              </>
            }
          />
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
            <Panel label="Lead details">
              <h2 className="border-b border-[#DFE6D6] px-5 py-4 text-lg font-bold text-[#124A0A]">
                Lead details
              </h2>
              <dl className="grid gap-5 p-5 sm:grid-cols-2">
                {[
                  ["Full name", leadName(lead)],
                  ["Phone", lead.phone || "—"],
                  ["Email", lead.email || "—"],
                  ["City", lead.city || "—"],
                  ["State", lead.state || "—"],
                  ["Creation date", formatDate(lead.createdAt)],
                ].map(([label, value]) => (
                  <div className="min-w-0" key={label}>
                    <dt className="text-xs font-semibold tracking-wide text-[#4F5E4B] uppercase">
                      {label}
                    </dt>
                    <dd className="mt-1 min-w-0">
                      <Truncate>{value}</Truncate>
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="mb-1 text-xs font-semibold tracking-wide uppercase">
                    Status
                  </dt>
                  <dd>
                    <Pill tone={lead.status === "lost" ? "danger" : "good"}>
                      {lead.status}
                    </Pill>
                  </dd>
                </div>
              </dl>
            </Panel>
            <div className="min-w-0 space-y-5">
              <Panel label="Shopify customer">
                <h2 className="border-b border-[#DFE6D6] px-5 py-4 text-lg font-bold text-[#124A0A]">
                  Shopify customer
                </h2>
                <div className="space-y-2 p-5">
                  <Pill tone={lead.customerId ? "good" : "neutral"}>
                    {lead.customerId ? "Customer" : "Not linked"}
                  </Pill>
                  <p className="break-all text-sm text-[#4F5E4B]">
                    {lead.customerId
                      ? `Customer ID ${lead.customerId}`
                      : "This lead isn't linked to a Shopify customer yet."}
                  </p>
                </div>
              </Panel>
              <Panel label="Shopify orders">
                <h2 className="border-b border-[#DFE6D6] px-5 py-4 text-lg font-bold text-[#124A0A]">
                  Shopify orders
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] text-left text-sm">
                    <thead>
                      <tr>
                        {["Order", "Date", "Fulfillment", "Total"].map(
                          (label) => (
                            <th
                              key={label}
                              className="border-b border-[#DFE6D6] px-4 py-3"
                            >
                              {label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-4 py-3">#{order.shopifyOrderId}</td>
                          <td className="px-4 py-3">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {order.fulfillmentStatus ?? "Unfulfilled"}
                          </td>
                          <td className="px-4 py-3">
                            {formatMoney(order.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!customerOrders.length && (
                  <p className="p-5 text-sm text-[#4F5E4B]">
                    No linked orders.
                  </p>
                )}
              </Panel>
              <Panel label="Notes">
                <h2 className="border-b border-[#DFE6D6] px-5 py-4 text-lg font-bold text-[#124A0A]">
                  Notes
                </h2>
                <div className="space-y-4 p-5">
                  <ul className="space-y-3">
                    {notes.map((note) => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                  </ul>
                  {!notes.length && (
                    <p className="text-sm text-[#4F5E4B]">No notes yet.</p>
                  )}
                  <form onSubmit={saveNote}>
                    <label
                      htmlFor="note-body"
                      className="mb-2 block font-semibold"
                    >
                      Add an internal note
                    </label>
                    <Textarea
                      id="note-body"
                      required
                      maxLength={5000}
                      value={noteText}
                      onChange={(event) => setNoteText(event.target.value)}
                      placeholder="Follow-ups, preferences, and context…"
                      className="min-h-24"
                    />
                    {actionError && !editing && (
                      <p role="alert" className="mt-2 text-[#8A2A1B]">
                        {actionError}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={busy || !noteText.trim()}
                      className="mt-3"
                    >
                      Save note
                    </Button>
                  </form>
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}
      <Dialog
        open={editing}
        onOpenChange={(value) => {
          if (!value) setEditing(false);
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
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveLead}>
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
                  htmlFor={`edit-${field}`}
                  className="capitalize"
                >
                  {field.replace(/([A-Z])/g, " $1")}
                  <Input
                    id={`edit-${field}`}
                    name={field}
                    defaultValue={lead[field] ?? ""}
                    type={field === "email" ? "email" : "text"}
                    className="mt-1 h-11"
                  />
                </label>
              ))}
              <label>
                Status
                <select
                  name="status"
                  defaultValue={lead.status}
                  className="mt-1 h-11 w-full rounded-lg border border-[#B9C7AC] bg-white px-3"
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                {actionError && (
                  <p role="alert" className="text-[#8A2A1B]">
                    {actionError}
                  </p>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
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
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(value) => {
          if (!value) setDeleteConfirmOpen(false);
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
          {actionError && deleteConfirmOpen && (
            <p role="alert" className="text-[#8A2A1B]">
              {actionError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={busy}
              onClick={() => void confirmDeleteLead()}
            >
              {busy ? "Deleting…" : "Delete lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
