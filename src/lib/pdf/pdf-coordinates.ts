import type { CSSProperties } from "react";
import type { EditableTextItem } from "./text-extraction";
import {
  adjustedFontSize,
  matchFont,
  type FontMatch,
} from "./font-matcher";

const PATCH_PAD_PX = 2;

export function resolveItemFontMatch(item: EditableTextItem): FontMatch {
  return matchFont(
    item.embeddedFontName || item.embeddedCleanName || item.fontName,
    item.fontDescriptorFlags
  );
}

/**
 * Convert PDF-space text metrics → CSS overlay box (top-left origin).
 * Uses ORIGINAL bounds for patch sizing when available.
 */
export function pdfItemToCssBox(
  item: EditableTextItem,
  zoom: number
): { left: number; top: number; width: number; height: number; fontSize: number } {
  const match = resolveItemFontMatch(item);
  const rawPt = item.originalPdfFontSize || item.pdfFontSize;
  const fontSize = adjustedFontSize(rawPt, match.webFamily) * zoom;
  const pdfX = item.originalPdfX ?? item.pdfX;
  const pdfY = item.originalPdfY ?? item.pdfY;
  const pdfW = item.originalPdfWidth ?? item.pdfWidth;
  const cssX = pdfX * zoom;
  const cssY = (item.pageHeightPdf - pdfY) * zoom - fontSize;
  const cssW = Math.max(pdfW * zoom, fontSize * 0.4);
  return {
    left: cssX,
    top: cssY,
    width: cssW,
    height: fontSize,
    fontSize,
  };
}

/** Patch rect: always ≥ original size, + padding; expands if new text is longer */
export function patchCssRect(
  item: EditableTextItem,
  zoom: number,
  currentTextWidthPx?: number
): { left: number; top: number; width: number; height: number } {
  const match = resolveItemFontMatch(item);
  const origFont = adjustedFontSize(
    item.originalPdfFontSize || item.pdfFontSize,
    match.webFamily
  );
  const origW = item.originalPdfWidth ?? item.pdfWidth;
  const origH = item.originalPdfHeight || origFont;
  const pdfX = item.originalPdfX ?? item.pdfX;
  const pdfY = item.originalPdfY ?? item.pdfY;

  const fontPx = origFont * zoom;
  const left = pdfX * zoom - PATCH_PAD_PX;
  const top = (item.pageHeightPdf - pdfY) * zoom - fontPx - PATCH_PAD_PX;
  const origWpx = origW * zoom;
  const width =
    Math.max(origWpx, currentTextWidthPx ?? 0, fontPx * 0.4) + PATCH_PAD_PX * 2;
  const height = Math.max(origH * zoom, fontPx) + PATCH_PAD_PX * 2;

  return { left, top, width, height };
}

export function canvasZoom(
  canvas: HTMLCanvasElement | null,
  pageWidthPdf: number
): number {
  if (!canvas || !pageWidthPdf) return 1;
  const cssW = canvas.clientWidth || canvas.width;
  return cssW / pageWidthPdf;
}

export function getRotationFromTransform(transform: number[]): number {
  if (!transform || transform.length < 2) return 0;
  return (Math.atan2(transform[1], transform[0]) * 180) / Math.PI;
}

const NO_UNDERLINE: CSSProperties = {
  textDecoration: "none",
  textDecorationLine: "none",
  textDecorationColor: "transparent",
  border: "none",
  borderBottom: "none",
  outline: "none",
  outlineWidth: 0,
  boxShadow: "none",
  WebkitAppearance: "none",
};

/** Text overlay styles — matched bundled web font (full glyph set) */
export function exactTextStyle(
  item: EditableTextItem,
  zoom: number
): CSSProperties {
  const match = resolveItemFontMatch(item);
  const box = pdfItemToCssBox(item, zoom);
  const family = `'${match.webFamily}', -apple-system, BlinkMacSystemFont, sans-serif`;

  return {
    position: "absolute",
    left: box.left,
    top: box.top,
    fontFamily: family,
    fontSize: box.fontSize,
    fontWeight: item.isBold ? 700 : 400,
    fontStyle: item.isItalic ? "italic" : "normal",
    color: item.color,
    lineHeight: 1,
    letterSpacing: 0,
    whiteSpace: "pre",
    padding: 0,
    margin: 0,
    background: "transparent",
    transformOrigin: "left top",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
    fontKerning: "normal",
    fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
    fontOpticalSizing: "auto",
    fontVariantLigatures: "normal",
    fontSynthesis: "none",
    minWidth: Math.max(box.width, box.fontSize * 0.5),
    height: box.height,
    width: "max-content",
    zIndex: 11,
    ...NO_UNDERLINE,
  };
}

export function patchLayerStyle(
  item: EditableTextItem,
  zoom: number,
  patchColor: string,
  currentTextWidthPx?: number
): CSSProperties {
  const rect = patchCssRect(item, zoom, currentTextWidthPx);
  return {
    position: "absolute",
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    background: patchColor,
    zIndex: 10,
    pointerEvents: "none",
    border: "none",
    outline: "none",
    boxShadow: "none",
  };
}
