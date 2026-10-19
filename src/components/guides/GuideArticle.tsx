import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { formatGuideDate, getGuide, type GuideMeta } from "@/lib/guides";
import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { ToolCta, guideFocus } from "@/components/guides/GuideProse";

export type GuideSection = { id: string; title: string; body: ReactNode };

export type GuideContent = {
  /** Opening paragraphs: answer the reader's question up front. */
  intro: ReactNode;
  sections: GuideSection[];
  /** One line under "Open <tool>" at the end of the article. */
  ctaText: string;
};

export function GuideArticle({
  meta,
  content,
}: {
  meta: GuideMeta;
  content: GuideContent;
}) {
  const url = `${SITE_URL}/guides/${meta.slug}`;
  const related = meta.related
    .map((slug) => getGuide(slug))
    .filter((guide) => guide !== undefined);

  return (
    <div className="container-max section-pad py-8 sm:py-12">
      <ArticleSchema
        headline={meta.title}
        description={meta.description}
        url={url}
        datePublished={meta.published}
        dateModified={meta.updated}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Guides", url: `${SITE_URL}/guides` },
          { name: meta.title, url },
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-secondary">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className={`hover:text-primary rounded-sm ${guideFocus}`}>
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link href="/guides" className={`hover:text-primary rounded-sm ${guideFocus}`}>
              Guides
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="text-text-primary">
            {meta.title}
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary text-balance">
            {meta.title}
          </h1>
          <p className="mt-4 text-xs text-text-secondary">
            Published by {SITE_NAME} on{" "}
            <time dateTime={meta.published}>{formatGuideDate(meta.published)}</time>
            {meta.updated !== meta.published && (
              <>
                {" "}· Updated{" "}
                <time dateTime={meta.updated}>{formatGuideDate(meta.updated)}</time>
              </>
            )}
          </p>
          <div className="mt-6 h-px bg-primary/10" />
        </header>

        <div className="space-y-4 text-text-secondary text-[15px] sm:text-base leading-relaxed">
          {content.intro}
        </div>

        <nav
          aria-labelledby="toc-heading"
          className="mt-8 rounded-2xl border border-primary/15 bg-bg-secondary/40 p-4 sm:p-5"
        >
          <h2 id="toc-heading" className="font-semibold text-text-primary">
            On this page
          </h2>
          <ol className="mt-2 space-y-1.5 text-sm list-decimal pl-5 text-text-secondary">
            {content.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`hover:text-primary hover:underline rounded-sm ${guideFocus}`}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {content.sections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={section.id}
            className="mt-10 space-y-4 text-text-secondary text-[15px] sm:text-base leading-relaxed"
          >
            <h2
              id={section.id}
              className="scroll-mt-24 text-2xl font-bold tracking-tight text-text-primary"
            >
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}

        <section aria-labelledby="next-step-heading" className="mt-12 space-y-4">
          <h2
            id="next-step-heading"
            className="text-2xl font-bold tracking-tight text-text-primary"
          >
            Try it
          </h2>
          <ToolCta tool={meta.tool} text={content.ctaText} />
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-guides-heading" className="mt-12">
            <h2
              id="related-guides-heading"
              className="text-2xl font-bold tracking-tight text-text-primary"
            >
              Related guides
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className={`card-surface block h-full rounded-2xl p-4 hover:border-primary/40 transition-colors ${guideFocus}`}
                  >
                    <span className="block font-semibold text-text-primary">
                      {guide.title}
                    </span>
                    <span className="mt-1 block text-sm text-text-secondary">
                      {guide.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
