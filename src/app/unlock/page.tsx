import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Unlock } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const UnlockClient = dynamic(() => import("./UnlockClient").then((m) => m.UnlockClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("unlock");

export default function UnlockPage() {
  return (
    <ToolLayout
      seoSlug="unlock"
      title="Unlock PDF"
      description="Remove password protection from a PDF you have access to."
      icon={Unlock}
    >
      <UnlockClient />
    </ToolLayout>
  );
}
