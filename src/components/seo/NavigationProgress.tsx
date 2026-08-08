"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const bar = document.getElementById("nav-progress");
    if (!bar) return;
    bar.style.opacity = "0";
    bar.style.transform = "scaleX(0)";
    bar.style.transition = "none";
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;

      try {
        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      const bar = document.getElementById("nav-progress");
      if (!bar) return;
      bar.style.transition = "transform 0.35s ease, opacity 0.2s ease";
      bar.style.opacity = "1";
      bar.style.transform = "scaleX(0.35)";
      requestAnimationFrame(() => {
        bar.style.transform = "scaleX(0.75)";
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      id="nav-progress"
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[200] h-[3px] w-full origin-left scale-x-0 bg-gradient-to-r from-primary to-secondary opacity-0"
    />
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressInner />
    </Suspense>
  );
}
