import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { SITE_NAME, getTool } from "@/lib/constants";
import { GUIDES, formatGuideDate } from "@/lib/guides";
import { guideFocus } from "@/components/guides/GuideProse";

export const metadata: Metadata = createMetadata({
  title: "PDF Guides and Tutorials",
  description:
    "Step-by-step guides to merging, splitting, and compressing PDFs: what each step does, what to check afterwards, and how to fix common problems.",
  path: "/guides",
  keywords: ["pdf guides", "pdf tutorials", "how to merge pdf", "how to split pdf", "how to compress pdf"],
});

export default function GuidesPage() {
  return (
    <div className="container-max section-pad py-8 sm:py-12 min-h-[70vh]">
      <header className="max-w-3xl mb-10">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-dark dark:text-primary-light mb-2">
          <BookOpen className="h-4 w-4" aria-hidden />
          Guides
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
          PDF guides and tutorials
        </h1>
        <p className="mt-3 text-text-secondary text-base sm:text-lg max-w-2xl">
          Practical, step-by-step help with everyday PDF jobs. Each guide
          explains what to do, what to check in the finished file, and how to
          fix the problems people run into most. You can follow along with the
          free {SITE_NAME} tools, which run in your browser.
        </p>
      </header>

      {GUIDES.length === 0 ? (
        <p className="text-text-secondary">
          No guides are published yet. In the meantime, all tools are listed on
          the{" "}
          <Link href="/#tools" className="text-primary-dark dark:text-primary-light underline">
            homepage
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => {
            const tool = getTool(guide.tool);
            return (
              <li key={guide.slug} className="card-surface rounded-2xl p-5 flex flex-col">
                <h2 className="text-lg font-semibold text-text-primary leading-snug">
                  <Link
                    href={`/guides/${guide.slug}`}
                    className={`hover:text-primary rounded-sm ${guideFocus}`}
                  >
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed flex-1">
                  {guide.summary}
                </p>
                <p className="mt-4 text-xs text-text-secondary">
                  Updated{" "}
                  <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time>
                  {tool && (
                    <>
                      {" "}· Tool:{" "}
                      <Link
                        href={tool.href}
                        className={`font-medium text-primary-dark dark:text-primary-light underline underline-offset-2 hover:no-underline rounded-sm ${guideFocus}`}
                      >
                        {tool.title}
                      </Link>
                    </>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
