import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Scissors } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const SplitClient = dynamic(() => import("./SplitClient").then((m) => m.SplitClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("split");

export default function SplitPage() {
  return (
    <ToolLayout
      seoSlug="split"
      title="Split PDF"
      description="Extract pages or split every page into its own PDF."
      icon={Scissors}
    >
      <SplitClient />
    </ToolLayout>
  );
}
