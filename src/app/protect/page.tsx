import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { Lock } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const ProtectClient = dynamic(() => import("./ProtectClient").then((m) => m.ProtectClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("protect");

export default function ProtectPage() {
  return (
    <ToolLayout
      seoSlug="protect"
      title="Protect PDF"
      description="Add open/edit passwords and control permissions."
      icon={Lock}
    >
      <ProtectClient />
    </ToolLayout>
  );
}
