"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";

export function AdminStatCard({
  label,
  value,
  change,
  icon,
  color = "#FF7F50",
  href,
}: {
  label: string;
  value: string;
  change: string;
  icon: ReactNode;
  color?: string;
  href?: string;
}) {
  const card = (
    <article
      className="group relative rounded-[1.8rem] border border-[var(--border)] bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)] hover:shadow-[0_28px_60px_rgba(15,23,42,0.10)] transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[1.8rem]" style={{ background: color }} />

      {/* Background glow */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-[0.06] transition-opacity group-hover:opacity-[0.10]"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 duration-300"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ background: `${color}15`, color }}
          >
            {change}
          </div>
          {href && (
            <ArrowUpRight
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color }}
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
          {value}
        </p>
      </div>
    </article>
  );

  if (href) return <Link href={href} className="block">{card}</Link>;
  return card;
}
