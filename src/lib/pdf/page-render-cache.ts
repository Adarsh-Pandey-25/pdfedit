import type { EditableTextItem } from "./text-extraction";
import {
  adjustedFontSize,
  matchFont,
  preloadPdfFonts,
} from "./font-matcher";

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

  // Cover ascent + descenders (g, y, p)
  const pad = Math.max(4, 2 * scale);
  const ascent = fontPx * 1.05;
  const descent = fontPx * 0.35;
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
 * Cover original glyphs with patchColor and draw new text with canvas fillText.
 * Uses the same Canvas 2D pipeline as the surrounding page pixels.
 */
export function bakeTextEdit(
  pageRender: PageRender,
  item: EditableTextItem,
  newText: string
): void {
  const ctx = pageRender.displayCanvas.getContext("2d");
  if (!ctx) return;

  const region = getCanvasTextRegion(pageRender, item, newText || " ");

  // 1) Restore pristine pixels under the edit
  restoreRegionFromOriginal(pageRender, region);

  // 2) Opaque patch — kills bleed-through
  ctx.fillStyle = item.patchColor || item.backgroundColor || "rgb(255,255,255)";
  ctx.fillRect(region.x, region.y, region.w, region.h);

  if (!newText.trim()) return;

  // 3) Draw text with matched bundled font
  ctx.font = region.fontCss;
  ctx.fillStyle = item.color || "#000000";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.imageSmoothingEnabled = true;
  ctx.fillText(newText, region.drawX, region.drawY);
}

/** Whiteout only (for live HTML editing over canvas) */
export function whiteoutTextRegion(
  pageRender: PageRender,
  item: EditableTextItem,
  patchColor: string
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
}

/** Re-apply all committed edits for a page onto a fresh display copy of original */
export function rebakePageEdits(
  pageRender: PageRender,
  items: EditableTextItem[]
): void {
  resetDisplayFromOriginal(pageRender);
  const edited = items.filter(
    (t) =>
      t.pageIndex === pageRender.pageIndex &&
      !t.isDeleted &&
      t.isEdited &&
      t.currentText !== t.originalText
  );
  for (const item of edited) {
    bakeTextEdit(pageRender, item, item.currentText);
  }
}

/** Undo one item: restore its region then rebake remaining edits that overlap isn't needed if we full-rebake */
export function removeBakedEdit(
  pageRender: PageRender,
  items: EditableTextItem[],
  removedId: string
): void {
  resetDisplayFromOriginal(pageRender);
  const remaining = items.filter(
    (t) =>
      t.id !== removedId &&
      t.pageIndex === pageRender.pageIndex &&
      !t.isDeleted &&
      t.isEdited &&
      t.currentText !== t.originalText
  );
  for (const item of remaining) {
    bakeTextEdit(pageRender, item, item.currentText);
  }
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
