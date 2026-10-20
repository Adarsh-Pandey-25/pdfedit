import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTool, type ToolSlug } from "@/lib/constants";

/** Shared focus style for guide links and cards. */
export const guideFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

/** Inline link. Underlined, and darker than the brand orange so it stays readable. */
export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`font-medium text-primary-dark underline underline-offset-2 hover:no-underline dark:text-primary-light rounded-sm ${guideFocus}`}
    >
      {children}
    </Link>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="pt-2 text-lg font-semibold text-text-primary">{children}</h3>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-5 space-y-2 marker:font-semibold marker:text-text-primary">{children}</ol>;
}

export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2">{children}</ul>;
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-text-primary">
      {children}
    </code>
  );
}

/** A highlighted note. `tone="warning"` for things that can lose work. */
export function Note({
  title,
  tone = "info",
  children,
}: {
  title: string;
  tone?: "info" | "warning";
  children: ReactNode;
}) {
  return (
    <aside
      className={
        tone === "warning"
          ? "rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5"
          : "rounded-2xl border border-primary/15 bg-bg-secondary/60 p-4 sm:p-5"
      }
    >
      <p className="font-semibold text-text-primary">{title}</p>
      <div className="mt-1.5 space-y-2">{children}</div>
    </aside>
  );
}

/** A simple two-column table, for examples such as page ranges. */
export function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: [string, string];
  rows: [ReactNode, ReactNode][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-primary/15">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-bg-secondary/60 text-text-primary">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-semibold">{head[0]}</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">{head[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b], i) => (
            <tr key={i} className="border-t border-primary/10 align-top">
              <td className="px-4 py-2.5 whitespace-nowrap">{a}</td>
              <td className="px-4 py-2.5">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Card linking to the tool a guide teaches. */
export function ToolCta({ tool, text }: { tool: ToolSlug; text: string }) {
  const def = getTool(tool);
  if (!def) return null;
  const Icon = def.icon;
  return (
    <Link
      href={def.href}
      className={`card-surface group flex items-center gap-4 rounded-2xl p-4 sm:p-5 hover:border-primary/40 transition-colors ${guideFocus}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-dark dark:text-primary-light">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-text-primary">
          Open {def.title}
        </span>
        <span className="block text-sm text-text-secondary">{text}</span>
      </span>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-text-secondary group-hover:translate-x-0.5 transition-transform"
        aria-hidden
      />
    </Link>
  );
}
