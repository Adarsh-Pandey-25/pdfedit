"use client";

import Link from "next/link";
import { memo, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ToolDef } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ToolCardProps = {
  tool: ToolDef;
  index?: number;
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
        prefetch
        onMouseEnter={warm}
        onFocus={warm}
        onTouchStart={warm}
        onClick={onNavigate}
        aria-label={`Open ${tool.title} — ${tool.description}`}
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
        <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary-light text-primary transition-transform duration-200 group-hover:scale-105">
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
