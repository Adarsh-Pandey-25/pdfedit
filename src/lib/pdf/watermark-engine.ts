"use client";

/**
 * Single-watermark engine.
 *
 * The same placement math powers the live canvas preview and the exported PDF,
 * so what the user sees is what gets written into the file.
 */

import { normalizeRotation, toRawPageSpace, viewSize } from "./page-space";

export const WATERMARK_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

type FontVariant = "regular" | "bold" | "italic" | "boldItalic";

type FontFamilyDef = {
  label: string;
  cssFamily: string;
  files: { regular: string } & Partial<Record<FontVariant, string>>;
};

export const WATERMARK_FONTS = {
  inter: {
    label: "Inter (Sans)",
    cssFamily: '"PDF-Inter", Inter, system-ui, sans-serif',
    files: {
      regular: "/fonts/Inter-Regular.ttf",
      bold: "/fonts/Inter-Bold.ttf",
      italic: "/fonts/Inter-Italic.ttf",
      boldItalic: "/fonts/Inter-BoldItalic.ttf",
    },
  },
  serif: {
    label: "Source Serif (Serif)",
    cssFamily: '"PDF-SourceSerif", Georgia, "Times New Roman", serif',
    files: {
      regular: "/fonts/SourceSerif4-Regular.ttf",
      bold: "/fonts/SourceSerif4-Bold.ttf",
      italic: "/fonts/SourceSerif4-Italic.ttf",
    },
  },
  mono: {
    label: "JetBrains Mono (Mono)",
    cssFamily: '"PDF-JetBrainsMono", ui-monospace, monospace',
    files: {
      regular: "/fonts/JetBrainsMono-Regular.ttf",
      bold: "/fonts/JetBrainsMono-Bold.ttf",
    },
  },
} satisfies Record<string, FontFamilyDef>;

export type WatermarkFontFamily = keyof typeof WATERMARK_FONTS;

export type WatermarkSettings = {
  text: string;
  fontSize: number;
  color: string;
  /** 5–100 */
  opacity: number;
  /** degrees, counter-clockwise (PDF convention) */
  angle: number;
  position: WatermarkPosition;
  fontFamily: WatermarkFontFamily;
  bold: boolean;
  italic: boolean;
};

export type WatermarkPreset = {
  name: string;
  icon: string;
} & Pick<
  WatermarkSettings,
  "text" | "color" | "angle" | "opacity" | "fontSize" | "position"
>;

export const WATERMARK_MARGIN = 36;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 400;

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
  text: "CONFIDENTIAL",
  fontSize: 80,
  color: "#DC2626",
  opacity: 25,
  angle: -45,
  position: "center",
  fontFamily: "inter",
  bold: true,
  italic: false,
};

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/** Watermarks are a single line; collapse anything that would break layout. */
export function normalizeWatermarkText(text: string): string {
  return text.replace(/[\r\n\t]+/g, " ").trim();
}

/* ------------------------------------------------------------------ *
 * Fonts
 * ------------------------------------------------------------------ */

/**
 * Not every family ships all four variants. Resolving once — and using the
 * result for both canvas and PDF — keeps the preview honest.
 */
export function resolveFontVariant(
  family: WatermarkFontFamily,
  bold: boolean,
  italic: boolean
): FontVariant {
  const files = WATERMARK_FONTS[family].files as Partial<
    Record<FontVariant, string>
  >;
  if (bold && italic) {
    if (files.boldItalic) return "boldItalic";
    if (files.bold) return "bold";
    if (files.italic) return "italic";
    return "regular";
  }
  if (bold) return files.bold ? "bold" : "regular";
  if (italic) return files.italic ? "italic" : "regular";
  return "regular";
}

export function supportsBold(family: WatermarkFontFamily): boolean {
  const files = WATERMARK_FONTS[family].files as Partial<
    Record<FontVariant, string>
  >;
  return Boolean(files.bold || files.boldItalic);
}

export function supportsItalic(family: WatermarkFontFamily): boolean {
  const files = WATERMARK_FONTS[family].files as Partial<
    Record<FontVariant, string>
  >;
  return Boolean(files.italic || files.boldItalic);
}

function fontFileFor(
  family: WatermarkFontFamily,
  variant: FontVariant
): string {
  const files = WATERMARK_FONTS[family].files as Partial<
    Record<FontVariant, string>
  >;
  return files[variant] || files.regular!;
}

/** CSS font shorthand matching the variant that the PDF will actually use. */
export function canvasFontShorthand(
  family: WatermarkFontFamily,
  variant: FontVariant,
  pixelSize: number
): string {
  const style = variant === "italic" || variant === "boldItalic" ? "italic " : "";
  const weight = variant === "bold" || variant === "boldItalic" ? 700 : 400;
  return `${style}${weight} ${pixelSize}px ${WATERMARK_FONTS[family].cssFamily}`;
}

export async function ensureWatermarkFont(
  family: WatermarkFontFamily,
  bold: boolean,
  italic: boolean
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const variant = resolveFontVariant(family, bold, italic);
  try {
    await document.fonts.load(canvasFontShorthand(family, variant, 64), "Ag");
    await document.fonts.ready;
  } catch {
    /* fall back to whatever the browser has */
  }
}

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  return measureCtx;
}

/** Text width in PDF points, measured with the same font the export uses. */
export function measureWatermarkWidth(
  text: string,
  fontSize: number,
  family: WatermarkFontFamily,
  bold: boolean,
  italic: boolean
): number {
  const ctx = getMeasureContext();
  if (!ctx) return text.length * fontSize * 0.6;
  const variant = resolveFontVariant(family, bold, italic);
  ctx.font = canvasFontShorthand(family, variant, fontSize);
  return ctx.measureText(text).width;
}

/* ------------------------------------------------------------------ *
 * Placement
 * ------------------------------------------------------------------ */

export type Placement = {
  /** Baseline anchor in page (y-up) coordinates — what pdf-lib rotates around. */
  x: number;
  y: number;
  /** Rotated bounding box, useful for fit checks. */
  boxWidth: number;
  boxHeight: number;
  centerX: number;
  centerY: number;
  overflows: boolean;
};

function axesFor(position: WatermarkPosition): {
  row: "top" | "middle" | "bottom";
  col: "left" | "center" | "right";
} {
  if (position === "center") return { row: "middle", col: "center" };
  const [row, col] = position.split("-") as [
    "top" | "middle" | "bottom",
    "left" | "center" | "right",
  ];
  return { row, col };
}

export function rotatedBox(
  textWidth: number,
  textHeight: number,
  angle: number
): { boxWidth: number; boxHeight: number } {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    boxWidth: textWidth * cos + textHeight * sin,
    boxHeight: textWidth * sin + textHeight * cos,
  };
}

/**
 * pdf-lib draws text from the bottom-left of the baseline and rotates around
 * that same anchor, so the anchor has to be back-solved from where the
 * *rotated* visual center should land.
 */
export function computeWatermarkPlacement(opts: {
  textWidth: number;
  textHeight: number;
  pageWidth: number;
  pageHeight: number;
  angle: number;
  position: WatermarkPosition;
  margin?: number;
}): Placement {
  const {
    textWidth,
    textHeight,
    pageWidth,
    pageHeight,
    angle,
    position,
    margin = WATERMARK_MARGIN,
  } = opts;

  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const { boxWidth, boxHeight } = rotatedBox(textWidth, textHeight, angle);
  const { row, col } = axesFor(position);

  const fitsX = boxWidth <= pageWidth - margin * 2;
  const fitsY = boxHeight <= pageHeight - margin * 2;

  let centerX = pageWidth / 2;
  if (fitsX && col === "left") centerX = margin + boxWidth / 2;
  if (fitsX && col === "right") centerX = pageWidth - margin - boxWidth / 2;

  let centerY = pageHeight / 2;
  if (fitsY && row === "bottom") centerY = margin + boxHeight / 2;
  if (fitsY && row === "top") centerY = pageHeight - margin - boxHeight / 2;

  // Where the text centre ends up once it is rotated about the baseline anchor.
  const rotatedCenterX = (textWidth / 2) * cos - (textHeight / 2) * sin;
  const rotatedCenterY = (textWidth / 2) * sin + (textHeight / 2) * cos;

  return {
    x: centerX - rotatedCenterX,
    y: centerY - rotatedCenterY,
    boxWidth,
    boxHeight,
    centerX,
    centerY,
    overflows: !fitsX || !fitsY,
  };
}

/** Largest size at which the rotated text still fits inside the page margins. */
export function calculateMaxFontSize(opts: {
  measureWidth: (fontSize: number) => number;
  pageWidth: number;
  pageHeight: number;
  angle: number;
  margin?: number;
  upperBound?: number;
}): number {
  const {
    measureWidth,
    pageWidth,
    pageHeight,
    angle,
    margin = WATERMARK_MARGIN,
    upperBound = 200,
  } = opts;

  const availableWidth = Math.max(1, pageWidth - margin * 2);
  const availableHeight = Math.max(1, pageHeight - margin * 2);

  const fits = (size: number) => {
    const { boxWidth, boxHeight } = rotatedBox(measureWidth(size), size, angle);
    return boxWidth <= availableWidth && boxHeight <= availableHeight;
  };

  if (fits(upperBound)) return upperBound;

  let low = MIN_FONT_SIZE;
  let high = upperBound;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (fits(mid)) low = mid;
    else high = mid;
  }
  return Math.max(MIN_FONT_SIZE, low);
}

/* ------------------------------------------------------------------ *
 * Canvas preview
 * ------------------------------------------------------------------ */

export function drawWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  opts: {
    settings: WatermarkSettings;
    /** Canvas pixels per PDF point. */
    scale: number;
    /** Page size in PDF points, as displayed (page rotation already applied). */
    viewWidth: number;
    viewHeight: number;
  }
): void {
  const { settings, scale, viewWidth, viewHeight } = opts;
  const text = normalizeWatermarkText(settings.text);
  if (!text) return;

  const variant = resolveFontVariant(
    settings.fontFamily,
    settings.bold,
    settings.italic
  );

  ctx.save();
  ctx.font = canvasFontShorthand(
    settings.fontFamily,
    variant,
    settings.fontSize * scale
  );
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = clamp(settings.opacity, 5, 100) / 100;
  ctx.fillStyle = settings.color;

  const textWidth = ctx.measureText(text).width / scale;
  const placement = computeWatermarkPlacement({
    textWidth,
    textHeight: settings.fontSize,
    pageWidth: viewWidth,
    pageHeight: viewHeight,
    angle: settings.angle,
    position: settings.position,
  });

  // Canvas y grows downward, so flip the anchor and the rotation direction.
  ctx.translate(placement.x * scale, (viewHeight - placement.y) * scale);
  ctx.rotate((-settings.angle * Math.PI) / 180);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/* ------------------------------------------------------------------ *
 * PDF export
 * ------------------------------------------------------------------ */

const fontByteCache = new Map<string, Promise<ArrayBuffer>>();

async function fetchFontBytes(path: string): Promise<ArrayBuffer> {
  let cached = fontByteCache.get(path);
  if (!cached) {
    cached = fetch(path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load watermark font ${path}`);
      }
      return response.arrayBuffer();
    });
    fontByteCache.set(path, cached);
  }
  // fontkit may retain or transfer the view it is handed; isolate each embed.
  return (await cached).slice(0);
}

export async function applyWatermark(
  bytes: ArrayBuffer,
  settings: WatermarkSettings
): Promise<Uint8Array> {
  const text = normalizeWatermarkText(settings.text);
  if (!text) throw new Error("Watermark text is empty");

  const [{ PDFDocument, degrees, rgb }, fontkitModule] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);

  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  doc.registerFontkit(fontkitModule.default);

  const variant = resolveFontVariant(
    settings.fontFamily,
    settings.bold,
    settings.italic
  );
  const font = await doc.embedFont(
    await fetchFontBytes(fontFileFor(settings.fontFamily, variant)),
    { subset: true }
  );

  const fontSize = clamp(settings.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE);
  const { r, g, b } = hexToRgb01(settings.color);
  const color = rgb(r, g, b);
  const opacity = clamp(settings.opacity, 5, 100) / 100;
  const textWidth = font.widthOfTextAtSize(text, fontSize);

  for (const page of doc.getPages()) {
    const { width: rawWidth, height: rawHeight } = page.getSize();
    const rotation = normalizeRotation(page.getRotation().angle);
    const { width: viewWidth, height: viewHeight } = viewSize(
      rawWidth,
      rawHeight,
      rotation
    );

    const placement = computeWatermarkPlacement({
      textWidth,
      textHeight: fontSize,
      pageWidth: viewWidth,
      pageHeight: viewHeight,
      angle: settings.angle,
      position: settings.position,
    });

    const raw = toRawPageSpace(
      placement.x,
      placement.y,
      settings.angle,
      rotation,
      rawWidth,
      rawHeight
    );

    page.drawText(text, {
      x: raw.x,
      y: raw.y,
      size: fontSize,
      font,
      color,
      opacity,
      rotate: degrees(raw.angle),
    });
  }

  return doc.save({ useObjectStreams: true });
}
