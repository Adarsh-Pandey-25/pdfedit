import { extractEmbeddedFontsFromBytes } from "./font-extractor";
import {
  clearFontRegistry,
  cssFamilyForEmbedded,
  listRegisteredFontKeys,
  lookupFontBytes,
  lookupFontMeta,
  registerExtractedFonts,
  registerFontBytes,
} from "./font-registry";

export type FontFaceMap = Map<string, string>;

const FALLBACK_FACES: { family: string; files: { weight: number; style: string; url: string }[] }[] = [
  {
    family: "pdf-fallback-Inter",
    files: [
      { weight: 400, style: "normal", url: "/fonts/Inter-Regular.woff2" },
      { weight: 700, style: "normal", url: "/fonts/Inter-Bold.woff2" },
      { weight: 400, style: "italic", url: "/fonts/Inter-Italic.woff2" },
      { weight: 700, style: "italic", url: "/fonts/Inter-BoldItalic.woff2" },
    ],
  },
  {
    family: "pdf-fallback-LiberationSerif",
    files: [
      { weight: 400, style: "normal", url: "/fonts/LiberationSerif-Regular.woff2" },
      { weight: 700, style: "normal", url: "/fonts/LiberationSerif-Bold.woff2" },
    ],
  },
  {
    family: "pdf-fallback-LiberationMono",
    files: [
      { weight: 400, style: "normal", url: "/fonts/LiberationMono-Regular.woff2" },
      { weight: 700, style: "normal", url: "/fonts/LiberationMono-Bold.woff2" },
    ],
  },
];

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
}

function detectFontFormat(bytes: Uint8Array): string {
  if (bytes.length < 4) return "truetype";
  // OTTO = CFF OpenType
  if (
    bytes[0] === 0x4f &&
    bytes[1] === 0x54 &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x4f
  ) {
    return "opentype";
  }
  // wOFF
  if (
    bytes[0] === 0x77 &&
    bytes[1] === 0x4f &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "woff";
  }
  // ttcf
  if (
    bytes[0] === 0x74 &&
    bytes[1] === 0x74 &&
    bytes[2] === 0x63 &&
    bytes[3] === 0x66
  ) {
    return "truetype";
  }
  return "truetype";
}

function revokeOldUrls(styleEl: HTMLStyleElement) {
  const prev = styleEl.dataset.blobUrls;
  if (!prev) return;
  for (const u of prev.split("|")) {
    try {
      URL.revokeObjectURL(u);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Extract embedded fonts from PDF bytes, register them, inject @font-face CSS.
 * Returns a map of PDF font name → CSS font-family.
 */
export async function injectPdfFontsToDocument(
  pdfBytes: ArrayBuffer | Uint8Array
): Promise<FontFaceMap> {
  if (typeof document === "undefined") {
    return new Map();
  }

  clearFontRegistry();

  try {
    const extracted = await extractEmbeddedFontsFromBytes(pdfBytes);
    registerExtractedFonts(extracted);
  } catch (e) {
    console.warn("[pdf-fonts] pdf-lib extraction failed", e);
  }

  const styleEl =
    (document.getElementById("pdf-embedded-fonts") as HTMLStyleElement | null) ||
    document.createElement("style");
  styleEl.id = "pdf-embedded-fonts";
  revokeOldUrls(styleEl);

  const fontFaces: FontFaceMap = new Map();
  const blobUrls: string[] = [];
  let css = "";

  const injectedFamilies = new Set<string>();
  const seenKeys = listRegisteredFontKeys();

  for (let ki = 0; ki < seenKeys.length; ki++) {
    const key = seenKeys[ki];
    const data = lookupFontBytes(key);
    if (!data) continue;
    const meta = lookupFontMeta(key);
    const clean = meta?.cleanName || key;
    const familyName = cssFamilyForEmbedded(clean);

    if (!injectedFamilies.has(familyName)) {
      const format = detectFontFormat(data);
      const mime =
        format === "woff"
          ? "font/woff"
          : format === "opentype"
            ? "font/otf"
            : "font/ttf";
      const blob = new Blob([toArrayBuffer(data)], { type: mime });
      const url = URL.createObjectURL(blob);
      blobUrls.push(url);

      css += `
@font-face {
  font-family: '${familyName}';
  src: url('${url}') format('${format}');
  font-weight: ${meta?.isBold ? 700 : 400};
  font-style: ${meta?.isItalic ? "italic" : "normal"};
  font-display: block;
}
`;
      injectedFamilies.add(familyName);
    }

    fontFaces.set(key, familyName);
    fontFaces.set(cleanFontAlias(key), familyName);
  }

  // Bundled metric-compatible fallbacks
  for (const face of FALLBACK_FACES) {
    for (const file of face.files) {
      css += `
@font-face {
  font-family: '${face.family}';
  src: url('${file.url}') format('woff2');
  font-weight: ${file.weight};
  font-style: ${file.style};
  font-display: swap;
}
`;
    }
  }

  styleEl.textContent = css;
  styleEl.dataset.blobUrls = blobUrls.join("|");
  if (!styleEl.parentNode) document.head.appendChild(styleEl);

  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  return fontFaces;
}

function cleanFontAlias(name: string): string {
  return name.replace(/^\//, "").replace(/^[A-Z]{6}\+/, "");
}

/** Resolve CSS family for a text item given the face map */
export function resolveCssFontFamily(
  embeddedFontName: string | undefined,
  embeddedCleanName: string | undefined,
  fontFaceMap: FontFaceMap | null | undefined,
  fallbackCategory: "sans" | "serif" | "mono" = "sans"
): string {
  const candidates = [embeddedFontName, embeddedCleanName].filter(
    Boolean
  ) as string[];

  for (const c of candidates) {
    const hit =
      fontFaceMap?.get(c) ||
      fontFaceMap?.get(c.replace(/^\//, "")) ||
      fontFaceMap?.get(cleanFontAlias(c));
    if (hit) return `'${hit}', ${fallbackStack(fallbackCategory)}`;
  }

  // Try registry even if map missed (e.g. late pdf.js registration)
  for (const c of candidates) {
    if (lookupFontBytes(c)) {
      const fam = cssFamilyForEmbedded(c);
      return `'${fam}', ${fallbackStack(fallbackCategory)}`;
    }
  }

  return fallbackStack(fallbackCategory);
}

function fallbackStack(cat: "sans" | "serif" | "mono"): string {
  if (cat === "serif") {
    return "'pdf-fallback-LiberationSerif', 'Times New Roman', Times, serif";
  }
  if (cat === "mono") {
    return "'pdf-fallback-LiberationMono', 'Courier New', Courier, monospace";
  }
  return "'pdf-fallback-Inter', Arial, Helvetica, sans-serif";
}

export function categoryFromFontName(name: string): "sans" | "serif" | "mono" {
  const n = name.toLowerCase();
  if (
    n.includes("courier") ||
    n.includes("mono") ||
    n.includes("consolas") ||
    n.includes("menlo")
  ) {
    return "mono";
  }
  if (
    n.includes("times") ||
    n.includes("serif") ||
    n.includes("roman") ||
    n.includes("georgia") ||
    n.includes("garamond") ||
    n.includes("cambria")
  ) {
    return "serif";
  }
  return "sans";
}

/** Register font bytes discovered via pdf.js commonObjs during text extraction */
export function registerPdfJsFontData(
  pdfjsFontName: string,
  embeddedName: string,
  data: Uint8Array | ArrayBuffer | number[] | null | undefined,
  meta?: { isBold?: boolean; isItalic?: boolean }
): string | null {
  if (!data) return null;
  let bytes: Uint8Array;
  if (data instanceof Uint8Array) bytes = data;
  else if (data instanceof ArrayBuffer) bytes = new Uint8Array(data);
  else if (Array.isArray(data)) bytes = new Uint8Array(data);
  else return null;
  if (bytes.length < 100) return null;

  const clean = cleanFontAlias(embeddedName || pdfjsFontName);
  registerFontBytes(
    [embeddedName, clean, pdfjsFontName],
    bytes,
    meta
  );

  // Hot-patch @font-face if document is available and face not yet loaded
  if (typeof document !== "undefined") {
    const family = cssFamilyForEmbedded(clean);
    const existing = Array.from(document.fonts).some((f) => f.family === family);
    if (!existing) {
      try {
        const format = detectFontFormat(bytes);
        const face = new FontFace(family, toArrayBuffer(bytes), {
          weight: meta?.isBold ? "700" : "400",
          style: meta?.isItalic ? "italic" : "normal",
          display: "block",
        });
        void face.load().then((loaded) => {
          document.fonts.add(loaded);
        });
        const styleEl =
          (document.getElementById(
            "pdf-embedded-fonts"
          ) as HTMLStyleElement | null) || document.createElement("style");
        styleEl.id = "pdf-embedded-fonts";
        const mime =
          format === "woff"
            ? "font/woff"
            : format === "opentype"
              ? "font/otf"
              : "font/ttf";
        const url = URL.createObjectURL(
          new Blob([toArrayBuffer(bytes)], { type: mime })
        );
        styleEl.textContent =
          (styleEl.textContent || "") +
          `
@font-face {
  font-family: '${family}';
  src: url('${url}') format('${format}');
  font-weight: ${meta?.isBold ? 700 : 400};
  font-style: ${meta?.isItalic ? "italic" : "normal"};
  font-display: block;
}
`;
        if (!styleEl.parentNode) document.head.appendChild(styleEl);
        const prev = styleEl.dataset.blobUrls || "";
        styleEl.dataset.blobUrls = prev ? `${prev}|${url}` : url;
      } catch {
        /* FontFace may fail for subset CFF — CSS blob may still work */
      }
    }
    return family;
  }
  return cssFamilyForEmbedded(clean);
}
