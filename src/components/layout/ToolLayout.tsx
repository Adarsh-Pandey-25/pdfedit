import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import type { LucideIcon } from "lucide-react";
import { Shield } from "lucide-react";
import type { ToolSlug } from "@/lib/constants";
import { getToolSeo } from "@/lib/seo-content";
import { ToolSeoContent } from "@/components/seo/ToolSeoContent";

type ToolLayoutProps = {
  children: ReactNode;
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** When set, renders SEO intro / how-to / FAQ / related tools below the tool UI */
  seoSlug?: ToolSlug;
};

export function ToolLayout({
  children,
  title,
  icon,
  seoSlug,
}: ToolLayoutProps) {
  const seo = seoSlug ? getToolSeo(seoSlug) : null;
  const heading = seo?.h1 ?? title;

  return (
    <div className="container-max section-pad pt-4 pb-8 sm:pt-6 sm:pb-12 lg:pt-8 min-h-[70vh]">
      <PageHeader title={heading} icon={icon} />
      <div className="mb-4 sm:mb-6 inline-flex max-w-full items-center gap-2 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 text-xs font-medium">
        <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate sm:whitespace-normal">
          Files processed locally in your browser — never uploaded to a server
        </span>
      </div>
      {children}
      {seoSlug ? <ToolSeoContent slug={seoSlug} /> : null}
    </div>
  );
}
