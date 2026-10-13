"use client";

import Link from "next/link";
import { memo, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ToolDef, ToolSlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ToolCardProps = {
  tool: ToolDef;
  index?: number;
};

/**
 * Per-tool accent so the grid reads at a glance (same idea file managers and
 * office suites use for file-type colors — blue for Word, green for sheets,
 * etc.). Translucent background + solid text keeps each pair legible in both
 * themes without a separate dark-mode background (see Navbar's status pill).
 */
const TOOL_ACCENT: Record<ToolSlug, string> = {
  merge: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  split: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  compress: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "pdf-to-image": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "image-to-pdf": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  "word-to-pdf": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "text-to-pdf": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  rotate: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  watermark: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  "page-numbers": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  viewer: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  edit: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  protect: "bg-red-500/10 text-red-600 dark:text-red-400",
  unlock: "bg-green-500/10 text-green-600 dark:text-green-400",
  sign: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "extract-text": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const preloaded = new Set<string>();

async function preloadTool(slug: string) {
  if (preloaded.has(slug)) return;
  preloaded.add(slug);

  // Warm the route chunk + common PDF libs so navigation feels instant
  const tasks: Promise<unknown>[] = [];

  switch (slug) {
    case "edit":
      tasks.push(
        import("@/app/edit/EditClient"),
        import("pdfjs-dist"),
        import("pdf-lib")
      );
      break;
    case "merge":
    case "split":
    case "compress":
    case "rotate":
    case "protect":
    case "unlock":
    case "watermark":
    case "page-numbers":
      tasks.push(import("pdf-lib"));
      break;
    case "viewer":
    case "pdf-to-image":
    case "extract-text":
      tasks.push(import("pdfjs-dist"));
      break;
    case "sign":
      tasks.push(import("pdfjs-dist"), import("pdf-lib"));
      break;
    default:
      break;
  }

  await Promise.allSettled(tasks);
}

function ToolCardComponent({ tool, index = 0 }: ToolCardProps) {
  const Icon = tool.icon;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const delay = Math.min(index * 0.03, 0.24);
  const preloading = useRef(false);

  const warm = useCallback(() => {
    if (preloading.current) return;
    preloading.current = true;
    void preloadTool(tool.slug);
    router.prefetch(tool.href);
  }, [router, tool.href, tool.slug]);

  const onNavigate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      ) {
        return;
      }
      e.preventDefault();
      setLoading(true);
      warm();
      router.push(tool.href);
    },
    [router, tool.href, warm]
  );

  return (
    <article className="h-full">
      <Link
        href={tool.href}
        // Prefetch on intent (warm) rather than on viewport entry: viewport
        // prefetch pulled every visible tool's bundle — including the 550 KB
        // editor — onto the homepage's main thread.
        prefetch={false}
        onMouseEnter={warm}
        onFocus={warm}
        onTouchStart={warm}
        onClick={onNavigate}
        aria-busy={loading}
        className={cn(
          "group relative flex h-full min-h-[112px] sm:min-h-[140px] flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6",
          "card-surface cursor-pointer",
          "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft",
          "active:scale-[0.99] transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "anim-fade-up"
        )}
        style={{ animationDelay: `${delay}s` }}
      >
        {loading && (
          <span className="absolute inset-0 z-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-bg-card/85 backdrop-blur-[2px]">
            <span
              className="h-8 w-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
          </span>
        )}
        <span
          className={cn(
            "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl transition-transform duration-200 group-hover:scale-105",
            TOOL_ACCENT[tool.slug]
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </span>
        <div className="flex flex-1 flex-col min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
            {tool.title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-2 sm:line-clamp-3">
            {tool.description}
          </p>
        </div>
      </Link>
    </article>
  );
}

export const ToolCard = memo(ToolCardComponent);
