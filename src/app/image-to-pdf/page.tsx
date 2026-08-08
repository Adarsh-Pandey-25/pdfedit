import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Images } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const ImageToPdfClient = dynamic(() => import("./ImageToPdfClient").then((m) => m.ImageToPdfClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("image-to-pdf");

export default function ImageToPdfPage() {
  return (
    <ToolLayout
      seoSlug="image-to-pdf"
      title="Image to PDF"
      description="Create a polished PDF from your images."
      icon={Images}
    >
      <ImageToPdfClient />
    </ToolLayout>
  );
}
