import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/lib/constants";
import { GUIDES } from "@/lib/guides";

/**
 * Generated from the same sources as canonicals and robots.txt (`SITE_URL`,
 * `TOOLS`, `GUIDES`), so new pages appear automatically. `lastmod` is set only
 * for guides, which record a real content date; other pages have no per-page
 * modification date, and a uniform build date would be a misleading signal.
 */
const STATIC_PAGES = ["/about", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    ...TOOLS.map((tool) => ({ url: `${SITE_URL}${tool.href}` })),
    ...STATIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    // Guides carry a real per-page date (`updated` in src/lib/guides.ts).
    { url: `${SITE_URL}/guides` },
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.updated,
    })),
  ];
}
