"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[38px] leading-tight font-bold text-[#124A0A]">
          {title}
        </h1>
        <p className="mt-1 text-[15px] text-[#4F5E4B]">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

export function Summary({
  items,
}: {
  items: Array<{ label: string; value: string | number; danger?: boolean }>;
}) {
  return (
    <section
      aria-label="Summary"
      className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <article
          key={item.label}
          className="flex min-h-[100px] flex-col gap-1 rounded-[14px] border border-[#DFE6D6] bg-white px-5 py-4"
        >
          <span className="text-sm font-medium text-[#4F5E4B]">
            {item.label}
          </span>
          <strong
            className={`text-[34px] leading-tight ${item.danger ? "text-[#8A2A1B]" : "text-[#124A0A]"}`}
          >
            {item.value}
          </strong>
        </article>
      ))}
    </section>
  );
}

export function Panel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section
      aria-label={label}
      className="min-w-0 overflow-hidden rounded-[14px] border border-[#DFE6D6] bg-white"
    >
      {children}
    </section>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "good" | "warning" | "danger" | "neutral";
}) {
  const colors = {
    good: "bg-[#DDF0CB] text-[#124A0A]",
    warning: "bg-[#FCEFC7] text-[#7A4B00]",
    danger: "bg-[#FBE3DE] text-[#8A2A1B]",
    neutral: "bg-[#E8ECE4] text-[#3E4D3A]",
  };
  return (
    <span
      className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${colors[tone]}`}
    >
      {children}
    </span>
  );
}

export function DataState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  if (loading)
    return (
      <output className="rounded-[14px] border border-[#DFE6D6] bg-white p-10 text-center text-[#4F5E4B]">
        Loading data…
      </output>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-[14px] border border-[#DFE6D6] bg-white p-10 text-center"
      >
        <p className="mb-4 text-[#8A2A1B]">{error}</p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  return null;
}

export function Pager({
  page,
  setPage,
  size,
  setSize,
  count,
  noun,
}: {
  page: number;
  setPage: (page: number) => void;
  size: number;
  setSize: (size: number) => void;
  count: number;
  noun: string;
}) {
  const pages = Math.max(1, Math.ceil(count / size));
  const current = Math.min(page, pages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DFE6D6] px-5 py-3 text-sm text-[#4F5E4B]">
      <div className="flex flex-wrap items-center gap-4">
        <label className="font-semibold text-[#3E4D3A]" htmlFor="page-size">
          Rows per page
        </label>
        <select
          id="page-size"
          value={size}
          onChange={(event) => setSize(Number(event.target.value))}
          className="h-11 rounded-lg border border-[#B9C7AC] bg-white px-3 text-[#1C2A1A]"
        >
          <option>5</option>
          <option>10</option>
          <option>25</option>
        </select>
        <span>
          Showing{" "}
          {count
            ? `${(current - 1) * size + 1}–${Math.min(current * size, count)}`
            : "0"}{" "}
          of {count} {noun}
        </span>
      </div>
      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center gap-2"
      >
        <Button
          variant="outline"
          disabled={current === 1}
          onClick={() => setPage(current - 1)}
        >
          Previous
        </Button>
        {Array.from({ length: pages }, (_, index) => index + 1).map(
          (number) => (
            <Button
              key={number}
              size="icon"
              variant={current === number ? "default" : "outline"}
              aria-label={`Page ${number}`}
              aria-current={current === number ? "page" : undefined}
              onClick={() => setPage(number)}
            >
              {number}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}

export function Filters({
  values,
  selected,
  onSelect,
}: {
  values: Array<{ label: string; count: number }>;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <fieldset aria-label="Filter by status" className="flex flex-wrap gap-2">
      {values.map(({ label, count }) => (
        <Button
          key={label}
          className="rounded-full"
          variant={label === selected ? "default" : "outline"}
          aria-pressed={label === selected}
          onClick={() => onSelect(label)}
        >
          {label} <span className="opacity-80">{count}</span>
        </Button>
      ))}
    </fieldset>
  );
}
