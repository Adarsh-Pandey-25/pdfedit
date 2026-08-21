import type { EditableTextItem } from "./text-extraction";
import { parseCssColor, parseHexColor } from "./text-extraction";
import {
  adjustedFontSize,
  matchFont,
  preloadPdfFonts,
} from "./font-matcher";

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number }
): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export type PageRender = {
  pageIndex: number;
  /** Pristine PDF.js paint — never drawn on */
  originalCanvas: HTMLCanvasElement;
  /** What the user sees — edits baked here */
  displayCanvas: HTMLCanvasElement;
  /** PDF.js bitmap scale (pdfPts × scale = canvas pixels). May include DPR. */
  scale: number;
  pageWidthPdf: number;
  pageHeightPdf: number;
};

const measureCache = new Map<string, TextMetrics>();

export function measureTextCached(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string
): TextMetrics {
  const key = `${font}::${text}`;
  const hit = measureCache.get(key);
  if (hit) return hit;
  ctx.font = font;
  const m = ctx.measureText(text);
  measureCache.set(key, m);
  return m;
}

/** Force canvas to resolve each @font-face variant before first bake */
export async function warmCanvasFonts(): Promise<void> {
  await preloadPdfFonts();
  if (typeof document === "undefined") return;
  const test = document.createElement("canvas");
  test.width = 8;
  test.height = 8;
  const ctx = test.getContext("2d");
  if (!ctx) return;
  const families = [
    "PDF-Inter",
    "PDF-Nunito",
    "PDF-Helvetica",
    "PDF-SourceSerif",
    "PDF-LibreCaslon",
    "PDF-JetBrainsMono",
  ];
  for (const family of families) {
    for (const weight of ["normal", "bold"] as const) {
      for (const style of ["normal", "italic"] as const) {
        ctx.font = `${style} ${weight} 16px "${family}"`;
        ctx.fillText("Ag", 0, 12);
      }
    }
  }
}

function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext("2d");
  if (ctx) ctx.drawImage(source, 0, 0);
  return c;
}

/**
 * Snapshot the visible PDF.js canvas into original + display buffers.
 */
export function createPageRender(
  pageIndex: number,
  sourceCanvas: HTMLCanvasElement,
  scale: number,
  pageWidthPdf: number,
  pageHeightPdf: number
): PageRender {
  const originalCanvas = cloneCanvas(sourceCanvas);
  const displayCanvas = cloneCanvas(sourceCanvas);
  return {
    pageIndex,
    originalCanvas,
    displayCanvas,
    scale,
    pageWidthPdf,
    pageHeightPdf,
  };
}

/** Copy display → visible on-screen canvas (same bitmap size) */
export function blitDisplayToVisible(
  pageRender: PageRender,
  visible: HTMLCanvasElement
): void {
  const prevW = visible.style.width;
  const prevH = visible.style.height;
  if (
    visible.width !== pageRender.displayCanvas.width ||
    visible.height !== pageRender.displayCanvas.height
  ) {
    visible.width = pageRender.displayCanvas.width;
    visible.height = pageRender.displayCanvas.height;
  }
  const ctx = visible.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, visible.width, visible.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(pageRender.displayCanvas, 0, 0);
  // Preserve CSS display size after resizing the bitmap
  if (prevW) visible.style.width = prevW;
  if (prevH) visible.style.height = prevH;
}

/** Reset display to pristine original */
export function resetDisplayFromOriginal(pageRender: PageRender): void {
  const ctx = pageRender.displayCanvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pageRender.displayCanvas.width, pageRender.displayCanvas.height);
  ctx.drawImage(pageRender.originalCanvas, 0, 0);
}

export type CanvasTextRegion = {
  x: number;
  y: number;
  w: number;
  h: number;
  drawX: number;
  drawY: number;
  fontPx: number;
  fontCss: string;
};

/** Bitmap-space region + draw metrics for a text item */
export function getCanvasTextRegion(
  pageRender: PageRender,
  item: EditableTextItem,
  textForWidth?: string
): CanvasTextRegion {
  const scale = pageRender.scale;
  const match = matchFont(
    item.embeddedFontName || item.embeddedCleanName || item.fontName,
    item.fontDescriptorFlags
  );
  const rawPt = item.originalPdfFontSize || item.pdfFontSize;
  const fontPt = adjustedFontSize(rawPt, match.webFamily);
  const fontPx = fontPt * scale;
  const ox = (item.originalPdfX ?? item.pdfX) * scale;
  const oyBaseline =
    (pageRender.pageHeightPdf - (item.originalPdfY ?? item.pdfY)) * scale;
  const origW = (item.originalPdfWidth || item.pdfWidth) * scale;

  const weight = item.isBold ? "bold" : "normal";
  const style = item.isItalic ? "italic" : "normal";
  const fontCss = `${style} ${weight} ${fontPx}px "${match.webFamily}", sans-serif`;

  let textW = origW;
  if (textForWidth && typeof document !== "undefined") {
    const probe = document.createElement("canvas").getContext("2d");
    if (probe) {
      textW = Math.max(
        origW,
        measureTextCached(probe, textForWidth || " ", fontCss).width
      );
    }
  }

  // Modest pad — large pads wipe overlapping neighbors (title under subtitle)
  const pad = Math.max(2, 1.25 * scale);
  const ascent = fontPx * 1.0;
  const descent = fontPx * 0.28;
  const x = ox - pad;
  const y = oyBaseline - ascent - pad;
  const w = Math.max(origW, textW) + pad * 2;
  const h = ascent + descent + pad * 2;

  return {
    x,
    y,
    w,
    h,
    drawX: ox,
    drawY: oyBaseline,
    fontPx,
    fontCss,
  };
}

/** Restore a dirty region from the pristine original canvas */
export function restoreRegionFromOriginal(
  pageRender: PageRender,
  region: { x: number; y: number; w: number; h: number }
): void {
  const ctx = pageRender.displayCanvas.getContext("2d");
  if (!ctx) return;
  const x = Math.max(0, Math.floor(region.x));
  const y = Math.max(0, Math.floor(region.y));
  const w = Math.ceil(region.w);
  const h = Math.ceil(region.h);
  ctx.drawImage(
    pageRender.originalCanvas,
    x,
    y,
    w,
    h,
    x,
    y,
    w,
    h
  );
}

/**
 * Read the real painted ink in a region from the pristine original canvas.
 * Prefers chromatic ink (blue subtitle) so erase works even if item.color is wrong.
 */
function sampleInkFromOriginalRegion(
  pageRender: PageRender,
  region: { x: number; y: number; w: number; h: number },
  fallbackCss: string
): string {
  const ctx = pageRender.originalCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return fallbackCss;

  const x = Math.max(0, Math.floor(region.x));
  const y = Math.max(0, Math.floor(region.y));
  const w = Math.min(pageRender.originalCanvas.width - x, Math.ceil(region.w));
  const h = Math.min(
    pageRender.originalCanvas.height - y,
    Math.ceil(region.h)
  );
  if (w <= 0 || h <= 0) return fallbackCss;

  try {
    const { data } = ctx.getImageData(x, y, w, h);
    let bestChromatic: { r: number; g: number; b: number; score: number } | null =
      null;
    let bestDark: { r: number; g: number; b: number; score: number } | null =
      null;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 180) continue;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 230) continue;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const score = 1; // density later via buckets — use simple accumulate
      if (chroma > 30 && lum > 30) {
        const s = chroma * (1.2 - lum / 400);
        if (!bestChromatic || s > bestChromatic.score) {
          bestChromatic = { r, g, b, score: s };
        }
      } else if (lum < 120) {
        const s = 255 - lum;
        if (!bestDark || s > bestDark.score) {
          bestDark = { r, g, b, score: s };
        }
      }
    }

    const pick = bestChromatic || bestDark;
    if (!pick) return fallbackCss;
    const toHex = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(pick.r)}${toHex(pick.g)}${toHex(pick.b)}`;
  } catch {
    return fallbackCss;
  }
}

/**
 * Erase only pixels matching this item's ink color (including pale AA fringes).
 * Used as a soft pass; for deletes we prefer opaque whiteout + neighbor redraw.
 */
export function eraseInkMatchingColor(
  pageRender: PageRender,
  region: { x: number; y: number; w: number; h: number },
  inkCss: string,
  patchCss: string
): void {
  const ctx = pageRender.displayCanvas.getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return;

  const x = Math.max(0, Math.floor(region.x));
  const y = Math.max(0, Math.floor(region.y));
  const w = Math.min(pageRender.displayCanvas.width - x, Math.ceil(region.w));
  const h = Math.min(pageRender.displayCanvas.height - y, Math.ceil(region.h));
  if (w <= 0 || h <= 0) return;

  const fallback = inkCss.startsWith("#")
    ? parseHexColor(inkCss)
    : parseCssColor(inkCss);
  const fbLum = 0.299 * fallback.r + 0.587 * fallback.g + 0.114 * fallback.b;
  const fbChroma =
    Math.max(fallback.r, fallback.g, fallback.b) -
    Math.min(fallback.r, fallback.g, fallback.b);
  const inkCssResolved =
    fbChroma > 28 && fbLum > 35
      ? inkCss
      : sampleInkFromOriginalRegion(pageRender, { x, y, w, h }, inkCss);

  restoreRegionFromOriginal(pageRender, { x, y, w, h });

  const ink = inkCssResolved.startsWith("#")
    ? parseHexColor(inkCssResolved)
    : parseCssColor(inkCssResolved);
  const patch = parseCssColor(patchCss);
  const img = ctx.getImageData(x, y, w, h);
  const { data } = img;

  const inkLum = 0.299 * ink.r + 0.587 * ink.g + 0.114 * ink.b;
  const inkChroma =
    Math.max(ink.r, ink.g, ink.b) - Math.min(ink.r, ink.g, ink.b);
  const inkIsChromatic = inkChroma > 28 && inkLum > 20;
  const inkIsDark = inkLum < 55 && inkChroma < 40;
  const black = { r: 0, g: 0, b: 0 };

  const isLightInkTint = (r: number, g: number, b: number): boolean => {
    const pixel = { r, g, b };
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 115) return false;
    if (colorDistance(pixel, ink) <= 42) return true;
    for (let t = 0.28; t <= 0.95; t += 0.07) {
      const mix = {
        r: Math.round(ink.r * (1 - t) + 255 * t),
        g: Math.round(ink.g * (1 - t) + 255 * t),
        b: Math.round(ink.b * (1 - t) + 255 * t),
      };
      if (colorDistance(pixel, mix) <= 32) return true;
    }
    return false;
  };

  const sameHueFamily = (r: number, g: number, b: number): boolean => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 18) return false;
    if (ink.b >= ink.r && ink.b >= ink.g) {
      return b > r + 12 && b > g + 8 && b > 110;
    }
    if (ink.r >= ink.g && ink.r >= ink.b) {
      return r > g + 12 && r > b + 8 && r > 110;
    }
    return g > r + 12 && g > b + 8 && g > 110;
  };

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 20) continue;
    const pixel = { r, g, b };
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 250) continue;

    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const dInk = colorDistance(pixel, ink);
    const dBlack = colorDistance(pixel, black);
    const dPatch = colorDistance(pixel, patch);

    let erase = false;
    if (inkIsChromatic) {
      if (lum < 110 || dBlack < dInk) erase = false;
      else if (isLightInkTint(r, g, b) || (sameHueFamily(r, g, b) && lum >= 115))
        erase = true;
    } else if (inkIsDark) {
      if (chroma > 40 && lum > 35) erase = false;
      else erase = dInk <= 48 || (lum < 150 && dInk < dPatch && dInk < 100);
    } else {
      erase = dInk <= 52 || (dInk < dPatch && dInk < 100);
    }

    if (erase) {
      data[i] = patch.r;
      data[i + 1] = patch.g;
      data[i + 2] = patch.b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, x, y);
}

function regionsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/** Redraw one text item's glyphs (no whiteout) — restores heading after blue delete. */
export function drawTextGlyphs(
  pageRender: PageRender,
  item: EditableTextItem,
  text: string
): void {
  const ctx = pageRender.displayCanvas.getContext("2d");
  if (!ctx || !text.trim()) return;
  const region = getCanvasTextRegion(pageRender, item, text);
  ctx.font = region.fontCss;
  ctx.fillStyle = item.color || "#000000";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.imageSmoothingEnabled = true;
  ctx.fillText(text, region.drawX, region.drawY);
}

/**
 * After an opaque whiteout, redraw unedited neighbors that intersect the patch
 * (e.g. black "Website Proposal" under deleted blue subtitle).
 */
export function restoreOverlappingNeighbors(
  pageRender: PageRender,
  patchedItem: EditableTextItem,
  allItems: EditableTextItem[],
  patchRegion: { x: number; y: number; w: number; h: number },
  skipIds?: Set<string>
): void {
  for (const other of allItems) {
    if (other.id === patchedItem.id) continue;
    if (skipIds?.has(other.id)) continue;
    if (other.pageIndex !== pageRender.pageIndex) continue;
    if (other.isDeleted || other.isRotated) continue;
    // Only restore items that still show their original PDF glyphs
    const isPatched =
      other.isEdited && other.currentText !== other.originalText;
    if (isPatched) continue;
    const text = other.originalText;
    if (!text?.trim()) continue;
    const otherRegion = getCanvasTextRegion(pageRender, other, text);
    if (!regionsOverlap(patchRegion, otherRegion)) continue;
    drawTextGlyphs(pageRender, other, text);
  }
}

/**
 * Cover original glyphs, draw new text, then restore overlapping neighbors.
 * Enter-after-clear / Delete must fully remove blue without leaving overlap.
 */
export function bakeTextEdit(
  pageRender: PageRender,
  item: EditableTextItem,
  newText: string,
  allItems?: EditableTextItem[]
): void {
  const ctx = pageRender.displayCanvas.getContext("2d");
  if (!ctx) return;

  const region = getCanvasTextRegion(
    pageRender,
    item,
    newText.trim() ? newText : item.originalText || " "
  );
  const ink = item.color || "#000000";
  const patch = item.patchColor || item.backgroundColor || "rgb(255,255,255)";

  // Opaque cover — removes all blue (ink-only leave left overlap ghosts)
  restoreRegionFromOriginal(pageRender, region);
  ctx.fillStyle = patch;
  ctx.fillRect(region.x, region.y, region.w, region.h);

  if (newText.trim()) {
    ctx.font = region.fontCss;
    ctx.fillStyle = ink;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.imageSmoothingEnabled = true;
    ctx.fillText(newText, region.drawX, region.drawY);

    if (item.isUnderline) {
      const metrics = ctx.measureText(newText);
      const underlineY = region.drawY + Math.max(2, region.fontPx * 0.14);
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(1.25, region.fontPx * 0.075);
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.moveTo(region.drawX, underlineY);
      ctx.lineTo(
        region.drawX + Math.max(metrics.width, region.fontPx * 0.5),
        underlineY
      );
      ctx.stroke();
    }
  }

  // Put the black heading back where the whiteout covered it
  if (allItems?.length) {
    restoreOverlappingNeighbors(pageRender, item, allItems, region);
  }
}

/** Whiteout only (for live HTML editing over canvas) */
export function whiteoutTextRegion(
  pageRender: PageRender,
  item: EditableTextItem,
  patchColor: string,
  allItems?: EditableTextItem[]
): void {
  const ctx = pageRender.displayCanvas.getContext("2d");
  if (!ctx) return;
  const region = getCanvasTextRegion(
    pageRender,
    item,
    item.currentText || item.originalText
  );
  restoreRegionFromOriginal(pageRender, region);
  ctx.fillStyle = patchColor;
  ctx.fillRect(region.x, region.y, region.w, region.h);
  if (allItems?.length) {
    restoreOverlappingNeighbors(pageRender, item, allItems, region);
  }
}

/** Re-apply all committed edits for a page onto a fresh display copy of original */
export function rebakePageEdits(
  pageRender: PageRender,
  items: EditableTextItem[]
): void {
  resetDisplayFromOriginal(pageRender);
  const pageItems = items.filter((t) => t.pageIndex === pageRender.pageIndex);
  const patches = pageItems.filter(
    (t) =>
      t.isDeleted || (t.isEdited && t.currentText !== t.originalText)
  );
  if (!patches.length) return;

  const patchedIds = new Set(patches.map((p) => p.id));
  const patchRegions: { x: number; y: number; w: number; h: number }[] = [];

  for (const item of patches) {
    const text = item.isDeleted ? "" : item.currentText;
    bakeTextEdit(pageRender, item, text, pageItems);
    patchRegions.push(
      getCanvasTextRegion(
        pageRender,
        item,
        text.trim() ? text : item.originalText || " "
      )
    );
  }

  // Second pass: neighbors skipped during multi-patch ordering
  for (const other of pageItems) {
    if (patchedIds.has(other.id)) continue;
    if (other.isDeleted || other.isRotated) continue;
    const text = other.originalText;
    if (!text?.trim()) continue;
    const otherRegion = getCanvasTextRegion(pageRender, other, text);
    if (!patchRegions.some((r) => regionsOverlap(r, otherRegion))) continue;
    drawTextGlyphs(pageRender, other, text);
  }
}

/** Undo one item: restore its region then rebake remaining edits */
export function removeBakedEdit(
  pageRender: PageRender,
  items: EditableTextItem[],
  removedId: string
): void {
  rebakePageEdits(
    pageRender,
    items.map((t) =>
      t.id === removedId
        ? {
            ...t,
            isEdited: false,
            isDeleted: false,
            currentText: t.originalText,
          }
        : t
    )
  );
}

/** PNG bytes of the display canvas (for High Quality export) */
export async function displayCanvasToPng(
  pageRender: PageRender
): Promise<ArrayBuffer> {
  const blob = await new Promise<Blob | null>((resolve) =>
    pageRender.displayCanvas.toBlob((b) => resolve(b), "image/png")
  );
  if (blob) return blob.arrayBuffer();
  // Fallback data URL
  const dataUrl = pageRender.displayCanvas.toDataURL("image/png");
  const res = await fetch(dataUrl);
  return res.arrayBuffer();
}
