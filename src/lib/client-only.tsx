"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export function clientOnly<T extends ComponentType<Record<string, never>>>(
  loader: () => Promise<{ default: T } | T>
) {
  return dynamic(
    async () => {
      const mod = await loader();
      return "default" in (mod as object)
        ? (mod as { default: T })
        : { default: mod as T };
    },
    {
      ssr: false,
      loading: () => (
        <div className="skeleton h-48 w-full rounded-3xl" aria-hidden />
      ),
    }
  );
}
