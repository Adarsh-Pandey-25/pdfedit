import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/lib/constants";

/**
 * Generated from the same sources as canonicals and robots.txt (`SITE_URL`,
 * `TOOLS`), so new tools appear automatically. `lastmod` is omitted on purpose:
 * there's no per-page modification date to report, and a uniform build date
 * would be a misleading signal.
 */
const STATIC_PAGES = ["/about", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/` },
    ...TOOLS.map((tool) => ({ url: `${SITE_URL}${tool.href}` })),
    ...STATIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
  ];
}
