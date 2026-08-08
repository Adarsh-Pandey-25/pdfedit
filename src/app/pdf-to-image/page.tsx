import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { ImageIcon } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const PdfToImageClient = dynamic(() => import("./PdfToImageClient").then((m) => m.PdfToImageClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("pdf-to-image");

export default function PdfToImagePage() {
  return (
    <ToolLayout
      seoSlug="pdf-to-image"
      title="PDF to Image"
      description="Render each page as a high-quality PNG or JPG."
      icon={ImageIcon}
    >
      <PdfToImageClient />
    </ToolLayout>
  );
}
