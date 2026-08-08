"use client";

import { TOOLS } from "@/lib/constants";
import { ToolCard } from "@/components/shared/ToolCard";

export function ToolsGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
      {TOOLS.map((tool, i) => (
        <ToolCard key={tool.slug} tool={tool} index={i} />
      ))}
    </div>
  );
}
