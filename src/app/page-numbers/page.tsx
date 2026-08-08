import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Hash } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const PageNumbersClient = dynamic(() => import("./PageNumbersClient").then((m) => m.PageNumbersClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("page-numbers");

export default function PageNumbersPage() {
  return (
    <ToolLayout
      seoSlug="page-numbers"
      title="Page Numbers"
      description="Stamp page numbers with flexible formats and positions."
      icon={Hash}
    >
      <PageNumbersClient />
    </ToolLayout>
  );
}
