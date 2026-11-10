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
  Truncate,
} from "@/components/crm/shared";
import { Shell } from "@/components/crm/shell";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/lib/crm-api";
import { formatMoney, type ProductRecord } from "@/lib/crm-types";

function inventory(product: ProductRecord) {
  const levels = product.inventoryLevels ?? [];
  const available = levels.reduce((sum, row) => sum + row.available, 0);
  const onHand = levels.reduce((sum, row) => sum + row.onHand, 0);
  const committed = levels.reduce((sum, row) => sum + row.committed, 0);
  const threshold = levels.reduce(
    (sum, row) => sum + (row.lowStockThreshold ?? 0),
    0,
  );
  const stock = !levels.length
    ? "Not tracked"
    : available <= 0
      ? "Out of stock"
      : threshold > 0 && available <= threshold
        ? "Low stock"
        : "In stock";
  return { available, onHand, committed, threshold, stock };
}

export default function ProductsPage() {
  const { rows, loading, error, refresh } =
    useCollection<ProductRecord>("/api/product");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const needsAttention = (product: ProductRecord) =>
    ["Low stock", "Out of stock"].includes(inventory(product).stock);
  const matches = rows.filter(
    (product) =>
      (filter === "All" ||
        (filter === "Needs attention"
          ? needsAttention(product)
          : inventory(product).stock === "In stock")) &&
      [product.title, product.sku]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const current = Math.min(page, Math.max(1, Math.ceil(matches.length / size)));
  return (
    <Shell>
      <PageHeader
        title="Products"
        description="Variants and stock mirrored from Shopify. Adjust quantities in Shopify Admin."
      />
      <DataState loading={loading} error={error} retry={refresh} />
      {!loading && !error && (
        <>
          <Summary
            items={[
              { label: "Variants", value: rows.length },
              {
                label: "Low stock",
                value: rows.filter(
                  (row) => inventory(row).stock === "Low stock",
                ).length,
              },
              {
                label: "Out of stock",
                value: rows.filter(
                  (row) => inventory(row).stock === "Out of stock",
                ).length,
                danger: true,
              },
              {
                label: "Units available",
                value: rows.reduce(
                  (sum, row) => sum + inventory(row).available,
                  0,
                ),
              },
            ]}
          />
          <Panel label="Products list">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#DFE6D6] p-5">
              <Filters
                values={[
                  { label: "All", count: rows.length },
                  {
                    label: "Needs attention",
                    count: rows.filter(needsAttention).length,
                  },
                  {
                    label: "In stock",
                    count: rows.filter(
                      (row) => inventory(row).stock === "In stock",
                    ).length,
                  },
                ]}
                selected={filter}
                onSelect={(value) => {
                  setFilter(value);
                  setPage(1);
                }}
              />
              <label
                htmlFor="product-search"
                className="w-full max-w-[340px] text-[13px] font-semibold"
              >
                Search products
                <Input
                  id="product-search"
                  type="search"
                  className="mt-1 h-11"
                  placeholder="Product or SKU"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-[15px]">
                <thead className="bg-[#F5F7F1] text-xs font-bold tracking-wide text-[#3E4D3A] uppercase">
                  <tr>
                    {[
                      "Product",
                      "SKU",
                      "Price",
                      "Available",
                      "On hand",
                      "Committed",
                      "Alert at",
                      "Stock",
                    ].map((label) => (
                      <th scope="col" key={label} className="px-4 py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches
                    .slice((current - 1) * size, current * size)
                    .map((product) => {
                      const qty = inventory(product);
                      return (
                        <tr
                          className="border-t border-[#E8EEE0] hover:bg-[#F3F8EC]"
                          key={product.id}
                        >
                          <td className="max-w-[250px] px-4 py-3 font-semibold text-[#124A0A]">
                            <Truncate>
                              {product.title || "Untitled variant"}
                            </Truncate>
                          </td>
                          <td className="max-w-[200px] px-4 py-3">
                            <Truncate>{product.sku || "—"}</Truncate>
                          </td>
                          <td className="px-4 py-3">
                            {product.price == null
                              ? "—"
                              : formatMoney(product.price)}
                          </td>
                          <td className="px-4 py-3">{qty.available}</td>
                          <td className="px-4 py-3">{qty.onHand}</td>
                          <td className="px-4 py-3">{qty.committed}</td>
                          <td className="px-4 py-3">{qty.threshold || "—"}</td>
                          <td className="px-4 py-3">
                            <Pill
                              tone={
                                qty.stock === "Out of stock"
                                  ? "danger"
                                  : qty.stock === "Low stock"
                                    ? "warning"
                                    : qty.stock === "In stock"
                                      ? "good"
                                      : "neutral"
                              }
                            >
                              {qty.stock}
                            </Pill>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {matches.length === 0 && (
              <p className="p-10 text-center text-[#4F5E4B]">
                {rows.length
                  ? "No products match this search."
                  : "No products yet."}
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
              noun="variants"
            />
          </Panel>
        </>
      )}
    </Shell>
  );
}
