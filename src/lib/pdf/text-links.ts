import type { PDFPageProxy } from "pdfjs-dist";

export type PdfLinkHit = {
  /** PDF user-space rect (y from bottom): [x1, y1, x2, y2] */
  rect: [number, number, number, number];
  url: string;
};

/**
 * Collect URI link annotations for a page (pdf.js).
 */
export async function extractPageLinks(
  page: PDFPageProxy
): Promise<PdfLinkHit[]> {
  try {
    const annotations = await page.getAnnotations({ intent: "display" });
    const links: PdfLinkHit[] = [];
    for (const a of annotations as Array<{
      subtype?: string;
      rect?: number[];
      url?: string;
      unsafeUrl?: string;
    }>) {
      if (a.subtype !== "Link") continue;
      if (!a.rect || a.rect.length < 4) continue;
      const url = String(a.url || a.unsafeUrl || "").trim();
      const [x1, y1, x2, y2] = a.rect;
      links.push({
        rect: [x1, y1, x2, y2],
        url,
      });
    }
    return links;
  } catch {
    return [];
  }
}

/** True if a text glyph box overlaps a link annotation rect (PDF coords). */
export function findLinkForGlyph(
  pdfX: number,
  pdfY: number,
  pdfWidth: number,
  pdfFontSize: number,
  links: PdfLinkHit[]
): PdfLinkHit | null {
  const pad = Math.max(3, pdfFontSize * 0.35);
  const textX1 = pdfX - pad;
  const textY1 = pdfY - pdfFontSize * 0.35 - pad;
  const textX2 = pdfX + Math.max(pdfWidth, pdfFontSize * 0.35) + pad;
  const textY2 = pdfY + pdfFontSize * 1.05 + pad;

  let best: PdfLinkHit | null = null;
  let bestArea = Infinity;

  for (const link of links) {
    const [lx1, ly1, lx2, ly2] = link.rect;
    const overlaps =
      textX1 < lx2 && textX2 > lx1 && textY1 < ly2 && textY2 > ly1;
    if (!overlaps) continue;
    // Prefer the smallest overlapping link (tight hotspot)
    const area = Math.abs(lx2 - lx1) * Math.abs(ly2 - ly1);
    if (area < bestArea) {
      bestArea = area;
      best = link;
    }
  }
  return best;
}

/** Classic hyperlink blue when fill color was missing/black but text is a link */
export const DEFAULT_LINK_COLOR = "#0563C1";

export function isNearBlack(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r < 40 && g < 40 && b < 40;
}

/** Link-like blues often used in invoices / Stripe / web PDFs */
export function looksLikeLinkBlue(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return b > 140 && b > r + 30 && b > g + 10 && r < 120;
}
