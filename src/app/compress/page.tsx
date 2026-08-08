import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Minimize2 } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const CompressClient = dynamic(() => import("./CompressClient").then((m) => m.CompressClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("compress");

export default function CompressPage() {
  return (
    <ToolLayout
      seoSlug="compress"
      title="Compress PDF"
      description="Shrink PDF file size with Low, Medium, or High compression."
      icon={Minimize2}
    >
      <CompressClient />
    </ToolLayout>
  );
}
