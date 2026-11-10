"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useCollection } from "@/lib/crm-api";
import { formatDate, formatMoney, type OrderRecord } from "@/lib/crm-types";

export default function OrdersPage() {
  const { rows, loading, error, refresh } =
    useCollection<OrderRecord>("/api/order");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const toFulfill = (order: OrderRecord) =>
    order.fulfillmentStatus !== "fulfilled";
  const matches = rows.filter(
    (order) =>
      (filter === "All" ||
        (filter === "To fulfill" ? toFulfill(order) : !toFulfill(order))) &&
      [
        order.shopifyOrderId,
        order.customer?.firstName,
        order.customer?.lastName,
        order.customer?.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(matches.length / size)));
  return (
    <Shell>
      <PageHeader
        title="Orders"
        description="Read-only mirror of your Shopify orders. Change order status in Shopify Admin."
      />
      <DataState loading={loading} error={error} retry={refresh} />
      {!loading && !error && (
        <>
          <Summary
            items={[
              { label: "Orders", value: rows.length },
              { label: "To fulfill", value: rows.filter(toFulfill).length },
              {
                label: "Awaiting payment",
                value: rows.filter((row) => row.financialStatus === "pending")
                  .length,
              },
              {
                label: "Paid revenue",
                value: formatMoney(
                  rows
                    .filter((row) => row.financialStatus === "paid")
                    .reduce((sum, row) => sum + Number(row.totalPrice ?? 0), 0),
                ),
              },
            ]}
          />
          <Panel label="Orders list">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#DFE6D6] p-5">
              <Filters
                values={[
                  { label: "All", count: rows.length },
                  { label: "To fulfill", count: rows.filter(toFulfill).length },
                  {
                    label: "Fulfilled",
                    count: rows.filter((row) => !toFulfill(row)).length,
                  },
                ]}
                selected={filter}
                onSelect={(value) => {
                  setFilter(value);
                  setPage(1);
                }}
              />
              <label
                htmlFor="order-search"
                className="w-full max-w-[340px] text-[13px] font-semibold"
              >
                Search orders
                <Input
                  id="order-search"
                  type="search"
                  className="mt-1 h-11"
                  placeholder="Order ID or customer"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[15px]">
                <thead className="bg-[#F5F7F1] text-xs font-bold tracking-wide text-[#3E4D3A] uppercase">
                  <tr>
                    {[
                      "Order",
                      "Customer",
                      "Date",
                      "Payment",
                      "Fulfillment",
                      "Total",
                    ].map((label) => (
                      <th scope="col" key={label} className="px-5 py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches
                    .slice((current - 1) * size, current * size)
                    .map((order) => (
                      <tr
                        className="border-t border-[#E8EEE0] hover:bg-[#F3F8EC]"
                        key={order.id}
                      >
                        <td className="px-5 py-3 font-semibold text-[#124A0A]">
                          #{order.shopifyOrderId}
                        </td>
                        <td className="px-5 py-3">
                          {[order.customer?.firstName, order.customer?.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                            order.customer?.email ||
                            "—"}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <Pill
                            tone={
                              order.financialStatus === "paid"
                                ? "good"
                                : "warning"
                            }
                          >
                            {order.financialStatus ?? "Unknown"}
                          </Pill>
                        </td>
                        <td className="px-5 py-3">
                          <Pill
                            tone={
                              order.fulfillmentStatus === "fulfilled"
                                ? "good"
                                : "warning"
                            }
                          >
                            {order.fulfillmentStatus ?? "Unfulfilled"}
                          </Pill>
                        </td>
                        <td className="px-5 py-3">
                          {formatMoney(order.totalPrice)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {matches.length === 0 && (
              <p className="p-10 text-center text-[#4F5E4B]">
                {rows.length
                  ? "No orders match this search."
                  : "No orders yet."}
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
              noun="orders"
            />
          </Panel>
        </>
      )}
    </Shell>
  );
}
