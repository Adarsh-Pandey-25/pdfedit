import type { ToolSlug } from "@/lib/constants";

/**
 * Published guides. Metadata only (no React), so the sitemap and the index
 * page can read it without loading article content. Every entry here is
 * live: there is no draft state, so don't add an entry until its content in
 * `src/components/guides/content` is finished.
 */
export type GuideMeta = {
  slug: string;
  /** Visible H1 and the article headline. */
  title: string;
  /** `<title>` segment; the layout appends "| PdfEdit+". */
  metaTitle: string;
  /** Meta description and Article description. */
  description: string;
  /** Short summary for the guides index. */
  summary: string;
  /** The tool the guide teaches. */
  tool: ToolSlug;
  /** Anchor text for the link from that tool's page to this guide. */
  toolLinkText: string;
  keywords: string[];
  /** ISO dates (YYYY-MM-DD). Change `updated` only when the content changes. */
  published: string;
  updated: string;
  /** Other guides worth linking from the end of this one. */
  related: string[];
};

export const GUIDES: GuideMeta[] = [
  {
    slug: "how-to-merge-pdf-files",
    title: "How to Merge PDF Files Online for Free",
    metaTitle: "How to Merge PDF Files Online for Free",
    description:
      "Combine several PDFs into one file, put them in the right order, and check the result. What a merge keeps, what it drops, and fixes for common problems.",
    summary:
      "Combine several PDFs into one file in the order you choose, then check that every page made it across.",
    tool: "merge",
    toolLinkText: "Learn how to merge PDF files",
    keywords: ["merge pdf", "combine pdf files", "join pdf", "merge pdf free"],
    published: "2026-10-19",
    updated: "2026-10-19",
    related: ["how-to-split-a-pdf", "how-to-compress-a-pdf"],
  },
  {
    slug: "how-to-compress-a-pdf",
    title: "How to Compress a PDF Without Losing Too Much Quality",
    metaTitle: "Compress a PDF Without Losing Too Much Quality",
    description:
      "Why PDFs get large, how compression trades sharpness for size, which level to pick, and how to check the result before you send it.",
    summary:
      "Shrink scanned and image-heavy PDFs, choose the right compression level, and know when to keep the original instead.",
    tool: "compress",
    toolLinkText: "Learn how to compress a PDF",
    keywords: ["compress pdf", "reduce pdf size", "make pdf smaller", "pdf file size"],
    published: "2026-10-19",
    updated: "2026-10-19",
    related: ["how-to-split-a-pdf", "how-to-merge-pdf-files"],
  },
  {
    slug: "how-to-split-a-pdf",
    title: "How to Split a PDF into Separate Files",
    metaTitle: "How to Split a PDF into Separate Files",
    description:
      "Pull selected pages out of a PDF, split every page into its own file, and use page ranges such as 1-3, 5. With examples and fixes for common mistakes.",
    summary:
      "Extract the pages you need, or turn every page into its own PDF, using page ranges or by clicking pages.",
    tool: "split",
    toolLinkText: "Learn how to split a PDF",
    keywords: ["split pdf", "extract pages from pdf", "separate pdf pages", "split pdf into separate files"],
    published: "2026-10-19",
    updated: "2026-10-19",
    related: ["how-to-merge-pdf-files", "how-to-compress-a-pdf"],
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** "2026-10-19" -> "October 19, 2026", independent of the server's time zone. */
export function formatGuideDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
