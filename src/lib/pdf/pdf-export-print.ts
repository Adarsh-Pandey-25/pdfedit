"use client";

import { ensureNormalized, resolveFontSizePt, resolveStrokeWidthPt } from "@/lib/coords";
import type { EditorElement, PointNorm } from "@/lib/editor-types";
import { smoothPathPixels } from "@/lib/editor-types";
import {
  createPageRender,
  rebakePageEdits,
} from "@/lib/pdf/page-render-cache";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import type { EditableTextItem } from "@/lib/pdf/text-extraction";

const RENDER_SCALE = 2;

export type PrintExportProgress = {
  current: number;
  total: number;
};

export type PrintExportOptions = {
  originalBytes: ArrayBuffer;
  elements: EditorElement[];
  textItems: EditableTextItem[];
  fileName: string;
  onProgress?: (p: PrintExportProgress) => void;
  /** When true, automatically invokes print dialog (default true). */
  autoPrint?: boolean;
};

export type DownloadExportOptions = {
  originalBytes: ArrayBuffer;
  elements: EditorElement[];
  textItems: EditableTextItem[];
  fileName: string;
  onProgress?: (p: PrintExportProgress) => void;
  /** html2canvas scale (default 2) */
  captureScale?: number;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function arrowHeadSegments(
  line: { x1: number; y1: number; x2: number; y2: number },
  strokeWidth: number,
  pageWidth: number,
  pageHeight: number
): PointNorm[] {
  const w = pageWidth || 1;
  const h = pageHeight || 1;
  const angle = Math.atan2((line.y2 - line.y1) * h, (line.x2 - line.x1) * w);
  const size = Math.max(8, strokeWidth * 4);
  const spread = Math.PI / 6;
  return [angle - spread, angle + spread].map((a) => ({
    x: line.x2 - (size * Math.cos(a)) / w,
    y: line.y2 - (size * Math.sin(a)) / h,
  }));
}

function renderElementForPrint(
  el: EditorElement,
  pageWidth: number,
  pageHeight: number
): string {
  const d = el.data;
  const x = el.x * pageWidth;
  const y = el.y * pageHeight;
  const w = el.width * pageWidth;
  const h = el.height * pageHeight;
  const rot = el.rotation || 0;
  const opacity = el.opacity ?? 1;

  const boxStyle = `
    position:absolute;
    left:${x}px;
    top:${y}px;
    width:${w}px;
    height:${h}px;
    transform:rotate(${rot}deg);
    transform-origin:center center;
    opacity:${opacity};
    pointer-events:none;
    text-decoration:none;
    overflow:visible;
  `.replace(/\s+/g, " ");

  switch (el.type) {
    case "text": {
      const fontFamily = `'${(d.fontFamily as string) || "PDF-Inter"}', sans-serif`;
      const fontSize = resolveFontSizePt(d);
      const bgRaw =
        (d.backgroundColor as string) ||
        (d.bgColor as string) ||
        "transparent";
      const hasBg =
        !!bgRaw &&
        bgRaw !== "transparent" &&
        bgRaw !== "none" &&
        bgRaw !== "rgba(0,0,0,0)";
      const padding = Number(d.padding ?? 4);
      const borderRadius = Number(d.borderRadius ?? (hasBg ? 4 : 0));
      const padY = hasBg ? padding : 0;
      const padX = hasBg ? padding * 1.5 : 0;

      // Exact same box as InteractiveElement: left/top = placement point.
      // No ascent offset — that was shifting download vs editor.
      return `<div style="
        position:absolute;
        left:${x}px;
        top:${y}px;
        width:${Math.max(w, fontSize)}px;
        height:${Math.max(h, fontSize)}px;
        transform:rotate(${rot}deg);
        transform-origin:center center;
        opacity:${opacity};
        overflow:visible;
        pointer-events:none;
      "><div style="
        position:absolute;
        left:0;
        top:0;
        display:inline-block;
        max-width:100%;
        box-sizing:border-box;
        background:${hasBg ? bgRaw : "transparent"};
        padding:${padY}px ${padX}px;
        border-radius:${hasBg ? borderRadius : 0}px;
        font-family:${fontFamily};
        font-size:${fontSize}px;
        font-weight:${d.bold ? 700 : 400};
        font-style:${d.italic ? "italic" : "normal"};
        color:${(d.color as string) || "#000"};
        line-height:1.15;
        white-space:pre-wrap;
        word-wrap:break-word;
        margin:0;
        overflow:visible;
        text-decoration:none;
        -webkit-font-smoothing:antialiased;
        text-rendering:geometricPrecision;
        -webkit-print-color-adjust:exact;
        print-color-adjust:exact;
      ">${escapeHtml(String(d.text || ""))}</div></div>`;
    }

    case "highlight":
      // Avoid mix-blend-mode in export — html2canvas often offsets blended layers.
      return `<div style="${boxStyle}
        background:${(d.color as string) || "#FDE047"};
        opacity:${(d.opacity as number) ?? 0.45};
      "></div>`;

    case "rectangle":
      return `<div style="${boxStyle}
        border:${resolveStrokeWidthPt(d.strokeWidth as number)}px solid ${(d.strokeColor as string) || "#111"};
        background:${d.fillColor && d.fillColor !== "transparent" ? (d.fillColor as string) : "transparent"};
        border-radius:${(d.borderRadius as number) || 0}px;
        box-sizing:border-box;
      "></div>`;

    case "ellipse":
      return `<div style="${boxStyle}
        border:${resolveStrokeWidthPt(d.strokeWidth as number)}px solid ${(d.strokeColor as string) || "#111"};
        background:${d.fillColor && d.fillColor !== "transparent" ? (d.fillColor as string) : "transparent"};
        border-radius:50%;
        box-sizing:border-box;
      "></div>`;

    case "line":
    case "arrow": {
      const x1 = Number(d.x1) * pageWidth;
      const y1 = Number(d.y1) * pageHeight;
      const x2 = Number(d.x2) * pageWidth;
      const y2 = Number(d.y2) * pageHeight;
      const color = (d.strokeColor as string) || "#111";
      const sw = resolveStrokeWidthPt(d.strokeWidth as number);
      const heads =
        el.type === "arrow"
          ? arrowHeadSegments(
              { x1: Number(d.x1), y1: Number(d.y1), x2: Number(d.x2), y2: Number(d.y2) },
              sw,
              pageWidth,
              pageHeight
            )
          : [];
      const headLines = heads
        .map(
          (seg) =>
            `<line x1="${x2}" y1="${y2}" x2="${seg.x * pageWidth}" y2="${seg.y * pageHeight}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />`
        )
        .join("");
      return `<svg style="position:absolute;top:0;left:0;width:${pageWidth}px;height:${pageHeight}px;pointer-events:none;overflow:visible;" viewBox="0 0 ${pageWidth} ${pageHeight}" xmlns="http://www.w3.org/2000/svg">
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" />
        ${headLines}
      </svg>`;
    }

    case "draw": {
      const points = (d.points as PointNorm[]) || [];
      if (points.length < 2) return "";
      const color = (d.strokeColor as string) || "#111";
      const sw = resolveStrokeWidthPt(d.strokeWidth as number);
      const pathD = smoothPathPixels(points, pageWidth, pageHeight);
      return `<svg style="position:absolute;top:0;left:0;width:${pageWidth}px;height:${pageHeight}px;pointer-events:none;overflow:visible;" viewBox="0 0 ${pageWidth} ${pageHeight}" xmlns="http://www.w3.org/2000/svg">
        <path d="${pathD}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" />
      </svg>`;
    }

    case "cross": {
      const color = (d.color as string) || "#EF4444";
      const size = Math.max(8, Math.min(w, h));
      // Unicode — html2canvas often drops small SVGs.
      return `<div style="
        position:absolute;
        left:${x}px;
        top:${y}px;
        width:${Math.max(w, size)}px;
        height:${Math.max(h, size)}px;
        transform:rotate(${rot}deg);
        transform-origin:center center;
        opacity:${opacity};
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:visible;
        font-family:'Segoe UI Symbol','Arial Unicode MS',Arial,sans-serif;
        font-size:${size * 1.3}px;
        color:${color};
        font-weight:900;
        line-height:1;
        pointer-events:none;
        user-select:none;
      ">✗</div>`;
    }

    case "check": {
      const color = (d.color as string) || "#10B981";
      const size = Math.max(8, Math.min(w, h));
      return `<div style="
        position:absolute;
        left:${x}px;
        top:${y}px;
        width:${Math.max(w, size)}px;
        height:${Math.max(h, size)}px;
        transform:rotate(${rot}deg);
        transform-origin:center center;
        opacity:${opacity};
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:visible;
        font-family:'Segoe UI Symbol','Arial Unicode MS',Arial,sans-serif;
        font-size:${size * 1.3}px;
        color:${color};
        font-weight:900;
        line-height:1;
        pointer-events:none;
        user-select:none;
      ">✓</div>`;
    }

    case "signature":
    case "image":
      return `<img src="${String(d.imageData || "")}" alt="" style="${boxStyle}object-fit:contain;display:block;" />`;

    case "note":
      return `<div style="${boxStyle}
        background:${(d.color as string) || "#FFEB3B"};
        border:1px solid #F59E0B;
        border-radius:4px;
        padding:6px;
        font-size:11px;
        line-height:1.25;
        color:#1f2937;
        box-sizing:border-box;
        text-decoration:none;
      ">📝 ${escapeHtml(String(d.text || "Note"))}</div>`;

    case "link":
      return `<div style="${boxStyle}
        border:1px dashed #4F46E5;
        background:rgba(79,70,229,0.10);
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:10px;
        color:#4F46E5;
        box-sizing:border-box;
        text-decoration:none;
      ">🔗 ${escapeHtml(String(d.url || ""))}</div>`;

    default:
      return "";
  }
}

const PRINT_FONT_FACES = `
@font-face{font-family:"PDF-Inter";src:url("/fonts/Inter-Regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:"PDF-Inter";src:url("/fonts/Inter-Bold.woff2") format("woff2");font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:"PDF-Inter";src:url("/fonts/Inter-Italic.woff2") format("woff2");font-weight:400;font-style:italic;font-display:block}
@font-face{font-family:"PDF-Nunito";src:url("/fonts/Nunito-Regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:"PDF-Nunito";src:url("/fonts/Nunito-Bold.woff2") format("woff2");font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:"PDF-SourceSerif";src:url("/fonts/SourceSerif-Regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:"PDF-SourceSerif";src:url("/fonts/SourceSerif-Bold.woff2") format("woff2");font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:"PDF-LibreCaslon";src:url("/fonts/LibreCaslon-Regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:"PDF-LibreCaslon";src:url("/fonts/LibreCaslon-Bold.woff2") format("woff2");font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:"PDF-JetBrainsMono";src:url("/fonts/JetBrainsMono-Regular.woff2") format("woff2");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:"PDF-JetBrainsMono";src:url("/fonts/JetBrainsMono-Bold.woff2") format("woff2");font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:"PDF-Helvetica";src:local("Helvetica Neue"),local("Helvetica"),local("Arial");font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:"PDF-Helvetica";src:local("Helvetica Neue Bold"),local("Helvetica Bold"),local("Arial Bold");font-weight:700;font-style:normal;font-display:block}
`;

function buildPrintHtml(
  fileName: string,
  pages: { width: number; height: number; imageDataUrl: string; overlayHtml: string }[]
): string {
  const safeName = escapeHtml(fileName);
  const pageBlocks = pages
    .map(
      (p) => `
      <div class="print-page" style="width:${p.width}px;height:${p.height}px;">
        <img src="${p.imageDataUrl}" alt="" width="${p.width}" height="${p.height}" style="display:block;width:100%;height:100%;" />
        <div class="element-overlay">${p.overlayHtml}</div>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeName}</title>
  <style>
    ${PRINT_FONT_FACES}
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{margin:0;padding:0;background:#fff;font-family:system-ui,sans-serif}
    .pages-container{display:flex;flex-direction:column;align-items:flex-start;gap:0}
    .print-page{position:relative;background:#fff;overflow:hidden;page-break-after:always;break-after:page}
    .print-page:last-child{page-break-after:auto}
    .element-overlay{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible}
    .element-overlay *{text-decoration:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    @page{size:auto;margin:0}
    @media print{
      html,body{background:#fff!important}
      .pages-container{padding:0!important;gap:0!important}
      .print-page{margin:0!important;page-break-inside:avoid;break-inside:avoid}
      body *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
    }
  </style>
</head>
<body>
  <div class="pages-container print-view">${pageBlocks}</div>
</body>
</html>`;
}

async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 5000);
        })
    )
  );
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL("image/png", 1);
  const base64 = dataUrl.split(",")[1] || "";
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function buildRenderedPages(
  originalBytes: ArrayBuffer,
  elements: EditorElement[],
  textItems: EditableTextItem[],
  fileName: string,
  onProgress?: (p: PrintExportProgress) => void
): Promise<{
  html: string;
  pageCount: number;
  sizes: Array<{ widthPt: number; heightPt: number }>;
}> {
  const doc = await loadPdfDocument(originalBytes);
  const normalizedElements = elements.map((el) => ensureNormalized(el));
  const pages: {
    width: number;
    height: number;
    imageDataUrl: string;
    overlayHtml: string;
  }[] = [];
  const sizes: Array<{ widthPt: number; heightPt: number }> = [];

  for (let i = 0; i < doc.numPages; i++) {
    onProgress?.({ current: i + 1, total: doc.numPages });

    const pageProxy = await doc.getPage(i + 1);
    const layoutVp = pageProxy.getViewport({ scale: 1 });
    sizes.push({ widthPt: layoutVp.width, heightPt: layoutVp.height });

    const canvas = document.createElement("canvas");
    await renderPageToCanvas(doc, i + 1, RENDER_SCALE, canvas);
    const pr = createPageRender(
      i,
      canvas,
      RENDER_SCALE,
      layoutVp.width,
      layoutVp.height
    );
    rebakePageEdits(pr, textItems);

    const pageElements = normalizedElements.filter((el) => el.pageIndex === i);
    const overlayHtml = pageElements
      .map((el) => renderElementForPrint(el, layoutVp.width, layoutVp.height))
      .join("");

    pages.push({
      width: layoutVp.width,
      height: layoutVp.height,
      imageDataUrl: pr.displayCanvas.toDataURL("image/png"),
      overlayHtml,
    });
  }

  return {
    html: buildPrintHtml(fileName, pages),
    pageCount: doc.numPages,
    sizes,
  };
}

/**
 * Export by rendering into a hidden iframe, then directly opening the native
 * browser print dialog (no intermediate preview page).
 */
export async function exportPdfViaPrint(
  options: PrintExportOptions
): Promise<void> {
  const {
    originalBytes,
    elements,
    textItems,
    fileName,
    onProgress,
    autoPrint = true,
  } = options;

  try {
    const { html } = await buildRenderedPages(
      originalBytes,
      elements,
      textItems,
      fileName,
      onProgress
    );

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframe.contentWindow) {
      iframe.remove();
      throw new Error("Failed to initialize print frame");
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    iframeDoc.title = fileName.replace(/\.pdf$/i, "");

    await waitForImages(iframeDoc);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!autoPrint) {
      // Keep backward compatibility if caller wants manual print trigger.
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      return;
    }

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 800);
      window.removeEventListener("focus", cleanup);
    };
    window.addEventListener("focus", cleanup);
    setTimeout(() => iframe.remove(), 60000);

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  } catch (error) {
    throw error;
  }
}

/**
 * Direct download with pixel-perfect placement.
 * Draws overlays onto the PDF.js canvas using the same normalized→pixel math
 * as the editor — no HTML/html2canvas (that was shifting Add Text).
 */
export async function exportPdfViaDirectDownload(
  options: DownloadExportOptions
): Promise<Uint8Array> {
  const {
    originalBytes,
    elements,
    textItems,
    onProgress,
    captureScale = 2,
  } = options;

  const exportScale = Math.max(2, captureScale);
  const doc = await loadPdfDocument(originalBytes);
  const normalizedElements = elements.map((el) => ensureNormalized(el));

  // Ensure bundled fonts are ready for canvas fillText
  try {
    const { warmCanvasFonts } = await import("@/lib/pdf/page-render-cache");
    await warmCanvasFonts();
  } catch {
    /* non-fatal */
  }

  const {
    drawElementsOnCanvas,
    drawImageElementsOnCanvas,
  } = await import("@/lib/pdf/draw-elements");
  const { PDFDocument } = await import("pdf-lib");
  const outPdf = await PDFDocument.create();

  for (let i = 0; i < doc.numPages; i++) {
    onProgress?.({ current: i + 1, total: doc.numPages });

    const pageProxy = await doc.getPage(i + 1);
    const layoutVp = pageProxy.getViewport({ scale: 1 });
    const widthPt = layoutVp.width;
    const heightPt = layoutVp.height;

    const canvas = document.createElement("canvas");
    // Exact CSS-scale math as editor at zoom=exportScale, pixelRatio=1
    await renderPageToCanvas(doc, i + 1, exportScale, canvas, {
      pixelRatio: 1,
    });

    const pr = createPageRender(
      i,
      canvas,
      exportScale,
      widthPt,
      heightPt
    );
    rebakePageEdits(pr, textItems);

    const ctx = pr.displayCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not get export canvas context");

    drawElementsOnCanvas(
      ctx,
      normalizedElements,
      i,
      pr.displayCanvas.width,
      pr.displayCanvas.height,
      { pageWidthPt: widthPt, pageHeightPt: heightPt }
    );
    await drawImageElementsOnCanvas(
      ctx,
      normalizedElements,
      i,
      pr.displayCanvas.width,
      pr.displayCanvas.height
    );

    const pngImage = await outPdf.embedPng(canvasToPngBytes(pr.displayCanvas));
    const page = outPdf.addPage([widthPt, heightPt]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: widthPt,
      height: heightPt,
    });
  }

  try {
    await doc.cleanup();
  } catch {
    /* ignore */
  }

  // Canvas pages are images — re-attach clickable link hotspots
  const { applyLinkAnnotationsToPdf } = await import("@/lib/pdf/link-utils");
  await applyLinkAnnotationsToPdf(outPdf, normalizedElements);

  return outPdf.save({ useObjectStreams: true });
}
