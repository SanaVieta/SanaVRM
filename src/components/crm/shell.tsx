"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { routes } from "@/lib/client-routes"


export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[#F5F7F1] text-[#1C2A1A] md:flex">
      <aside className="flex shrink-0 flex-col border-b border-[#DFE6D6] bg-white p-4 md:min-h-screen md:w-[248px] md:border-r md:border-b-0 md:px-4 md:py-6">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-0.5 px-3 text-[25px] font-bold tracking-[-.065em] text-[#1B6510] md:mb-8"
        >
          <img src="/icon.png" alt="SanaVieta CRM" className="h-10 w-10" />
          Sana<span className="text-[#6DA245]">Vrm</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex gap-1 overflow-x-auto md:flex-col"
        >
          {routes.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/" || pathname.startsWith("/leads/")
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-[10px] px-3 text-[15px] font-semibold transition-colors hover:bg-[#F3F8EC] ${active ? "bg-[#E4F2D5] text-[#124A0A]" : "text-[#3E4D3A]"}`}
              >
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-[#DFE6D6] pt-5 md:flex md:items-center md:gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B6510] text-sm font-semibold text-white">
            SV
          </span>
          <span className="text-sm font-semibold">SanaVieta CRM</span>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
