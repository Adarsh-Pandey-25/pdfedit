import { SITE_NAME, SITE_URL, TOOLS } from "@/lib/constants";
import type { FaqItem } from "@/lib/seo-content";

function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
        description: "Free online PDF editor with 15+ browser-based tools",
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@pdfforge.app",
          contactType: "customer support",
        },
      }}
    />
  );
}

export function WebApplicationSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern browser",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: TOOLS.map((t) => t.title),
        description:
          "Free browser-based PDF editor. Edit, merge, split, compress, convert, sign, and watermark PDFs privately on your device.",
      }}
    />
  );
}

export function SoftwareApplicationSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: `${SITE_NAME} PDF Editor`,
        operatingSystem: "Web Browser",
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "Offer",
          price: "0.00",
          priceCurrency: "USD",
        },
        url: SITE_URL,
      }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: FaqItem[] }) {
  if (!faqs.length) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.name,
          item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
        })),
      }}
    />
  );
}

export function HowToSchema({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: string[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        description,
        step: steps.map((text, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: `Step ${idx + 1}`,
          text,
        })),
      }}
    />
  );
}
