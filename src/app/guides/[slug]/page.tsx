import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/guides/GuideArticle";
import { GUIDE_CONTENT } from "@/components/guides/content";
import { createMetadata } from "@/lib/seo";
import { GUIDES, getGuide } from "@/lib/guides";

// Only the slugs below exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  // Fail the build, rather than ship a 404, if a listed guide has no content.
  const missing = GUIDES.filter((guide) => !GUIDE_CONTENT[guide.slug]);
  if (missing.length) {
    throw new Error(`Guide content missing for: ${missing.map((g) => g.slug).join(", ")}`);
  }
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const guide = getGuide(params.slug);
  if (!guide) return {};
  const base = createMetadata({
    title: guide.metaTitle,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords,
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
  };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  const content = GUIDE_CONTENT[params.slug];
  if (!guide || !content) notFound();
  return <GuideArticle meta={guide} content={content} />;
}
