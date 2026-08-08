import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { FileType } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const WordToPdfClient = dynamic(() => import("./WordToPdfClient").then((m) => m.WordToPdfClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("word-to-pdf");

export default function WordToPdfPage() {
  return (
    <ToolLayout
      seoSlug="word-to-pdf"
      title="Word to PDF"
      description="Convert .docx files to PDF while keeping readable formatting."
      icon={FileType}
    >
      <WordToPdfClient />
    </ToolLayout>
  );
}
