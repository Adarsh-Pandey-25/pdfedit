import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";
import { PenTool } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import dynamic from "next/dynamic";

const SignClient = dynamic(() => import("./SignClient").then((m) => m.SignClient), { ssr: false, loading: () => <div className="skeleton h-48 w-full rounded-3xl" /> });

export const metadata: Metadata = createToolMetadata("sign");

export default function SignPage() {
  return (
    <ToolLayout
      seoSlug="sign"
      title="Sign PDF"
      description="Draw, type, or upload a signature and place it on any page."
      icon={PenTool}
    >
      <SignClient />
    </ToolLayout>
  );
}
