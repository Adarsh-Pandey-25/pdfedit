/**
 * Smart PDF → bundled web font matching.
 * Subsetted PDF fonts are NOT extracted; we map family names to full web fonts.
 */

export type FontCategory = "sans" | "serif" | "mono" | "display";

export type FontMatch = {
  webFamily: string;
  /** Path under /fonts/*.ttf for pdf-lib, OR StandardFonts key: Helvetica | TimesRoman | Courier */
  pdfLibFont: string;
  category: FontCategory;
};

const INTER: FontMatch = {
  webFamily: "PDF-Inter",
  pdfLibFont: "/fonts/Inter-Regular.ttf",
  category: "sans",
};
const NUNITO: FontMatch = {
  webFamily: "PDF-Nunito",
  pdfLibFont: "/fonts/Nunito-Regular.ttf",
  category: "sans",
};
const HELVETICA: FontMatch = {
  webFamily: "PDF-Helvetica",
  pdfLibFont: "Helvetica",
  category: "sans",
};
const SOURCE_SERIF: FontMatch = {
  webFamily: "PDF-SourceSerif",
  pdfLibFont: "/fonts/SourceSerif-Regular.ttf",
  category: "serif",
};
const LIBRE_CASLON: FontMatch = {
  webFamily: "PDF-LibreCaslon",
  pdfLibFont: "/fonts/LibreCaslon-Regular.ttf",
  category: "serif",
};
const JETBRAINS: FontMatch = {
  webFamily: "PDF-JetBrainsMono",
  pdfLibFont: "/fonts/JetBrainsMono-Regular.ttf",
  category: "mono",
};

/** Normalized key (no spaces/dashes) → match */
export const FONT_MAP: Record<string, FontMatch> = {
  // Modern geometric / neo-grotesque
  sohne: INTER,
  söhne: INTER,
  sohnebuch: INTER,
  sohnedreissig: INTER,
  inter: INTER,
  sfpro: INTER,
  sfprotext: INTER,
  sfprodisplay: INTER,
  segoe: INTER,
  segoeui: INTER,
  roboto: INTER,
  opensans: INTER,
  notosans: INTER,
  lato: INTER,
  sourcesans: INTER,
  sourcesanspro: INTER,
  sourcesans3: INTER,
  ibmplex: INTER,
  ibmplexsans: INTER,
  calibri: INTER,
  carlito: INTER,
  dejavusans: INTER,
  ubuntu: INTER,
  manrope: INTER,
  dmSans: INTER,
  dmsans: INTER,

  // Geometric / rounded
  nunito: NUNITO,
  nunitosans: NUNITO,
  futura: NUNITO,
  avenir: NUNITO,
  avenirnext: NUNITO,
  proxima: NUNITO,
  proximanova: NUNITO,
  gotham: NUNITO,
  montserrat: NUNITO,
  poppins: NUNITO,
  raleway: NUNITO,
  mulish: NUNITO,
  comfortaa: NUNITO,
  circular: NUNITO,

  // Classic Arial family
  arial: HELVETICA,
  arialmt: HELVETICA,
  arialunicode: HELVETICA,
  helvetica: HELVETICA,
  helveticaneue: HELVETICA,
  liberationsans: HELVETICA,
  verdana: HELVETICA,
  tahoma: HELVETICA,
  geneva: HELVETICA,
  freisans: HELVETICA,
  nimbusans: HELVETICA,
  nimbussans: HELVETICA,

  // Classic serif
  times: SOURCE_SERIF,
  timesnewroman: SOURCE_SERIF,
  timesnewromanps: SOURCE_SERIF,
  georgia: SOURCE_SERIF,
  cambria: SOURCE_SERIF,
  liberationserif: SOURCE_SERIF,
  palatino: SOURCE_SERIF,
  palatinolinotype: SOURCE_SERIF,
  charter: SOURCE_SERIF,
  minion: SOURCE_SERIF,
  minionpro: SOURCE_SERIF,
  bookantiqua: SOURCE_SERIF,
  century: SOURCE_SERIF,
  sourceserif: SOURCE_SERIF,
  sourceserif4: SOURCE_SERIF,
  sourceserifpro: SOURCE_SERIF,

  // Modern / transitional serif
  garamond: LIBRE_CASLON,
  ebgaramond: LIBRE_CASLON,
  baskerville: LIBRE_CASLON,
  caslon: LIBRE_CASLON,
  librecaslon: LIBRE_CASLON,
  librecaslontext: LIBRE_CASLON,
  adobeCaslon: LIBRE_CASLON,
  adobecaslon: LIBRE_CASLON,

  // Monospace
  courier: JETBRAINS,
  couriernew: JETBRAINS,
  consolas: JETBRAINS,
  monaco: JETBRAINS,
  menlo: JETBRAINS,
  jetbrains: JETBRAINS,
  jetbrainsmono: JETBRAINS,
  sourcecode: JETBRAINS,
  sourcecodepro: JETBRAINS,
  firacode: JETBRAINS,
  firamono: JETBRAINS,
  liberationmono: JETBRAINS,
  dejavusansmono: JETBRAINS,
  ubuntuMono: JETBRAINS,
  ubuntumono: JETBRAINS,
  inconsolata: JETBRAINS,
};

/** Metric compensation — Inter etc. render slightly larger than Söhne/SF at same pt */
export const SIZE_ADJUSTMENTS: Record<string, number> = {
  "PDF-Inter": 0.96,
  "PDF-Nunito": 0.98,
  "PDF-Helvetica": 1.0,
  "PDF-SourceSerif": 1.0,
  "PDF-LibreCaslon": 0.98,
  "PDF-JetBrainsMono": 0.95,
};

function normalizeFontKey(fontName: string): string {
  return fontName
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/^[a-z]{6}\+/i, "")
    .replace(/[-_,\s]+/g, "")
    .replace(
      /(bold|italic|oblique|regular|medium|light|semibold|semilight|thin|black|heavy|buch|kraft|dreissig|extra|condensed|narrow|display|text)/g,
      ""
    );
}

export function matchFont(
  fontName: string,
  fontDescriptorFlags?: number
): FontMatch {
  const lower = normalizeFontKey(fontName || "");
  const raw = (fontName || "").toLowerCase();

  // Prefer longer keys first so "sourcesans" beats "source"
  const keys = Object.keys(FONT_MAP).sort((a, b) => b.length - a.length);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const cleanKey = key.replace(/[-_\s]/g, "");
    if (cleanKey && (lower.includes(cleanKey) || raw.includes(key))) {
      return FONT_MAP[key];
    }
  }

  // PDF FontDescriptor flags
  // Bit 0 (1) = FixedPitch, Bit 1 (2) = Serif
  if (fontDescriptorFlags != null) {
    if (fontDescriptorFlags & 0x01) return JETBRAINS;
    if (fontDescriptorFlags & 0x02) return SOURCE_SERIF;
  }

  return INTER;
}

export function adjustedFontSize(
  pdfFontSize: number,
  webFamily: string
): number {
  const adj = SIZE_ADJUSTMENTS[webFamily] ?? 1;
  return Math.max(pdfFontSize * adj, 1);
}

/** Resolve bold/italic variant path for custom TTF files */
export function resolveVariantPath(
  regularPath: string,
  isBold: boolean,
  isItalic: boolean
): string {
  if (!regularPath.startsWith("/fonts/")) return regularPath;
  if (isBold && isItalic) {
    return regularPath
      .replace("-Regular", "-BoldItalic")
      .replace("Regular", "BoldItalic");
  }
  if (isBold) {
    return regularPath
      .replace("-Regular", "-Bold")
      .replace("Regular", "Bold");
  }
  if (isItalic) {
    return regularPath
      .replace("-Regular", "-Italic")
      .replace("Regular", "Italic");
  }
  return regularPath;
}

export async function preloadPdfFonts(): Promise<void> {
  if (typeof document === "undefined") return;
  const families = [
    "PDF-Inter",
    "PDF-Nunito",
    "PDF-Helvetica",
    "PDF-SourceSerif",
    "PDF-LibreCaslon",
    "PDF-JetBrainsMono",
  ];
  const weights = [400, 700];
  await Promise.all(
    families.flatMap((family) =>
      weights.map((weight) =>
        document.fonts.load(`${weight} 16px "${family}"`).catch(() => null)
      )
    )
  );
  await document.fonts.ready;
}

export function fontDebugLabel(
  origFont: string,
  match: FontMatch,
  sizePt: number,
  isBold: boolean
): string {
  return `orig-font: ${origFont || "?"} | matched: ${match.webFamily} | size: ${sizePt.toFixed(1)}pt | weight: ${isBold ? 700 : 400}`;
}
