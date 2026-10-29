import Link from "next/link";
import { getTool, type ToolSlug } from "@/lib/constants";
import { getToolSeo, type SeoRichText } from "@/lib/seo-content";
import {
  BreadcrumbSchema,
  FAQSchema,
  HowToSchema,
} from "@/components/seo/StructuredData";
import { SITE_URL } from "@/lib/constants";
import { GUIDES } from "@/lib/guides";
import { A } from "@/components/guides/GuideProse";

/** Section text, with each `links[].text` (first occurrence) as a link. */
function RichText({ value }: { value: SeoRichText }) {
  if (typeof value === "string") return <>{value}</>;
  const parts: React.ReactNode[] = [];
  let rest = value.text;
  value.links.forEach((link, i) => {
    const at = rest.indexOf(link.text);
    if (at < 0) return;
    parts.push(rest.slice(0, at), <A key={i} href={link.href}>{link.text}</A>);
    rest = rest.slice(at + link.text.length);
  });
  parts.push(rest);
  return <>{parts}</>;
}

export function ToolSeoContent({ slug }: { slug: ToolSlug }) {
  const seo = getToolSeo(slug);
  const guide = GUIDES.find((g) => g.tool === slug);
  const related = seo.related
    .map((s) => getTool(s))
    .filter(Boolean) as NonNullable<ReturnType<typeof getTool>>[];

  return (
    <div className="mt-14 space-y-12 border-t border-primary/10 pt-12">
      <BreadcrumbSchema
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/#tools` },
          { name: seo.h1, url: `${SITE_URL}/${slug}` },
        ]}
      />
      <HowToSchema
        name={seo.howToTitle}
        description={seo.description}
        steps={seo.steps}
      />
      <FAQSchema faqs={seo.faqs} />

      <section aria-labelledby={`${slug}-intro-heading`} className="max-w-3xl">
        <h2 id={`${slug}-intro-heading`} className="sr-only">
          About {seo.h1}
        </h2>
        <p className="text-text-secondary leading-relaxed text-[15px] sm:text-base">
          {seo.intro}
        </p>
      </section>

      <section aria-labelledby={`${slug}-howto-heading`} className="max-w-3xl">
        <h2
          id={`${slug}-howto-heading`}
          className="text-2xl font-bold tracking-tight text-text-primary"
        >
          {seo.howToTitle}
        </h2>
        <ol className="mt-4 space-y-3 list-decimal pl-5 text-text-secondary text-[15px] leading-relaxed">
          {seo.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {guide && (
          <p className="mt-4 text-text-secondary text-[15px] leading-relaxed">
            Want more detail?{" "}
            <A href={`/guides/${guide.slug}`}>{guide.toolLinkText}</A> step by
            step, including what to check before you share the result.
          </p>
        )}
      </section>

      <section aria-labelledby={`${slug}-features-heading`} className="max-w-3xl">
        <h2
          id={`${slug}-features-heading`}
          className="text-2xl font-bold tracking-tight text-text-primary"
        >
          {seo.featuresTitle}
        </h2>
        <ul className="mt-4 space-y-2 list-disc pl-5 text-text-secondary text-[15px] leading-relaxed">
          {seo.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      {seo.sections?.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`${slug}-${section.id}-heading`}
          className="max-w-3xl"
        >
          <h2
            id={`${slug}-${section.id}-heading`}
            className="text-2xl font-bold tracking-tight text-text-primary"
          >
            {section.heading}
          </h2>
          {section.paragraphs?.map((p, i) => (
            <p
              key={i}
              className="mt-4 text-text-secondary text-[15px] leading-relaxed"
            >
              <RichText value={p} />
            </p>
          ))}
          {section.items && (
            <ul className="mt-4 space-y-2 list-disc pl-5 text-text-secondary text-[15px] leading-relaxed">
              {section.items.map((item, i) => (
                <li key={i}>
                  <RichText value={item} />
                </li>
              ))}
            </ul>
          )}
          {section.subsections?.map((sub) => (
            <div key={sub.heading} className="mt-5">
              <h3 className="font-semibold text-text-primary">{sub.heading}</h3>
              <p className="mt-1 text-text-secondary text-[15px] leading-relaxed">
                <RichText value={sub.text} />
              </p>
            </div>
          ))}
        </section>
      ))}

      <section aria-labelledby={`${slug}-faq-heading`} className="max-w-3xl">
        <h2
          id={`${slug}-faq-heading`}
          className="text-2xl font-bold tracking-tight text-text-primary"
        >
          Frequently Asked Questions
        </h2>
        <div className="mt-4 space-y-3">
          {seo.faqs.map((faq) => (
            <details
              key={faq.q}
              className="card-surface rounded-2xl px-4 py-3 group"
            >
              <summary className="cursor-pointer font-semibold text-text-primary list-none flex items-center justify-between gap-3">
                {faq.q}
                <span className="text-primary text-lg leading-none group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed pr-6">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby={`${slug}-related-heading`}>
          <h2
            id={`${slug}-related-heading`}
            className="text-2xl font-bold tracking-tight text-text-primary"
          >
            Related PDF tools
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            You might also like these free tools:
          </p>
          <ul className="mt-4 grid sm:grid-cols-3 gap-3">
            {related.map((tool) => (
              <li key={tool.slug}>
                <Link
                  href={tool.href}
                  className="card-surface rounded-2xl p-4 block h-full hover:border-primary/40 transition-colors"
                >
                  <span className="font-semibold text-text-primary group-hover:text-primary">
                    {tool.title}
                  </span>
                  <span className="mt-1 block text-sm text-text-secondary">
                    {tool.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
