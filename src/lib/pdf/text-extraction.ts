import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { cleanFontName } from "./font-extractor";
import { matchFont } from "./font-matcher";
import {
  sampleHasUnderlineFromCanvas,
  sampleTextColorFromCanvas,
} from "./canvas-color-sampler";
import { looksLikeLinkBlue } from "./text-links";

export type EditableTextItem = {
  id: string;
  pageIndex: number;
  originalText: string;
  currentText: string;

  /** Raw PDF point x (baseline left) — transform[4] */
  pdfX: number;
  /** Raw PDF point y (baseline, from bottom) — transform[5] */
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;

  /** Immutable original bounds — used for patch cover (never shrink) */
  originalPdfX: number;
  originalPdfY: number;
  originalPdfWidth: number;
  originalPdfHeight: number;
  originalPdfFontSize: number;

  /** TRUE font size in PDF points — Math.hypot(transform[0], transform[1]) */
  pdfFontSize: number;
  /** @deprecated alias of pdfFontSize for toolbar */
  fontSize: number;

  /** pdf.js internal font id e.g. "g_d0_f1" */
  fontName: string;
  pdfjsFontName: string;
  /** Real BaseFont e.g. "AAAAAB+Sohne-Buch" */
  embeddedFontName: string;
  embeddedCleanName: string;
  /** Matched CSS family e.g. "PDF-Inter" */
  matchedWebFamily: string;
  /** CSS font-family stack for editor overlay */
  fontFamily: string;
  fontDescriptorFlags?: number;
  isBold: boolean;
  isItalic: boolean;
  ascent?: number;
  descent?: number;

  /** Actual text fill color #rrggbb */
  color: string;

  /** Text was underlined in the source (or is a typical hyperlink) */
  isUnderline: boolean;
  /** Text sits under a Link annotation */
  isLink: boolean;
  /** Destination URI when isLink */
  linkUrl?: string;

  /** Sampled canvas background at commit — hides original glyphs */
  patchColor: string;
  /** @deprecated use patchColor */
  backgroundColor: string;

  charSpacing: number;
  /** Raw PDF text matrix */
  transform: number[];

  /** Page height in PDF points (for CSS Y conversion) */
  pageHeightPdf: number;
  pageWidthPdf: number;

  /** Screen-space % (kept for hit testing / session) */
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;

  isEdited: boolean;
  isDeleted: boolean;
  isRotated: boolean;
};

type RawGlyph = {
  str: string;
  transform: number[];
  pdfX: number;
  pdfY: number;
  pdfFontSize: number;
  pdfWidth: number;
  screenWidth: number;
  pdfHeight: number;
  fontName: string;
  pdfjsFontName: string;
  embeddedFontName: string;
  embeddedCleanName: string;
  matchedWebFamily: string;
  fontFamily: string;
  fontDescriptorFlags?: number;
  isBold: boolean;
  isItalic: boolean;
  ascent?: number;
  descent?: number;
  color: string;
  isUnderline: boolean;
  isLink: boolean;
  linkUrl?: string;
  charSpacing: number;
  isRotated: boolean;
  left: number;
  top: number;
  pageWidth: number;
  pageHeight: number;
};

function transformMul(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

export function mapFontFamily(
  fontName: string,
  fontDescriptor?: { fontFamily?: string } | null
): string {
  if (fontDescriptor?.fontFamily) return fontDescriptor.fontFamily;

  const name = fontName.toLowerCase();

  if (
    name.includes("times") ||
    name.includes("serif") ||
    name.includes("roman") ||
    name.includes("georgia") ||
    name.includes("cambria") ||
    name.includes("garamond")
  ) {
    return '"Times New Roman", Times, serif';
  }

  if (
    name.includes("courier") ||
    name.includes("mono") ||
    name.includes("consolas") ||
    name.includes("menlo")
  ) {
    return '"Courier New", Courier, monospace';
  }

  if (
    name.includes("arial") ||
    name.includes("helvetica") ||
    name.includes("liberation")
  ) {
    return "Arial, Helvetica, sans-serif";
  }

  return "Arial, Helvetica, sans-serif";
}

export function detectStyle(
  fontName: string,
  fontDescriptor?: {
    flags?: number;
    fontWeight?: number;
  } | null
): { isBold: boolean; isItalic: boolean } {
  const name = fontName.toLowerCase();

  const flagsBold = fontDescriptor?.flags
    ? (fontDescriptor.flags & 0x40000) !== 0
    : false;
  const flagsItalic = fontDescriptor?.flags
    ? (fontDescriptor.flags & 0x40) !== 0
    : false;

  const weightBold =
    typeof fontDescriptor?.fontWeight === "number"
      ? fontDescriptor.fontWeight >= 600
      : false;

  const nameBold =
    /bold|black|heavy|semibold|demibold|extrabold|kraft|-b($|[^a-z])|,\s*bold/i.test(
      name
    );
  const nameItalic =
    /italic|oblique|-i($|[^a-z])|,\s*italic/i.test(name);

  return {
    isBold: flagsBold || weightBold || nameBold,
    isItalic: flagsItalic || nameItalic,
  };
}

function toHexByte(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

/** Re-export robust operator-list color extractor */
export { extractTextColors } from "./text-color-extractor";
import { extractTextColors } from "./text-color-extractor";

async function resolveFontMeta(
  page: PDFPageProxy,
  fontName: string
): Promise<{
  fontFamily?: string;
  name?: string;
  loadedName?: string;
  flags?: number;
  fontWeight?: number;
  ascent?: number;
  descent?: number;
  data?: Uint8Array | ArrayBuffer | number[] | null;
} | null> {
  try {
    const font = await page.commonObjs.get(fontName);
    if (!font || typeof font !== "object") return null;
    const f = font as Record<string, unknown>;
    const name =
      typeof f.name === "string"
        ? f.name
        : typeof f.fontFamily === "string"
          ? f.fontFamily
          : undefined;
    return {
      name,
      loadedName:
        typeof f.loadedName === "string" ? f.loadedName : undefined,
      fontFamily:
        typeof f.fontFamily === "string"
          ? f.fontFamily
          : name,
      flags: typeof f.flags === "number" ? f.flags : undefined,
      fontWeight:
        typeof f.fontWeight === "number" ? f.fontWeight : undefined,
      ascent: typeof f.ascent === "number" ? f.ascent : undefined,
      descent: typeof f.descent === "number" ? f.descent : undefined,
      data: (f.data as Uint8Array | ArrayBuffer | number[] | null) ?? null,
    };
  } catch {
    return null;
  }
}

function mergeLineItems(items: RawGlyph[]): RawGlyph[] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => {
    const yDiff = a.top - b.top;
    if (Math.abs(yDiff) > 1.2) return yDiff;
    return a.left - b.left;
  });

  const merged: RawGlyph[] = [];
  let cur = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const font = Math.min(cur.pdfFontSize, next.pdfFontSize);
    const sameLine = Math.abs(cur.top - next.top) <= Math.max(1.5, font * 0.35);
    const gap = next.left - (cur.left + cur.screenWidth);
    const colBreak = gap > cur.pageWidth * 0.25;
    const sameStyle =
      Math.abs(cur.pdfFontSize - next.pdfFontSize) < 0.75 &&
      !cur.isRotated &&
      !next.isRotated &&
      cur.fontFamily === next.fontFamily &&
      cur.matchedWebFamily === next.matchedWebFamily &&
      cur.embeddedFontName === next.embeddedFontName &&
      cur.isBold === next.isBold &&
      cur.isItalic === next.isItalic &&
      cur.color === next.color;

    if (sameLine && !colBreak && sameStyle && gap >= -3) {
      const end = Math.max(cur.left + cur.screenWidth, next.left + next.screenWidth);
      const space = gap > font * 0.12 ? " " : "";
      cur = {
        ...cur,
        str: cur.str + space + next.str,
        screenWidth: end - cur.left,
        pdfWidth: cur.pdfWidth + next.pdfWidth + (space ? cur.pdfFontSize * 0.25 : 0),
        pdfHeight: Math.max(cur.pdfHeight, next.pdfHeight),
        pdfFontSize: Math.max(cur.pdfFontSize, next.pdfFontSize),
        isUnderline: cur.isUnderline || next.isUnderline,
        isLink: cur.isLink || next.isLink,
        linkUrl: cur.linkUrl || next.linkUrl,
        // Prefer non-black / link-aware color when merging
        color:
          cur.isLink || next.isLink
            ? cur.color !== "#000000"
              ? cur.color
              : next.color
            : cur.color,
      };
    } else {
      merged.push(cur);
      cur = { ...next };
    }
  }
  merged.push(cur);
  return merged;
}

export async function extractPageTextItems(
  doc: PDFDocumentProxy,
  pageIndex: number
): Promise<EditableTextItem[]> {
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const colorMap = await extractTextColors(page);
  const pageLinks = await (
    await import("./text-links")
  ).extractPageLinks(page);
  const {
    findLinkForGlyph,
    DEFAULT_LINK_COLOR,
    isNearBlack,
    looksLikeLinkBlue,
  } = await import("./text-links");
  const styles = content.styles || {};

  const fontCache = new Map<
    string,
    Awaited<ReturnType<typeof resolveFontMeta>>
  >();

  const raw: RawGlyph[] = [];
  let textItemIndex = 0;

  for (const entry of content.items as unknown[]) {
    if (!entry || typeof entry !== "object" || !("str" in entry)) continue;
    const item = entry as {
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName: string;
    };
    if (!item.str?.trim() || !item.transform || item.transform.length < 6) {
      textItemIndex++;
      continue;
    }

    const [a, b, , , e, f] = item.transform;
    // TRUE font size from transform scale — NOT item.height
    const pdfFontSize = Math.hypot(a, b) || 12;
    const angle = Math.atan2(b, a);
    const isRotated = Math.abs(angle) > 0.05;

    const pdfjsFontName = item.fontName || "Helvetica";
    if (!fontCache.has(pdfjsFontName)) {
      fontCache.set(pdfjsFontName, await resolveFontMeta(page, pdfjsFontName));
    }
    const fontMeta = fontCache.get(pdfjsFontName) || null;
    const styleInfo = styles[pdfjsFontName] as
      | { ascent?: number; descent?: number }
      | undefined;

    const embeddedFontName =
      fontMeta?.name || fontMeta?.fontFamily || pdfjsFontName;
    const embeddedCleanName = cleanFontName(embeddedFontName);
    const flags = fontMeta?.flags;
    const { isBold, isItalic } = detectStyle(embeddedFontName, fontMeta);

    // Match to FULL bundled web font (ignore subsetted PDF font bytes)
    const matched = matchFont(embeddedFontName, flags);
    const family = `'${matched.webFamily}', -apple-system, BlinkMacSystemFont, sans-serif`;

    let color = colorMap.get(textItemIndex) || "#000000";
    textItemIndex++;

    const pdfWidth = Math.max(item.width || 0, pdfFontSize * 0.35);
    const linkHit = findLinkForGlyph(e, f, pdfWidth, pdfFontSize, pageLinks);
    const isLink = !!linkHit;
    const linkUrl = linkHit?.url || undefined;
    // Hyperlinks (and typical link blues) are underlined in source PDFs
    const isUnderline = isLink || looksLikeLinkBlue(color);
    if (isLink && isNearBlack(color)) {
      color = DEFAULT_LINK_COLOR;
    }

    const tx = transformMul(viewport.transform, item.transform);
    const fontHeight =
      Math.hypot(tx[2], tx[3]) || Math.hypot(tx[0], tx[1]) || pdfFontSize;
    const ascentRatio =
      styleInfo && typeof styleInfo.ascent === "number" && styleInfo.ascent > 0
        ? styleInfo.ascent
        : typeof fontMeta?.ascent === "number" && fontMeta.ascent > 0
          ? fontMeta.ascent > 1
            ? fontMeta.ascent / 1000
            : fontMeta.ascent
          : 0.8;
    const ascent = fontHeight * ascentRatio;
    const scaleX = Math.hypot(tx[0], tx[1]) || fontHeight;

    let left: number;
    let top: number;
    if (!isRotated) {
      left = tx[4];
      top = tx[5] - ascent;
    } else {
      left = tx[4] + ascent * Math.sin(angle);
      top = tx[5] - ascent * Math.cos(angle);
    }

    const screenWidth = Math.max((item.width || 0) * scaleX, fontHeight * 0.35);

    // Keep letter-spacing at 0 — CSS letter-spacing breaks kerning/ligatures
    const charSpacing = 0;

    raw.push({
      str: item.str,
      transform: [...item.transform],
      pdfX: e,
      pdfY: f,
      pdfFontSize,
      pdfWidth,
      screenWidth,
      pdfHeight: pdfFontSize,
      fontName: pdfjsFontName,
      pdfjsFontName,
      embeddedFontName,
      embeddedCleanName,
      matchedWebFamily: matched.webFamily,
      fontFamily: family,
      fontDescriptorFlags: flags,
      isBold,
      isItalic,
      ascent: fontMeta?.ascent,
      descent: fontMeta?.descent,
      color,
      isUnderline,
      isLink,
      linkUrl,
      charSpacing,
      isRotated,
      left,
      top,
      pageWidth: viewport.width,
      pageHeight: viewport.height,
    });
  }

  const merged = mergeLineItems(raw);

  return merged.map((item, i) => {
    const height = Math.min(
      Math.max(item.pdfFontSize, 6),
      item.pdfFontSize * 1.35
    );

    return {
      id: `p${pageIndex}-t${i}-${item.pdfX.toFixed(1)}-${item.pdfY.toFixed(1)}`,
      pageIndex,
      originalText: item.str,
      currentText: item.str,
      pdfX: item.pdfX,
      pdfY: item.pdfY,
      pdfWidth: item.pdfWidth,
      pdfHeight: item.pdfFontSize,
      originalPdfX: item.pdfX,
      originalPdfY: item.pdfY,
      originalPdfWidth: item.pdfWidth,
      originalPdfHeight: item.pdfFontSize,
      originalPdfFontSize: item.pdfFontSize,
      pdfFontSize: item.pdfFontSize,
      fontSize: item.pdfFontSize,
      fontName: item.fontName,
      pdfjsFontName: item.pdfjsFontName,
      embeddedFontName: item.embeddedFontName,
      embeddedCleanName: item.embeddedCleanName,
      matchedWebFamily: item.matchedWebFamily,
      fontFamily: item.fontFamily,
      fontDescriptorFlags: item.fontDescriptorFlags,
      isBold: item.isBold,
      isItalic: item.isItalic,
      ascent: item.ascent,
      descent: item.descent,
      color: item.color,
      isUnderline: item.isUnderline,
      isLink: item.isLink,
      linkUrl: item.linkUrl,
      patchColor: "rgb(255,255,255)",
      backgroundColor: "rgb(255,255,255)",
      charSpacing: item.charSpacing,
      transform: item.transform,
      pageHeightPdf: item.pageHeight,
      pageWidthPdf: item.pageWidth,
      xPct: (item.left / item.pageWidth) * 100,
      yPct: (item.top / item.pageHeight) * 100,
      widthPct: (item.screenWidth / item.pageWidth) * 100,
      heightPct: (height / item.pageHeight) * 100,
      isEdited: false,
      isDeleted: false,
      isRotated: item.isRotated,
    };
  });
}

/** CSS font-family string already stored on item */
export function cssFontFamily(family: string): string {
  return family || "Arial, Helvetica, sans-serif";
}

function snapNearWhite(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  if (r >= 250 && g >= 250 && b >= 250) return [255, 255, 255];
  return rgb;
}

function snapNearBlack(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  if (r <= 12 && g <= 12 && b <= 12) return [0, 0, 0];
  return rgb;
}

/** MODE-based patch sampling — 8px strips with gap to avoid anti-aliased ink */
export function samplePatchColor(
  canvas: HTMLCanvasElement,
  rect: { left: number; top: number; width: number; height: number }
): string {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "rgb(255,255,255)";

  const dprX = canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
  const dprY = canvas.clientHeight > 0 ? canvas.height / canvas.clientHeight : 1;

  const samples: [number, number, number][] = [];
  const STRIP = 8;
  const GAP = 3;

  const readStrip = (x: number, y: number, w: number, h: number) => {
    const x0 = Math.max(0, Math.floor(x * dprX));
    const y0 = Math.max(0, Math.floor(y * dprY));
    const cw = Math.max(1, Math.floor(w * dprX));
    const ch = Math.max(1, Math.floor(h * dprY));
    if (x0 >= canvas.width || y0 >= canvas.height) return;
    const rw = Math.min(cw, canvas.width - x0);
    const rh = Math.min(ch, canvas.height - y0);
    if (rw < 1 || rh < 1) return;
    try {
      const data = ctx.getImageData(x0, y0, rw, rh).data;
      for (let i = 0; i < data.length; i += 4) {
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    } catch {
      /* ignore */
    }
  };

  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  readStrip(rect.left - STRIP - GAP, rect.top, STRIP, rect.height);
  readStrip(right + GAP, rect.top, STRIP, rect.height);
  readStrip(rect.left, rect.top - STRIP - GAP, rect.width, STRIP);
  readStrip(rect.left, bottom + GAP, rect.width, STRIP);

  if (!samples.length) return "rgb(255,255,255)";

  const buckets = new Map<string, number>();
  for (const [r, g, b] of samples) {
    const key = `${Math.round(r / 8) * 8},${Math.round(g / 8) * 8},${Math.round(b / 8) * 8}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  let maxCount = 0;
  let dominant = "255,255,255";
  buckets.forEach((count, key) => {
    if (count > maxCount) {
      maxCount = count;
      dominant = key;
    }
  });

  // If mode is <90% of samples, prefer nearest-edge (left strip) over mixed gradient mode
  if (maxCount / samples.length < 0.9 && samples.length > 0) {
    const edge = samples[0];
    let [r, g, b] = snapNearWhite(edge);
    [r, g, b] = snapNearBlack([r, g, b]);
    return `rgb(${r},${g},${b})`;
  }

  let [r, g, b] = dominant.split(",").map(Number) as [number, number, number];
  [r, g, b] = snapNearWhite([r, g, b]);
  [r, g, b] = snapNearBlack([r, g, b]);
  return `rgb(${r},${g},${b})`;
}

/** @deprecated alias */
export function sampleBackground(
  canvas: HTMLCanvasElement,
  textRect: { left: number; top: number; width: number; height: number }
): string {
  return samplePatchColor(canvas, textRect);
}

export function sampleBackgroundColor(
  canvas: HTMLCanvasElement,
  xPct: number,
  yPct: number,
  widthPct: number,
  heightPct: number
): string {
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;
  return samplePatchColor(canvas, {
    left: (xPct / 100) * cssW,
    top: (yPct / 100) * cssH,
    width: (widthPct / 100) * cssW,
    height: (heightPct / 100) * cssH,
  });
}

export function parseCssColor(color: string): { r: number; g: number; b: number } {
  const rgb = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
  );
  if (rgb) {
    return {
      r: Math.round(Number(rgb[1])),
      g: Math.round(Number(rgb[2])),
      b: Math.round(Number(rgb[3])),
    };
  }
  return parseHexColor(color);
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0");
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function hexToRgbTuple(hex: string): { r: number; g: number; b: number } {
  return parseHexColor(hex);
}

/** Legacy alias used by older call sites */
export type StandardFontFamily = "Helvetica" | "Times" | "Courier";

export function mapFontFromName(fontName: string): {
  family: StandardFontFamily;
  bold: boolean;
  italic: boolean;
} {
  const css = mapFontFamily(fontName);
  const { isBold, isItalic } = detectStyle(fontName);
  let family: StandardFontFamily = "Helvetica";
  if (css.includes("Times")) family = "Times";
  else if (css.includes("Courier")) family = "Courier";
  return { family, bold: isBold, italic: isItalic };
}

/**
 * Refine fill colors / underlines by sampling the rendered page canvas.
 * Call after PDF.js paint so anti-aliased glyph pixels are available.
 *
 * Works with offscreen canvases (no clientWidth) by using bitmap coordinates
 * from pageWidthPdf / canvas.width — critical for PageRender.originalCanvas.
 */
export function enrichTextFormattingFromCanvas(
  items: EditableTextItem[],
  canvas: HTMLCanvasElement,
  pageIndex: number
): EditableTextItem[] {
  const sample = items.find((t) => t.pageIndex === pageIndex);
  const pageWidth = sample?.pageWidthPdf;
  const pageHeight = sample?.pageHeightPdf;
  if (!pageWidth || !pageHeight || !canvas.width || !canvas.height) {
    return items;
  }

  // Bitmap pixels per PDF point (handles HiDPI + offscreen clones)
  const sx = canvas.width / pageWidth;
  const sy = canvas.height / pageHeight;

  return items.map((item) => {
    if (item.pageIndex !== pageIndex || item.isRotated) return item;

    const fontSize =
      (item.originalPdfFontSize || item.pdfFontSize) * sy;
    const pdfX = item.originalPdfX ?? item.pdfX;
    const pdfY = item.originalPdfY ?? item.pdfY;
    const pdfW = item.originalPdfWidth ?? item.pdfWidth;
    // Rect already in bitmap pixels → cssToBitmap = 1
    const box = {
      left: pdfX * sx,
      top: (item.pageHeightPdf - pdfY) * sy - fontSize,
      width: Math.max(pdfW * sx, fontSize * 0.4),
      height: fontSize,
    };

    let color = item.color || "#000000";
    let isUnderline = !!item.isUnderline;

    // Canvas ink is source of truth — operator list often reports black for gray text
    const sampled = sampleTextColorFromCanvas(canvas, box, 1);
    if (sampled) {
      color = sampled;
    }

    if (!isUnderline) {
      isUnderline =
        sampleHasUnderlineFromCanvas(canvas, box, 1) ||
        looksLikeLinkBlue(color) ||
        !!item.isLink;
    }

    if (color === item.color && isUnderline === !!item.isUnderline) {
      return item;
    }

    return { ...item, color, isUnderline };
  });
}
