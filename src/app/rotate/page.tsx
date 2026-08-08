import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { RotateCw } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const RotateClient = dynamic(() => import("./RotateClient").then((m) => m.RotateClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("rotate");

export default function RotatePage() {
  return (
    <ToolLayout
      seoSlug="rotate"
      title="Rotate PDF"
      description="Rotate individual pages or the entire document."
      icon={RotateCw}
    >
      <RotateClient />
    </ToolLayout>
  );
}
