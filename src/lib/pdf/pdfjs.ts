"use client";

import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

let workerReady = false;
let pdfjsModule: typeof import("pdfjs-dist") | null = null;
const activeRenders = new WeakMap<HTMLCanvasElement, RenderTask>();

async function getPdfjs() {
  if (typeof window === "undefined") {
    throw new Error("PDF.js is only available in the browser");
  }
  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist");
  }
  if (!workerReady) {
    pdfjsModule.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsModule.version}/build/pdf.worker.min.mjs`;
    workerReady = true;
  }
  return pdfjsModule;
}

export type PdfDoc = PDFDocumentProxy;

export type RenderPageOptions = {
  /**
   * Internal bitmap multiplier. Use {@link getDisplayPixelRatio} for on-screen
   * views (HiDPI). Leave at 1 (default) for export/compress so byte sizes stay exact.
   */
  pixelRatio?: number;
};

/**
 * Device pixel ratio × quality boost for crisp on-screen PDF text.
 * Capped to avoid huge canvases on 3× displays.
 */
export function getDisplayPixelRatio(extraQuality = 1.25): number {
  if (typeof window === "undefined") return 1;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(Math.max(1, dpr) * extraQuality, 3);
}

/**
 * PDF.js transfers the bytes it is given to its worker, which DETACHES the
 * caller's ArrayBuffer (byteLength becomes 0). Callers routinely keep their
 * buffer around to hand to pdf-lib later, so always give PDF.js a private copy.
 */
function toOwnedBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (data.byteLength === 0) {
    throw new Error(
      "PDF data is empty or has already been transferred to a worker."
    );
  }
  // Constructing from a view copies its contents into a fresh buffer.
  return data instanceof Uint8Array
    ? new Uint8Array(data)
    : new Uint8Array(data.slice(0));
}

export async function loadPdfDocument(
  data: ArrayBuffer | Uint8Array,
  password?: string
): Promise<PdfDoc> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({
    data: toOwnedBytes(data),
    password,
    useSystemFonts: true,
    disableFontFace: false,
  });
  return loadingTask.promise;
}

/**
 * Render a PDF page onto a canvas.
 *
 * `scale` is the **CSS / logical** zoom (1 = 72dpi CSS pixels per PDF point).
 * When `pixelRatio` > 1, the bitmap is rendered at `scale * pixelRatio` while
 * CSS width/height stay at the logical size — sharp on Retina/HiDPI.
 */
export async function renderPageToCanvas(
  doc: PdfDoc,
  pageNumber: number,
  scale = 1.5,
  canvas?: HTMLCanvasElement,
  options?: RenderPageOptions
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const pixelRatio = Math.max(0.5, options?.pixelRatio ?? 1);
  const renderScale = scale * pixelRatio;
  const viewport = page.getViewport({ scale: renderScale });
  const cssViewport =
    pixelRatio === 1 ? viewport : page.getViewport({ scale });

  const target = canvas || document.createElement("canvas");
  const context = target.getContext("2d", {
    alpha: false,
    willReadFrequently: false,
  });
  if (!context) throw new Error("Could not get canvas context");

  // Cancel any in-flight render on this canvas (avoids PDF.js conflict errors)
  const prev = activeRenders.get(target);
  if (prev) {
    try {
      prev.cancel();
    } catch {
      /* ignore */
    }
    activeRenders.delete(target);
  }

  target.width = Math.floor(viewport.width);
  target.height = Math.floor(viewport.height);

  // Logical CSS size — browser downscales the high-res bitmap for display
  if (pixelRatio !== 1) {
    target.style.width = `${cssViewport.width}px`;
    target.style.height = `${cssViewport.height}px`;
  } else {
    target.style.removeProperty("width");
    target.style.removeProperty("height");
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const task = page.render({
    canvasContext: context,
    viewport,
    canvas: target,
    intent: "display",
  });
  activeRenders.set(target, task);

  try {
    await task.promise;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Cancellation is expected when rapidly switching pages/zoom
    if (/cancel/i.test(msg)) {
      return target;
    }
    throw e;
  } finally {
    if (activeRenders.get(target) === task) {
      activeRenders.delete(target);
    }
  }

  return target;
}

export async function renderPageThumbnail(
  doc: PdfDoc,
  pageNumber: number,
  maxWidth = 180
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const cssScale = maxWidth / base.width;
  // Sharper thumbs on HiDPI without huge bitmaps
  const pixelRatio =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1;
  const canvas = await renderPageToCanvas(doc, pageNumber, cssScale, undefined, {
    pixelRatio,
  });
  return canvas.toDataURL("image/jpeg", 0.78);
}

export async function extractTextFromPdf(doc: PdfDoc): Promise<string> {
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean);
    parts.push(strings.join(" "));
  }
  return parts.join("\n\n");
}
