import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./constants";
import type { ToolSlug } from "./constants";
import { getToolSeo } from "./seo-content";

const DEFAULT_KEYWORDS = [
  "pdf editor",
  "edit pdf online",
  "free pdf editor",
  "merge pdf",
  "split pdf",
  "compress pdf",
  "sign pdf",
  "pdf watermark",
  "online pdf tools",
  "pdf converter",
  "free pdf tools",
];

export function createMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  ogImage = "/og-image.png",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const defaultTitle = `${SITE_NAME} - Free Online PDF Editor | Edit, Merge, Split, Convert PDFs`;
  const pageTitle = title || defaultTitle;
  // Layout applies `title.template` (`%s | SITE_NAME`); keep page titles short.
  const brandedTitle = title ? `${title} | ${SITE_NAME}` : defaultTitle;
  const desc = description || SITE_DESCRIPTION;
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;

  return {
    title: title ? pageTitle : { absolute: defaultTitle },
    description: desc,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    applicationName: SITE_NAME,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    category: "productivity",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title: brandedTitle,
      description: desc,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - Free Online PDF Editor`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description: desc,
      images: [ogImage === "/og-image.png" ? "/twitter-card.png" : ogImage],
      creator: "@pdfforge",
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

export function createToolMetadata(slug: ToolSlug): Metadata {
  const seo = getToolSeo(slug);
  return createMetadata({
    title: seo.title,
    description: seo.description,
    path: `/${slug}`,
    keywords: seo.keywords,
  });
}
