import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const ExtractTextClient = dynamic(() => import("./ExtractTextClient").then((m) => m.ExtractTextClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("extract-text");

export default function ExtractTextPage() {
  return (
    <ToolLayout
      seoSlug="extract-text"
      title="Extract Text"
      description="Pull text content from your PDF for editing or export."
      icon={FileText}
    >
      <ExtractTextClient />
    </ToolLayout>
  );
}
