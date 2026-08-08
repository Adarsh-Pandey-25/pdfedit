import {
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFStream,
  type PDFObject,
} from "pdf-lib";

export type ExtractedFont = {
  fontName: string;
  cleanName: string;
  fontData: Uint8Array;
  isBold: boolean;
  isItalic: boolean;
  ref: PDFRef | null;
};

/** Strip PDF subset prefix like "AAAAAB+OpenSans-Regular" → "OpenSans-Regular" */
export function cleanFontName(baseFont: string): string {
  return baseFont
    .replace(/^\//, "")
    .replace(/^[A-Z]{6}\+/, "")
    .trim();
}

function asDict(obj: PDFObject | undefined, context: PDFDocument["context"]): PDFDict | null {
  if (!obj) return null;
  if (obj instanceof PDFDict) return obj;
  if (obj instanceof PDFRef) {
    const looked = context.lookup(obj);
    return looked instanceof PDFDict ? looked : null;
  }
  return null;
}

function streamBytes(stream: PDFObject | undefined): Uint8Array | null {
  if (!stream) return null;
  try {
    if (stream instanceof PDFRawStream) {
      return stream.getContents();
    }
    if (stream instanceof PDFStream) {
      return stream.getContents();
    }
    // Some builds expose getContents on decoded streams
    const any = stream as { getContents?: () => Uint8Array };
    if (typeof any.getContents === "function") {
      return any.getContents();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function flagsFromDescriptor(descriptor: PDFDict): number {
  try {
    const flags = descriptor.lookup(PDFName.of("Flags"));
    if (flags && "asNumber" in flags && typeof flags.asNumber === "function") {
      return flags.asNumber();
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function baseFontString(font: PDFDict): string {
  try {
    const bf = font.lookup(PDFName.of("BaseFont"));
    if (!bf) return "";
    return bf.toString();
  } catch {
    return "";
  }
}

/** Pull FontFile / FontFile2 / FontFile3 bytes from a FontDescriptor */
function fontFileFromDescriptor(
  descriptor: PDFDict,
  context: PDFDocument["context"]
): Uint8Array | null {
  for (const key of ["FontFile2", "FontFile3", "FontFile"] as const) {
    try {
      let file = descriptor.lookup(PDFName.of(key));
      if (file instanceof PDFRef) {
        file = context.lookup(file);
      }
      const bytes = streamBytes(file);
      if (bytes && bytes.length > 100) return bytes;
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Resolve font bytes from a font dictionary (TrueType / Type1 / Type0 descendant).
 */
function extractFromFontDict(
  font: PDFDict,
  context: PDFDocument["context"],
  fontRef: PDFRef | null,
  into: Map<string, ExtractedFont>
) {
  const baseFont = baseFontString(font);
  const cleanName = cleanFontName(baseFont);
  if (!cleanName) return;

  let descriptor = asDict(font.lookup(PDFName.of("FontDescriptor")), context);

  // Type0 / CID: real file is on the descendant font
  if (!descriptor) {
    try {
      const descendants = font.lookup(PDFName.of("DescendantFonts"));
      const arr =
        descendants && "asArray" in descendants
          ? (descendants as { asArray: () => PDFObject[] }).asArray()
          : null;
      if (arr?.length) {
        const first = asDict(arr[0], context);
        if (first) {
          descriptor = asDict(
            first.lookup(PDFName.of("FontDescriptor")),
            context
          );
          if (!baseFont) {
            const childBase = baseFontString(first);
            if (childBase) {
              return extractFromFontDict(first, context, fontRef, into);
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!descriptor) return;

  const fontData = fontFileFromDescriptor(descriptor, context);
  if (!fontData) return;

  const flags = flagsFromDescriptor(descriptor);
  const nameForStyle = cleanName || baseFont;
  const entry: ExtractedFont = {
    fontName: baseFont.replace(/^\//, "") || cleanName,
    cleanName,
    fontData,
    isBold:
      /bold|black|heavy|semibold|demibold/i.test(nameForStyle) ||
      (flags & 0x40000) !== 0,
    isItalic:
      /italic|oblique/i.test(nameForStyle) || (flags & 0x40) !== 0,
    ref: fontRef,
  };

  const keys = [
    entry.fontName,
    entry.cleanName,
    `/${entry.fontName}`,
    baseFont,
  ].filter(Boolean);
  for (let i = 0; i < keys.length; i++) {
    into.set(keys[i], entry);
  }
}

/**
 * Walk every page /Font resource and extract embedded TTF/OTF bytes.
 */
export async function extractEmbeddedFonts(
  pdfDoc: PDFDocument
): Promise<Map<string, ExtractedFont>> {
  const fonts = new Map<string, ExtractedFont>();
  const context = pdfDoc.context;

  for (const page of pdfDoc.getPages()) {
    try {
      const resources = page.node.Resources();
      if (!resources) continue;
      const fontDict = resources.lookup(PDFName.of("Font"), PDFDict);
      if (!(fontDict instanceof PDFDict)) continue;

      for (const [, fontRefOrDict] of fontDict.entries()) {
        const fontRef =
          fontRefOrDict instanceof PDFRef ? fontRefOrDict : null;
        const font = asDict(fontRefOrDict, context);
        if (!font) continue;
        extractFromFontDict(font, context, fontRef, fonts);
      }
    } catch {
      /* skip page */
    }
  }

  return fonts;
}

export async function extractEmbeddedFontsFromBytes(
  pdfBytes: ArrayBuffer | Uint8Array
): Promise<Map<string, ExtractedFont>> {
  const { PDFDocument: PD } = await import("pdf-lib");
  const bytes =
    pdfBytes instanceof Uint8Array
      ? pdfBytes
      : new Uint8Array(pdfBytes);
  const doc = await PD.load(bytes, { ignoreEncryption: true });
  return extractEmbeddedFonts(doc);
}
