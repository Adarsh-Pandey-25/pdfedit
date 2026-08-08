import { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const toolRoutes = TOOLS.map((tool) => ({
    url: `${SITE_URL}${tool.href}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...toolRoutes,
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
