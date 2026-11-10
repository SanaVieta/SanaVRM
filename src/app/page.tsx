"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AddLeadDialog,
  ImportLeadsDialog,
} from "@/components/crm/lead-dialogs";
import {
  DataState,
  Filters,
  PageHeader,
  Pager,
  Panel,
  Pill,
  Summary,
} from "@/components/crm/shared";
import { Shell } from "@/components/crm/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/lib/crm-api";
import { formatDate, type LeadRecord, leadName } from "@/lib/crm-types";

const statuses = ["All", "new", "contacted", "qualified", "converted", "lost"];

export default function Home() {
  const { rows, loading, error, refresh } =
    useCollection<LeadRecord>("/api/lead");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const matches = rows.filter(
    (lead) =>
      (filter === "All" || lead.status === filter) &&
      [leadName(lead), lead.email, lead.phone, lead.city, lead.state]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(matches.length / size)));
  const visible = matches.slice((current - 1) * size, current * size);
  return (
    <Shell>
      <PageHeader
        title="Leads"
        description="Your customer master list. A lead links to a Shopify customer once they've been reached out to."
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button onClick={() => setAddOpen(true)}>+ Add lead</Button>
          </>
        }
      />
      <DataState loading={loading} error={error} retry={refresh} />
      {!loading && !error && (
        <>
          <Summary
            items={[
              { label: "Total leads", value: rows.length },
              {
                label: "Contacted",
                value: rows.filter((row) => row.status === "contacted").length,
              },
              {
                label: "Lost",
                value: rows.filter((row) => row.status === "lost").length,
                danger: true,
              },
              {
                label: "Linked to Shopify",
                value: `${rows.filter((row) => row.customerId).length} of ${rows.length}`,
              },
            ]}
          />
          <Panel label="Lead list">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#DFE6D6] p-5">
              <Filters
                values={statuses.map((label) => ({
                  label,
                  count:
                    label === "All"
                      ? rows.length
                      : rows.filter((row) => row.status === label).length,
                }))}
                selected={filter}
                onSelect={(value) => {
                  setFilter(value);
                  setPage(1);
                }}
              />
              <label
                htmlFor="lead-search"
                className="w-full max-w-[340px] text-[13px] font-semibold text-[#3E4D3A]"
              >
                Search leads
                <Input
                  id="lead-search"
                  className="mt-1 h-11 bg-white"
                  type="search"
                  placeholder="Name, email, phone or city"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[15px]">
                <thead className="bg-[#F5F7F1] text-xs font-bold tracking-wide text-[#3E4D3A] uppercase">
                  <tr>
                    {[
                      "Full name",
                      "Phone",
                      "Email",
                      "City",
                      "State",
                      "Status",
                      "Shopify",
                      "Creation date",
                    ].map((label) => (
                      <th key={label} scope="col" className="px-4 py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-t border-[#E8EEE0] hover:bg-[#F3F8EC]"
                    >
                      <td className="px-4 py-3 font-semibold">
                        <Link
                          className="text-[#124A0A] underline-offset-2 hover:underline"
                          href={`/leads/${lead.id}`}
                        >
                          {leadName(lead)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.phone || "—"}
                      </td>
                      <td className="max-w-[280px] break-all px-4 py-3">
                        {lead.email || "—"}
                      </td>
                      <td className="px-4 py-3">{lead.city || "—"}</td>
                      <td className="px-4 py-3">{lead.state || "—"}</td>
                      <td className="px-4 py-3">
                        <Pill
                          tone={
                            lead.status === "lost"
                              ? "danger"
                              : lead.status === "new"
                                ? "neutral"
                                : "good"
                          }
                        >
                          {lead.status}
                        </Pill>
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={lead.customerId ? "good" : "neutral"}>
                          {lead.customerId ? "Customer" : "Not linked"}
                        </Pill>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visible.length === 0 && (
              <p className="p-10 text-center text-[#4F5E4B]">
                {rows.length === 0
                  ? "No leads yet. Add a lead or import a CSV to get started."
                  : "No leads match this search."}
              </p>
            )}
            <Pager
              page={current}
              setPage={setPage}
              size={size}
              setSize={(value) => {
                setSize(value);
                setPage(1);
              }}
              count={matches.length}
              noun="leads"
            />
          </Panel>
        </>
      )}
      <AddLeadDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refresh}
      />
      <ImportLeadsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSaved={refresh}
      />
    </Shell>
  );
}
