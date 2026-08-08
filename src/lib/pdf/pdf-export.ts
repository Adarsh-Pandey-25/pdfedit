import type { Degrees, PDFFont } from "pdf-lib";
import type { EditableTextItem } from "./text-extraction";
import { parseCssColor, parseHexColor } from "./text-extraction";
import { getRotationFromTransform } from "./pdf-coordinates";
import {
  adjustedFontSize,
  matchFont,
  resolveVariantPath,
} from "./font-matcher";

export type AnnotationStroke = {
  tool: string;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  text?: string;
};

const fontBytesCache = new Map<string, ArrayBuffer>();

async function loadFontBytes(path: string): Promise<ArrayBuffer> {
  const cached = fontBytesCache.get(path);
  if (cached) return cached;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Font fetch failed: ${path}`);
  const bytes = await res.arrayBuffer();
  fontBytesCache.set(path, bytes);
  return bytes;
}

/**
 * Cover ORIGINAL text bounds, then drawText with matched bundled font.
 */
export async function applyEditedTextToPdf(
  pdfBytes: ArrayBuffer,
  textItems: EditableTextItem[]
): Promise<Uint8Array> {
  const { PDFDocument, rgb, degrees } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;

  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  doc.registerFontkit(fontkit);

  const pages = doc.getPages();

  const changed = textItems.filter(
    (t) => t.isDeleted || (t.isEdited && t.currentText !== t.originalText)
  );
  if (!changed.length) {
    return doc.save({ useObjectStreams: true });
  }

  const fontCache = new Map<string, PDFFont>();
  const { loadFonts } = await import("@/lib/pdf-generator");
  const universalFonts = loadFonts(doc);

  const getExportFont = async (item: EditableTextItem): Promise<PDFFont> => {
    const match = matchFont(
      item.embeddedFontName || item.embeddedCleanName || item.fontName,
      item.fontDescriptorFlags
    );
    const key = `${match.pdfLibFont}|${item.isBold}|${item.isItalic}`;
    const cached = fontCache.get(key);
    if (cached) return cached;

    let path = match.pdfLibFont;

    if (path.startsWith("/fonts/")) {
      path = resolveVariantPath(path, item.isBold, item.isItalic);
      // Fall back to Regular/Bold if Italic variant missing
      const tryPaths = [path];
      if (item.isItalic && !path.includes("Italic")) {
        /* already resolved */
      }
      if (path.includes("BoldItalic")) {
        tryPaths.push(path.replace("-BoldItalic", "-Bold"));
        tryPaths.push(path.replace("-BoldItalic", "-Regular"));
      } else if (path.includes("-Italic")) {
        tryPaths.push(path.replace("-Italic", "-Regular"));
      } else if (path.includes("-Bold")) {
        tryPaths.push(path.replace("-Bold", "-Regular"));
      }

      for (let i = 0; i < tryPaths.length; i++) {
        try {
          const bytes = await loadFontBytes(tryPaths[i]);
          const font = await doc.embedFont(bytes, { subset: true });
          fontCache.set(key, font);
          return font;
        } catch {
          /* try next */
        }
      }
    }

    const fallback = await universalFonts;
    const font =
      match.category === "mono"
        ? item.isBold
          ? fallback.monoBold
          : fallback.mono
        : item.isBold && item.isItalic
          ? fallback.boldItalic
          : item.isBold
            ? fallback.bold
            : item.isItalic
              ? fallback.italic
              : fallback.regular;
    fontCache.set(key, font);
    return font;
  };

  for (const item of changed) {
    const page = pages[item.pageIndex];
    if (!page) continue;

    const match = matchFont(
      item.embeddedFontName || item.embeddedCleanName || item.fontName,
      item.fontDescriptorFlags
    );
    const font = await getExportFont(item);
    const rawSize = Math.max(
      item.originalPdfFontSize || item.pdfFontSize || item.fontSize || 4,
      4
    );
    const pdfFontSize = adjustedFontSize(rawSize, match.webFamily);
    const ox = item.originalPdfX ?? item.pdfX;
    const oy = item.originalPdfY ?? item.pdfY;
    const safeOriginal = safeTextForFont(item.originalText || " ", font);
    const safeCurrent = safeTextForFont(item.currentText || " ", font);
    const origW = Math.max(
      item.originalPdfWidth || item.pdfWidth,
      font.widthOfTextAtSize(safeOriginal, pdfFontSize)
    );
    const newW = item.isDeleted
      ? 0
      : font.widthOfTextAtSize(safeCurrent, pdfFontSize);
    const coverW = Math.max(origW, newW) + 4;

    const patch = parseCssColor(
      item.patchColor || item.backgroundColor || "rgb(255,255,255)"
    );

    const origH = Math.max(
      item.originalPdfHeight || pdfFontSize,
      pdfFontSize
    );

    page.drawRectangle({
      x: ox - 2,
      y: oy - 2,
      width: coverW,
      height: origH + 4,
      color: rgb(patch.r / 255, patch.g / 255, patch.b / 255),
      borderWidth: 0,
    });

    if (!item.isDeleted && item.currentText.trim()) {
      const fg = parseHexColor(item.color || "#000000");
      const rot = getRotationFromTransform(item.transform || []);

      const opts: {
        x: number;
        y: number;
        size: number;
        font: PDFFont;
        color: ReturnType<typeof rgb>;
        rotate?: Degrees;
      } = {
        x: ox,
        y: oy,
        size: pdfFontSize,
        font,
        color: rgb(fg.r / 255, fg.g / 255, fg.b / 255),
      };

      if (Math.abs(rot) > 0.5) {
        opts.rotate = degrees(rot);
      }

      page.drawText(safeCurrent, opts);
    }
  }

  return doc.save({ useObjectStreams: true });
}

function safeTextForFont(text: string, font: PDFFont): string {
  let output = "";
  for (const character of Array.from(text)) {
    try {
      font.encodeText(character);
      output += character;
    } catch {
      output += "?";
    }
  }
  return output;
}

export async function exportEditedPdf(opts: {
  originalBytes: ArrayBuffer;
  textItems: EditableTextItem[];
  overlayPngs?: { pageIndex: number; pngBytes: ArrayBuffer }[];
  elements?: import("@/lib/editor-types").EditorElement[];
}): Promise<Uint8Array> {
  let bytes = new Uint8Array(opts.originalBytes);

  if (opts.overlayPngs?.length) {
    const { flattenCanvasOntoPdf } = await import("./operations");
    const flattened = await flattenCanvasOntoPdf(
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer,
      opts.overlayPngs
    );
    bytes = new Uint8Array(flattened);
  }

  const ab = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  let out = await applyEditedTextToPdf(ab, opts.textItems);

  if (opts.elements?.length) {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(out, { ignoreEncryption: true });
    const { applyElementsToPdfDoc } = await import("./draw-elements");
    await applyElementsToPdfDoc(doc, opts.elements);
    out = await doc.save({ useObjectStreams: true });
  }

  return out;
}

/**
 * High-quality export: each page is a PNG of the canvas (pixel-identical to editor).
 * Text is not selectable in the output.
 */
export async function exportCanvasPdf(opts: {
  pages: {
    pngBytes: ArrayBuffer;
    widthPdf: number;
    heightPdf: number;
  }[];
}): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();

  for (const p of opts.pages) {
    const png = await doc.embedPng(p.pngBytes);
    const page = doc.addPage([p.widthPdf, p.heightPdf]);
    page.drawImage(png, {
      x: 0,
      y: 0,
      width: p.widthPdf,
      height: p.heightPdf,
    });
  }

  return doc.save({ useObjectStreams: true });
}
