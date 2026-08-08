import type { EditorElement } from "@/lib/editor-types";
import { ensureNormalized } from "@/lib/coords";

/** Ensure a URI has a scheme so PDF readers open it correctly */
export function normalizeLinkUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^(https?|mailto|tel|ftp):/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.includes("@") && !trimmed.includes(" ")) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function isValidLinkUrl(raw: string): boolean {
  const url = normalizeLinkUrl(raw);
  if (!url) return false;
  try {
    // mailto:/tel: are fine; URL() accepts them
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return url.startsWith("mailto:") || url.startsWith("tel:");
  }
}

/**
 * Add clickable Link annotations for link elements.
 * Safe to call on a canvas-flattened PDF (Exact Match download) so hotspots
 * still work even when page content is an image.
 */
export async function applyLinkAnnotationsToPdf(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  elements: EditorElement[]
): Promise<void> {
  const { PDFString } = await import("pdf-lib");
  const pages = doc.getPages();
  const links = elements
    .filter((e) => e.type === "link")
    .map((e) => ensureNormalized(e));

  for (const el of links) {
    const page = pages[el.pageIndex];
    if (!page) continue;
    const url = normalizeLinkUrl(String(el.data.url || ""));
    if (!url) continue;

    const { width: pageW, height: pageH } = page.getSize();
    const x = el.x * pageW;
    const w = Math.max(el.width * pageW, 2);
    const h = Math.max(el.height * pageH, 2);
    // PDF coords are bottom-left; editor uses top-left normalized
    const y = pageH * (1 - el.y - el.height);

    try {
      const annot = page.doc.context.register(
        page.doc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [x, y, x + w, y + h],
          Border: [0, 0, 0],
          C: [0.2, 0.4, 1],
          A: {
            Type: "Action",
            S: "URI",
            URI: PDFString.of(url),
          },
        })
      );
      page.node.addAnnot(annot);
    } catch {
      /* some pdf-lib builds reject annotations */
    }
  }
}
