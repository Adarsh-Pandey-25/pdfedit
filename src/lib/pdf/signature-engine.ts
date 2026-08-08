"use client";

import { normalizeRotation, toRawPageSpace, viewSize } from "./page-space";

/** A ready-to-place signature bitmap with transparent background. */
export type SignatureAsset = {
  dataUrl: string;
  width: number;
  height: number;
};

/**
 * Placement is stored as a fraction of the page, so it survives zoom, canvas
 * scaling, and differing page sizes — the old pixel-based maths did not.
 */
export type SignaturePlacement = {
  id: string;
  pageIndex: number;
  /** Top-left corner, 0–1 of page width/height, measured as displayed. */
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  asset: SignatureAsset;
};

export const SIGNATURE_INK = ["#111827", "#1D4ED8", "#B91C1C"];
export const DEFAULT_SIGNATURE_WIDTH_RATIO = 0.26;

export type SignatureFont = {
  id: string;
  label: string;
  cssFamily: string;
  /** Optical sizes differ wildly between script faces. */
  sizeFactor: number;
};

export const SIGNATURE_FONTS: SignatureFont[] = [
  {
    id: "Dancing Script",
    label: "Flowing",
    cssFamily: '"Dancing Script", cursive',
    sizeFactor: 1,
  },
  {
    id: "Great Vibes",
    label: "Formal",
    cssFamily: '"Great Vibes", cursive',
    sizeFactor: 1.05,
  },
  {
    id: "Caveat",
    label: "Casual",
    cssFamily: '"Caveat", cursive',
    sizeFactor: 1.1,
  },
  {
    id: "Pacifico",
    label: "Bold",
    cssFamily: '"Pacifico", cursive',
    sizeFactor: 0.85,
  },
];

const SIGNATURE_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&display=swap";

export function injectSignatureFonts(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("pdf-cursive-fonts")) return;
  const link = document.createElement("link");
  link.id = "pdf-cursive-fonts";
  link.rel = "stylesheet";
  link.href = SIGNATURE_FONT_HREF;
  document.head.appendChild(link);
}

/** Rasterising before the webfont arrives silently bakes in a fallback face. */
export async function ensureSignatureFont(font: SignatureFont): Promise<void> {
  injectSignatureFonts();
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.load(`64px ${font.cssFamily}`, "Signature");
    await document.fonts.ready;
  } catch {
    /* fall back to whatever the browser resolves */
  }
}

/* ------------------------------------------------------------------ *
 * Bitmap helpers
 * ------------------------------------------------------------------ */

/**
 * Crops fully transparent margins. Without this the placement box contains a
 * large empty border, so the signature lands smaller and off-centre from where
 * the user dropped it.
 */
export function trimTransparent(
  source: HTMLCanvasElement,
  padding = 6
): HTMLCanvasElement | null {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, source.width, source.height);
  } catch {
    return source;
  }

  let minX = source.width;
  let minY = source.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      if (data.data[(y * source.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) return null;

  const pad = padding;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.min(source.width, maxX + pad + 1) - left;
  const height = Math.min(source.height, maxY + pad + 1) - top;

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const outCtx = out.getContext("2d");
  if (!outCtx) return source;
  outCtx.drawImage(source, left, top, width, height, 0, 0, width, height);
  return out;
}

/** Photographed or scanned signatures arrive on paper; drop the paper. */
export function removeLightBackground(
  canvas: HTMLCanvasElement,
  threshold = 236
): void {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return;
  }
  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const luminance =
      0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    if (luminance >= threshold) {
      pixels[i + 3] = 0;
    } else if (luminance > threshold - 40) {
      // Feather the edge so cropping does not leave a hard halo.
      const ratio = (threshold - luminance) / 40;
      pixels[i + 3] = Math.min(pixels[i + 3], Math.round(255 * ratio));
    }
  }
  ctx.putImageData(data, 0, 0);
}

export function canvasToAsset(canvas: HTMLCanvasElement): SignatureAsset {
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createTypedSignature(
  text: string,
  font: SignatureFont,
  color: string
): Promise<SignatureAsset | null> {
  const value = text.trim();
  if (!value) return null;

  await ensureSignatureFont(font);

  const fontSize = 96 * font.sizeFactor;
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) return null;
  measureCtx.font = `${fontSize}px ${font.cssFamily}`;
  const metrics = measureCtx.measureText(value);

  // Script faces have long ascenders and descenders; size the canvas to them.
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.4;
  const margin = fontSize * 0.3;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(metrics.width + margin * 2);
  canvas.height = Math.ceil(ascent + descent + margin * 2);

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px ${font.cssFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, margin, margin + ascent);

  const trimmed = trimTransparent(canvas);
  return trimmed ? canvasToAsset(trimmed) : null;
}

export async function imageFileToAsset(
  file: File,
  options: { removeBackground: boolean }
): Promise<SignatureAsset | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image"));
      img.src = url;
    });

    // Re-encoding through a canvas normalises webp/gif/bmp into PNG bytes,
    // which is all pdf-lib can embed.
    const canvas = document.createElement("canvas");
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (options.removeBackground) removeLightBackground(canvas);

    const trimmed = trimTransparent(canvas) || canvas;
    return canvasToAsset(trimmed);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ------------------------------------------------------------------ *
 * PDF export
 * ------------------------------------------------------------------ */

export async function applySignatures(
  pdfBytes: ArrayBuffer,
  placements: SignaturePlacement[]
): Promise<Uint8Array> {
  if (!placements.length) throw new Error("No signatures to place");

  const { PDFDocument, degrees } = await import("pdf-lib");
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = doc.getPages();

  // The same signature is usually stamped several times; embed each once.
  const embedded = new Map<string, Awaited<ReturnType<typeof doc.embedPng>>>();

  for (const placement of placements) {
    const page = pages[placement.pageIndex];
    if (!page) continue;

    let image = embedded.get(placement.asset.dataUrl);
    if (!image) {
      image = await doc.embedPng(dataUrlToBytes(placement.asset.dataUrl));
      embedded.set(placement.asset.dataUrl, image);
    }

    const { width: rawWidth, height: rawHeight } = page.getSize();
    const rotation = normalizeRotation(page.getRotation().angle);
    const { width: viewWidth, height: viewHeight } = viewSize(
      rawWidth,
      rawHeight,
      rotation
    );

    const width = placement.widthRatio * viewWidth;
    const height = placement.heightRatio * viewHeight;
    const vx = placement.xRatio * viewWidth;
    // Ratios are measured from the top; PDF space counts up from the bottom.
    const vy = viewHeight - placement.yRatio * viewHeight - height;

    const raw = toRawPageSpace(vx, vy, 0, rotation, rawWidth, rawHeight);

    page.drawImage(image, {
      x: raw.x,
      y: raw.y,
      width,
      height,
      rotate: degrees(raw.angle),
    });
  }

  return doc.save({ useObjectStreams: true });
}
