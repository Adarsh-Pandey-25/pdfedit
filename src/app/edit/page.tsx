import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { createToolMetadata } from "@/lib/seo";
import { Pencil } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { EditPageLoading } from "@/components/shared/ToolPageLoading";

const EditClient = dynamic(
  () => import("./EditClient").then((m) => m.EditClient),
  { ssr: false, loading: () => <EditPageLoading /> }
);

export const metadata: Metadata = createToolMetadata("edit");

export default function EditPage() {
  return (
    <ToolLayout
      seoSlug="edit"
      title="Edit PDF"
      description="Click existing text to edit it. Add annotations, search, save progress, and download."
      icon={Pencil}
    >
      <EditClient />
    </ToolLayout>
  );
}
