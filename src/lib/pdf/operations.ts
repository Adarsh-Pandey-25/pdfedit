import type { PDFPage } from "pdf-lib";
import { normalizeRotation, toRawPageSpace, viewSize } from "@/lib/pdf/page-space";

type RGB = { type: "RGB"; red: number; green: number; blue: number };

async function pdfLib() {
  return import("pdf-lib");
}

export async function mergePdfs(
  files: ArrayBuffer[],
  names?: string[]
): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const label = names?.[i] || `File ${i + 1}`;
    const bytes = files[i];
    if (!bytes || bytes.byteLength === 0) {
      throw new Error(`${label} could not be read (empty file data).`);
    }
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      throw new Error(`${label} could not be merged: ${reason}`);
    }
  }

  return merged.save({ useObjectStreams: true });
}

export async function splitPdf(
  bytes: ArrayBuffer,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const zeroBased = pageNumbers.map((n) => n - 1);
  const pages = await out.copyPages(src, zeroBased);
  pages.forEach((p) => out.addPage(p));
  return out.save({ useObjectStreams: true });
}

export async function splitAllPages(
  bytes: ArrayBuffer
): Promise<{ name: string; data: Uint8Array }[]> {
  const { PDFDocument } = await pdfLib();
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const results: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < src.getPageCount(); i++) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    results.push({
      name: `page-${i + 1}.pdf`,
      data: await out.save({ useObjectStreams: true }),
    });
  }
  return results;
}

export function parsePageRanges(input: string, maxPages: number): number[] {
  const set = new Set<number>();
  const parts = input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      const start = Math.max(1, Math.min(a, b));
      const end = Math.min(maxPages, Math.max(a, b));
      for (let i = start; i <= end; i++) set.add(i);
    } else {
      const n = parseInt(part, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= maxPages) set.add(n);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

export async function rotatePdf(
  bytes: ArrayBuffer,
  rotations: Record<number, number>
): Promise<Uint8Array> {
  const { PDFDocument, degrees } = await pdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  doc.getPages().forEach((page, idx) => {
    const pageNum = idx + 1;
    const deg = rotations[pageNum] ?? 0;
    if (deg) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + deg) % 360));
    }
  });
  return doc.save({ useObjectStreams: true });
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(full, 16);
  return {
    type: "RGB",
    red: ((num >> 16) & 255) / 255,
    green: ((num >> 8) & 255) / 255,
    blue: (num & 255) / 255,
  };
}

export type PageNumberOptions = {
  position:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  format: "numeric" | "page-n" | "roman";
  start: number;
  fontSize: number;
  color: string;
};

function toRoman(num: number): string {
  const map: [number, string][] = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let n = num;
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

/** Largest value toRoman writes in standard notation. */
const ROMAN_MAX = 3999;

/** Thrown by addPageNumbers when the numbering can't be written correctly. */
export class PageNumberInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PageNumberInputError";
  }
}

/**
 * Why numbering `pageCount` pages from `start` in `format` would produce a
 * wrong label, or null if every label is valid.
 */
export function pageNumberRangeError(
  start: number,
  pageCount: number,
  format: PageNumberOptions["format"]
): string | null {
  if (!Number.isInteger(start)) return "Enter a whole number, such as 1.";
  if (start < 0) return "The start number can't be negative.";
  const last = start + (Math.max(pageCount, 1) - 1);
  if (format === "roman") {
    if (start < 1) return "Roman numerals start at 1.";
    if (start > ROMAN_MAX) return `Roman numerals go up to ${ROMAN_MAX}.`;
    if (last > ROMAN_MAX) {
      return `Roman numerals go up to ${ROMAN_MAX}. Starting at ${start}, this ${pageCount}-page PDF would end at ${last}.`;
    }
  } else if (!Number.isSafeInteger(last)) {
    return "That number is too large.";
  }
  return null;
}

/**
 * Parses the raw "Start" field text. Returns the start number, or a message
 * to show next to the field. Pass `pageCount` to check the whole range.
 */
export function parsePageNumberStart(
  text: string,
  format: PageNumberOptions["format"],
  pageCount = 1
): { value: number } | { error: string } {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return { error: "Enter a whole number, such as 1." };
  }
  const value = Number(trimmed);
  const error = pageNumberRangeError(value, pageCount, format);
  return error ? { error } : { value };
}

/**
 * The area viewers display: the CropBox clipped to the MediaBox, falling back
 * to the MediaBox when they don't overlap.
 */
function visibleBox(page: PDFPage) {
  const norm = (r: { x: number; y: number; width: number; height: number }) => ({
    x0: Math.min(r.x, r.x + r.width),
    y0: Math.min(r.y, r.y + r.height),
    x1: Math.max(r.x, r.x + r.width),
    y1: Math.max(r.y, r.y + r.height),
  });
  const media = norm(page.getMediaBox());
  const crop = norm(page.getCropBox());
  const x0 = Math.max(media.x0, crop.x0);
  const y0 = Math.max(media.y0, crop.y0);
  const x1 = Math.min(media.x1, crop.x1);
  const y1 = Math.min(media.y1, crop.y1);
  const box = x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : media;
  return { x: box.x0, y: box.y0, width: box.x1 - box.x0, height: box.y1 - box.y0 };
}

export async function addPageNumbers(
  bytes: ArrayBuffer,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const { PDFDocument, rgb, degrees } = await pdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const rangeError = pageNumberRangeError(
    options.start,
    pages.length,
    options.format
  );
  if (rangeError) throw new PageNumberInputError(rangeError);
  const { loadFonts } = await import("@/lib/pdf-generator");
  const font = (await loadFonts(doc)).regular;
  const c = hexToRgb(options.color);
  const color = rgb(c.red, c.green, c.blue);

  pages.forEach((page, idx) => {
    const num = options.start + idx;
    let label = String(num);
    if (options.format === "page-n") label = `Page ${num}`;
    if (options.format === "roman") label = toRoman(num);

    // Position in the page as displayed (visible box, rotation applied), then
    // map back to raw page space so the number stays upright.
    const box = visibleBox(page);
    const rotation = normalizeRotation(page.getRotation().angle);
    const { width, height } = viewSize(box.width, box.height, rotation);
    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    const margin = 28;
    let x = margin;
    let y = margin;

    if (options.position.includes("top")) y = height - margin - options.fontSize;
    if (options.position.includes("center")) x = (width - textWidth) / 2;
    if (options.position.includes("right")) x = width - margin - textWidth;

    const raw = toRawPageSpace(x, y, 0, rotation, box.width, box.height);

    page.drawText(label, {
      x: box.x + raw.x,
      y: box.y + raw.y,
      size: options.fontSize,
      font,
      color,
      rotate: degrees(raw.angle),
    });
  });

  return doc.save({ useObjectStreams: true });
}

/** An input Protect can't handle; `message` is safe to show to the user. */
export class ProtectInputError extends Error {
  constructor(
    readonly code: "ENCRYPTED_INPUT" | "PDFA_INPUT",
    message: string
  ) {
    super(message);
    this.name = "ProtectInputError";
  }
}

/**
 * 128-bit random owner password (32 hex chars — the most AES-128/R4 uses).
 * Used when the owner password is left blank, so the permissions can't be
 * lifted with the open password. Never logged or returned.
 */
function randomOwnerPassword(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function protectPdf(
  bytes: ArrayBuffer,
  userPassword: string,
  ownerPassword: string,
  permissions: {
    printing: boolean;
    copying: boolean;
    modifying: boolean;
  }
): Promise<Uint8Array> {
  const { PDFDocument: CantooDoc, PDFHeader } = await import("@cantoo/pdf-lib");
  const doc = await CantooDoc.load(bytes, { ignoreEncryption: true });
  // Encrypting an already-encrypted file without decrypting it first leaves
  // its content unreadable, so stop before producing any output.
  if (doc.isEncrypted) {
    throw new ProtectInputError(
      "ENCRYPTED_INPUT",
      "This PDF is already password-protected. Unlock it first, then try again."
    );
  }

  // @cantoo/pdf-lib picks the algorithm from the header version: 1.6/1.7 give
  // AES-128 (V4/R4, AESV2), older headers and 2.0 give RC4. Present 1.7 while
  // encrypting. Older files keep 1.7 (AESV2 needs ≥ 1.6); newer ones (2.0)
  // get their original header back.
  const originalHeader = doc.context.header;
  const [major, minor] = originalHeader.getVersionString().split(".").map(Number);
  doc.context.header = PDFHeader.forVersion(1, 7);
  try {
    doc.encrypt({
      userPassword: userPassword || undefined,
      ownerPassword: ownerPassword || randomOwnerPassword(),
      permissions: {
        printing: permissions.printing ? "highResolution" : false,
        modifying: permissions.modifying,
        copying: permissions.copying,
        annotating: permissions.modifying,
        fillingForms: permissions.modifying,
        contentAccessibility: true,
        documentAssembly: permissions.modifying,
      },
    });
  } catch (e) {
    // The library's own PDF/A guard (PDF/A forbids encryption).
    if (e instanceof Error && e.message.startsWith("Cannot encrypt a PDF/A document")) {
      throw new ProtectInputError(
        "PDFA_INPUT",
        "This is a PDF/A archive file. PDF/A doesn't allow encryption, so it can't be password-protected."
      );
    }
    throw e;
  }
  if (major > 1 || (major === 1 && minor > 7)) doc.context.header = originalHeader;
  return doc.save({ useObjectStreams: false });
}

export async function unlockPdf(bytes: ArrayBuffer): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.save({ useObjectStreams: true });
}

export async function embedImageOnPage(
  bytes: ArrayBuffer,
  pageIndex: number,
  imageBytes: ArrayBuffer,
  opts: { x: number; y: number; width: number; height: number }
): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[pageIndex];
  if (!page) throw new Error("Invalid page");

  let image;
  try {
    image = await doc.embedPng(imageBytes);
  } catch {
    image = await doc.embedJpg(imageBytes);
  }

  page.drawImage(image, {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
  });

  return doc.save({ useObjectStreams: true });
}

export async function flattenCanvasOntoPdf(
  bytes: ArrayBuffer,
  overlays: { pageIndex: number; pngBytes: ArrayBuffer }[]
): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  for (const overlay of overlays) {
    const page = doc.getPages()[overlay.pageIndex];
    if (!page) continue;
    const { width, height } = page.getSize();
    const img = await doc.embedPng(overlay.pngBytes);
    page.drawImage(img, { x: 0, y: 0, width, height });
  }
  return doc.save({ useObjectStreams: true });
}
