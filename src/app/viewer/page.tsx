import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Eye } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const ViewerClient = dynamic(() => import("./ViewerClient").then((m) => m.ViewerClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("viewer");

export default function ViewerPage() {
  return (
    <ToolLayout
      seoSlug="viewer"
      title="PDF Viewer"
      description="Full-featured reader with zoom, search, and thumbnails."
      icon={Eye}
    >
      <ViewerClient />
    </ToolLayout>
  );
}
