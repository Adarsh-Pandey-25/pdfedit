import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Droplets } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const WatermarkClient = dynamic(() => import("./WatermarkClient").then((m) => m.WatermarkClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("watermark");

export default function WatermarkPage() {
  return (
    <ToolLayout
      seoSlug="watermark"
      title="Watermark PDF"
      description="Add a text watermark to every page, with a live preview of the result."
      icon={Droplets}
    >
      <WatermarkClient />
    </ToolLayout>
  );
}
