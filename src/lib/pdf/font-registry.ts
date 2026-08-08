import type { ExtractedFont } from "./font-extractor";
import { cleanFontName } from "./font-extractor";

/**
 * Shared registry of embedded font bytes keyed by PDF BaseFont / clean names.
 * Populated during PDF open; used by @font-face injection and export.
 */
const bytesByKey = new Map<string, Uint8Array>();
const metaByKey = new Map<string, { isBold: boolean; isItalic: boolean; cleanName: string }>();

export function registerFontBytes(
  names: string[],
  data: Uint8Array,
  meta?: { isBold?: boolean; isItalic?: boolean }
) {
  if (!data?.length) return;
  const clean = cleanFontName(names[0] || "");
  const isBold =
    meta?.isBold ??
    /bold|black|heavy|semibold|demibold/i.test(clean);
  const isItalic =
    meta?.isItalic ?? /italic|oblique/i.test(clean);

  for (const raw of names) {
    if (!raw) continue;
    const variants = [
      raw,
      raw.replace(/^\//, ""),
      cleanFontName(raw),
    ];
    for (const k of variants) {
      if (!k) continue;
      if (!bytesByKey.has(k) || data.length >= (bytesByKey.get(k)?.length || 0)) {
        bytesByKey.set(k, data);
        metaByKey.set(k, { isBold, isItalic, cleanName: clean || k });
      }
    }
  }
}

export function registerExtractedFonts(fonts: Map<string, ExtractedFont>) {
  fonts.forEach((font) => {
    registerFontBytes(
      [font.fontName, font.cleanName, `/${font.fontName}`],
      font.fontData,
      { isBold: font.isBold, isItalic: font.isItalic }
    );
  });
}

export function lookupFontBytes(name: string | undefined | null): Uint8Array | null {
  if (!name) return null;
  return (
    bytesByKey.get(name) ||
    bytesByKey.get(name.replace(/^\//, "")) ||
    bytesByKey.get(cleanFontName(name)) ||
    null
  );
}

export function lookupFontMeta(name: string | undefined | null) {
  if (!name) return null;
  return (
    metaByKey.get(name) ||
    metaByKey.get(name.replace(/^\//, "")) ||
    metaByKey.get(cleanFontName(name)) ||
    null
  );
}

export function clearFontRegistry() {
  bytesByKey.clear();
  metaByKey.clear();
}

export function listRegisteredFontKeys(): string[] {
  return Array.from(bytesByKey.keys());
}

/** Stable CSS family name for an embedded PDF font */
export function cssFamilyForEmbedded(cleanOrFull: string): string {
  const clean = cleanFontName(cleanOrFull) || "Unknown";
  return `pdf-font-${clean.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
