import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { createToolMetadata } from "@/lib/seo";

const TextToPdfClient = dynamic(
  () => import("./TextToPdfClient").then((module) => module.TextToPdfClient),
  {
    ssr: false,
    loading: () => <div className="skeleton h-96 w-full rounded-3xl" />,
  }
);

export const metadata: Metadata = createToolMetadata("text-to-pdf");

export default function TextToPdfPage() {
  return (
    <ToolLayout
      seoSlug="text-to-pdf"
      title="Text to PDF"
      description="Create a professional PDF with headings, lists, Unicode typography, and automatic page layout."
      icon={FileText}
    >
      <TextToPdfClient />
    </ToolLayout>
  );
}

