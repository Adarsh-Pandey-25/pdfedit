import type { EditorElement, PointNorm } from "@/lib/editor-types";

/** Screen pixel → normalized (0–1) */
export function pixelToNormalized(px: number, pageSizePx: number): number {
  if (!pageSizePx) return 0;
  return px / pageSizePx;
}

/** Normalized (0–1) → screen pixel */
export function normalizedToPixel(norm: number, pageSizePx: number): number {
  return norm * pageSizePx;
}

/** Normalized (0–1) → PDF points (X) */
export function normalizedToPdfX(norm: number, pageWidthPt: number): number {
  return norm * pageWidthPt;
}

/**
 * Normalized top-left + height → PDF bottom-left Y for rectangles/images.
 * pdfY = pageHeight * (1 - normY - normHeight)
 */
export function normalizedToPdfY(
  normY: number,
  normHeight: number,
  pageHeightPt: number
): number {
  return pageHeightPt * (1 - normY - normHeight);
}

/** Normalized Y (from top) → PDF Y for a point (line endpoints, pencil points) */
export function normalizedToPdfPointY(normY: number, pageHeightPt: number): number {
  return pageHeightPt - normY * pageHeightPt;
}

/** Font size stored as fraction of page height → PDF points */
export function normalizedFontSizeToPt(
  normFontSize: number,
  pageHeightPt: number
): number {
  return Math.max(4, normFontSize * pageHeightPt);
}

/** Pointer event → normalized point on page container */
export function getNormalizedPoint(
  e: { clientX: number; clientY: number },
  pageEl: HTMLElement
): PointNorm {
  const rect = pageEl.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/** Legacy elements used 0–100 percentages; migrate to 0–1 */
export function migrateElement(el: EditorElement): EditorElement {
  const scale = (v: number) => (v > 1 ? v / 100 : v);
  const migrated: EditorElement = {
    ...el,
    x: scale(el.x),
    y: scale(el.y),
    width: scale(el.width),
    height: scale(el.height),
    data: { ...el.data },
  };

  if (migrated.type === "line" || migrated.type === "arrow") {
    const d = migrated.data;
    if (typeof d.x1 === "number") d.x1 = scale(d.x1 as number);
    if (typeof d.y1 === "number") d.y1 = scale(d.y1 as number);
    if (typeof d.x2 === "number") d.x2 = scale(d.x2 as number);
    if (typeof d.y2 === "number") d.y2 = scale(d.y2 as number);
  }

  if (migrated.type === "draw" && Array.isArray(migrated.data.points)) {
    migrated.data.points = (migrated.data.points as PointNorm[]).map((p) => ({
      x: scale(p.x),
      y: scale(p.y),
    }));
  }

  if (migrated.type === "text") {
    const fs = migrated.data.fontSize;
    if (typeof fs === "number" && fs > 0 && fs <= 1) {
      // Legacy: stored as fraction of page height
      migrated.data.fontSize = Math.round(fs * 800);
    }
    if (typeof migrated.data.fontSizePx === "number") {
      migrated.data.fontSize = migrated.data.fontSizePx;
      delete migrated.data.fontSizePx;
    }
  }

  return migrated;
}

export function ensureNormalized(el: EditorElement): EditorElement {
  const base =
    el.x <= 1 && el.y <= 1 && el.width <= 1 && el.height <= 1
      ? el
      : migrateElement(el);
  return repairPathBounds(base);
}

/**
 * Earlier builds stored lines, arrows and freehand strokes with a full-page
 * bounding box. Those boxes swallow every pointer event on the page, so shrink
 * them to the geometry they actually cover.
 */
export function repairPathBounds(el: EditorElement): EditorElement {
  if (el.type !== "line" && el.type !== "arrow" && el.type !== "draw") {
    return el;
  }
  const fullPage =
    el.x <= 0.0001 &&
    el.y <= 0.0001 &&
    el.width >= 0.999 &&
    el.height >= 0.999;
  if (!fullPage) return el;

  let points: PointNorm[];
  if (el.type === "draw") {
    const pts = el.data.points as PointNorm[] | undefined;
    if (!Array.isArray(pts) || pts.length < 2) return el;
    points = pts;
  } else {
    const { x1, y1, x2, y2 } = el.data as Record<string, number>;
    if (
      typeof x1 !== "number" ||
      typeof y1 !== "number" ||
      typeof x2 !== "number" ||
      typeof y2 !== "number"
    ) {
      return el;
    }
    points = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  }

  return { ...el, ...boundsFromPoints(points) };
}

/** Smallest box size an element may shrink to (fraction of page) */
export const MIN_ELEMENT_SIZE = 0.012;

/**
 * Bounding box around normalized points. Degenerate axes (perfectly
 * horizontal/vertical strokes) are padded symmetrically so the box always
 * stays grabbable and never divides by zero during remaps.
 */
export function boundsFromPoints(
  points: PointNorm[],
  minSize = MIN_ELEMENT_SIZE
): { x: number; y: number; width: number; height: number } {
  if (!points.length) {
    return { x: 0, y: 0, width: minSize, height: minSize };
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  if (maxX - minX < minSize) {
    const pad = (minSize - (maxX - minX)) / 2;
    minX -= pad;
    maxX += pad;
  }
  if (maxY - minY < minSize) {
    const pad = (minSize - (maxY - minY)) / 2;
    minY -= pad;
    maxY += pad;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Path-based elements (line, arrow, draw) keep their geometry in absolute
 * page-normalized coordinates so export math stays trivial. When the bounding
 * box moves or resizes, the underlying geometry has to follow it.
 */
export function remapElementGeometry(
  el: EditorElement,
  patch: Partial<EditorElement>
): Record<string, unknown> | null {
  if (el.type !== "line" && el.type !== "arrow" && el.type !== "draw") {
    return null;
  }
  const boxChanged =
    patch.x !== undefined ||
    patch.y !== undefined ||
    patch.width !== undefined ||
    patch.height !== undefined;
  if (!boxChanged) return null;

  const ox = el.x;
  const oy = el.y;
  const ow = el.width;
  const oh = el.height;
  const nx = patch.x ?? ox;
  const ny = patch.y ?? oy;
  const nw = patch.width ?? ow;
  const nh = patch.height ?? oh;

  const sx = ow > 1e-6 ? nw / ow : 1;
  const sy = oh > 1e-6 ? nh / oh : 1;
  const mapX = (v: number) => nx + (v - ox) * sx;
  const mapY = (v: number) => ny + (v - oy) * sy;

  const data: Record<string, unknown> = {};

  if (el.type === "draw") {
    const pts = el.data.points as PointNorm[] | undefined;
    if (!Array.isArray(pts)) return null;
    data.points = pts.map((p) => ({ x: mapX(p.x), y: mapY(p.y) }));
    return data;
  }

  const { x1, y1, x2, y2 } = el.data as Record<string, number>;
  if (
    typeof x1 !== "number" ||
    typeof y1 !== "number" ||
    typeof x2 !== "number" ||
    typeof y2 !== "number"
  ) {
    return null;
  }
  data.x1 = mapX(x1);
  data.y1 = mapY(y1);
  data.x2 = mapX(x2);
  data.y2 = mapY(y2);
  return data;
}

export type PdfRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Convert element box to PDF rectangle coords (bottom-left origin) */
export function elementToPdfRect(
  el: EditorElement,
  pageWidthPt: number,
  pageHeightPt: number
): PdfRect {
  const x = normalizedToPdfX(el.x, pageWidthPt);
  const y = normalizedToPdfY(el.y, el.height, pageHeightPt);
  const width = el.width * pageWidthPt;
  const height = el.height * pageHeightPt;
  return { x, y, width, height };
}

export function debugExportCoords(
  el: EditorElement,
  pageWidthPt: number,
  pageHeightPt: number
): void {
  console.log("[EXPORT]", {
    type: el.type,
    stored: { x: el.x, y: el.y, w: el.width, h: el.height },
    pageSize: { w: pageWidthPt, h: pageHeightPt },
    pdfCoords: {
      x: el.x * pageWidthPt,
      y: pageHeightPt * (1 - el.y - el.height),
      w: el.width * pageWidthPt,
      h: el.height * pageHeightPt,
    },
    points: el.data?.points,
    line: {
      x1: el.data?.x1,
      y1: el.data?.y1,
      x2: el.data?.x2,
      y2: el.data?.y2,
    },
  });
}

export function isExportDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("pdfforge-export-debug") === "1";
  } catch {
    return false;
  }
}

/** Font size in absolute points (editor + PDF export) */
export function resolveFontSizePt(
  data: Record<string, unknown>,
  fallback = 14
): number {
  if (typeof data.fontSizePx === "number") return data.fontSizePx;
  if (typeof data.fontSize === "number") {
    const fs = data.fontSize;
    if (fs > 1) return fs;
    if (fs > 0) return Math.max(4, Math.round(fs * 800));
  }
  return fallback;
}

/** Stroke width in absolute points (editor + PDF export) */
export function resolveStrokeWidthPt(
  strokeWidth: number | undefined,
  fallback = 2
): number {
  const sw = strokeWidth ?? fallback;
  return Math.max(0.5, Math.min(20, sw));
}

/** Scale absolute pt stroke to canvas pixels */
export function strokePtToCanvasPx(
  strokePt: number,
  canvasW: number,
  pageWidthPt: number
): number {
  if (!pageWidthPt) return strokePt;
  return strokePt * (canvasW / pageWidthPt);
}

/** Scale absolute pt font to canvas pixels */
export function fontPtToCanvasPx(
  fontPt: number,
  canvasH: number,
  pageHeightPt: number
): number {
  if (!pageHeightPt) return fontPt;
  return fontPt * (canvasH / pageHeightPt);
}

/** @deprecated use resolveFontSizePt */
export function resolveFontSizeNorm(
  data: Record<string, unknown>,
  pageHeightPx = 800
): number {
  return resolveFontSizePt(data) / pageHeightPx;
}

/** @deprecated use resolveStrokeWidthPt + strokePtToCanvasPx */
export function normalizedStrokeToCanvas(
  strokeWidth: number | undefined,
  canvasW: number,
  pageWidthPt = 612
): number {
  return strokePtToCanvasPx(resolveStrokeWidthPt(strokeWidth), canvasW, pageWidthPt);
}

/** @deprecated use resolveStrokeWidthPt */
export function normalizedStrokeToPdf(
  strokeWidth: number | undefined
): number {
  return resolveStrokeWidthPt(strokeWidth);
}

/** CSS percentage from normalized coord */
export function normToCssPercent(norm: number): string {
  return `${norm * 100}%`;
}

/**
 * Convert a top-down normalized page point to PDF view-space (bottom-left origin).
 * Does NOT apply page /Rotate — call toRawPageSpace afterward when needed.
 */
export function normPointToViewPdf(
  x: number,
  y: number,
  pageWidthPt: number,
  pageHeightPt: number
): { x: number; y: number } {
  return {
    x: x * pageWidthPt,
    y: pageHeightPt * (1 - y),
  };
}

/**
 * Convert a top-down normalized rect to PDF view-space rect (bottom-left origin).
 */
export function normRectToViewPdf(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidthPt: number,
  pageHeightPt: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: x * pageWidthPt,
    y: pageHeightPt * (1 - y - height),
    width: width * pageWidthPt,
    height: height * pageHeightPt,
  };
}

/**
 * Style helper: expand an SVG inside a bounding-box element so it covers the
 * full page in normalized 0–1 space (path/line points stay page-absolute).
 */
export function fullPageSvgStyle(
  el: Pick<EditorElement, "x" | "y" | "width" | "height">
): {
  position: "absolute";
  left: string;
  top: string;
  width: string;
  height: string;
  overflow: "visible";
  pointerEvents: "none";
} {
  const w = Math.max(el.width, 1e-6);
  const h = Math.max(el.height, 1e-6);
  return {
    position: "absolute",
    left: `${(-el.x / w) * 100}%`,
    top: `${(-el.y / h) * 100}%`,
    width: `${(1 / w) * 100}%`,
    height: `${(1 / h) * 100}%`,
    overflow: "visible",
    pointerEvents: "none",
  };
}

/**
 * Pixel-anchored full-page SVG style for freehand strokes. html2canvas fails on
 * the percentage-based fullPageSvgStyle, so pencil paths use explicit px offsets.
 */
export function pageStrokeSvgStyle(
  el: Pick<EditorElement, "x" | "y">,
  pageWidthPx: number,
  pageHeightPx: number
): {
  position: "absolute";
  left: string;
  top: string;
  width: string;
  height: string;
  overflow: "visible";
  pointerEvents: "none";
} {
  const pw = Math.max(1, pageWidthPx);
  const ph = Math.max(1, pageHeightPx);
  return {
    position: "absolute",
    left: `${-el.x * pw}px`,
    top: `${-el.y * ph}px`,
    width: `${pw}px`,
    height: `${ph}px`,
    overflow: "visible",
    pointerEvents: "none",
  };
}

