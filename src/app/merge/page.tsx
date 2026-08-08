import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Combine } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const MergeClient = dynamic(() => import("./MergeClient").then((m) => m.MergeClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("merge");

export default function MergePage() {
  return (
    <ToolLayout
      seoSlug="merge"
      title="Merge PDF"
      description="Combine multiple PDFs into one document. Drag to reorder, then merge."
      icon={Combine}
    >
      <MergeClient />
    </ToolLayout>
  );
}
