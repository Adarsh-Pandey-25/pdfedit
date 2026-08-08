import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  PageSizes,
  rgb,
} from "pdf-lib";
import {
  ContentBlock,
  InlineRun,
  RichText,
  normalizePdfText,
  plainRichText,
} from "./pdf-content-parser";
import {
  DEFAULT_THEME,
  PdfColor,
  PdfThemeDefinition,
  PdfThemeName,
  THEMES,
} from "./pdf-themes";

export type PdfFonts = {
  regular: PDFFont;
  medium: PDFFont;
  semibold: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  mono: PDFFont;
  monoBold: PDFFont;
};

export type PdfTheme = PdfThemeDefinition & { fonts: PdfFonts };

const fontByteCache = new Map<string, Promise<ArrayBuffer>>();

async function fetchFont(path: string): Promise<ArrayBuffer> {
  let cached = fontByteCache.get(path);
  if (!cached) {
    cached = fetch(path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load PDF font ${path} (${response.status})`);
      }
      return response.arrayBuffer();
    });
    fontByteCache.set(path, cached);
  }
  // pdf-lib/fontkit may retain or transfer input views; isolate each embed.
  return (await cached).slice(0);
}

export async function loadFonts(pdfDoc: PDFDocument): Promise<PdfFonts> {
  pdfDoc.registerFontkit(fontkit);
  const embed = async (path: string) =>
    pdfDoc.embedFont(await fetchFont(path), { subset: true });

  const [
    regular,
    medium,
    semibold,
    bold,
    italic,
    boldItalic,
    mono,
    monoBold,
  ] = await Promise.all([
    embed("/fonts/Inter-Regular.ttf"),
    embed("/fonts/Inter-Medium.ttf"),
    embed("/fonts/Inter-SemiBold.ttf"),
    embed("/fonts/Inter-Bold.ttf"),
    embed("/fonts/Inter-Italic.ttf"),
    embed("/fonts/Inter-BoldItalic.ttf"),
    embed("/fonts/JetBrainsMono-Regular.ttf"),
    embed("/fonts/JetBrainsMono-Bold.ttf"),
  ]);

  return {
    regular,
    medium,
    semibold,
    bold,
    italic,
    boldItalic,
    mono,
    monoBold,
  };
}

function color(value: PdfColor) {
  return rgb(value[0], value[1], value[2]);
}

function mergeTheme(
  name: PdfThemeName,
  fonts: PdfFonts,
  override?: Partial<PdfThemeDefinition>
): PdfTheme {
  const preset = THEMES[name] || DEFAULT_THEME;
  return {
    ...preset,
    ...override,
    pageSize: override?.pageSize || preset.pageSize,
    margin: { ...preset.margin, ...override?.margin },
    colors: { ...preset.colors, ...override?.colors },
    sizes: { ...preset.sizes, ...override?.sizes },
    spacing: { ...preset.spacing, ...override?.spacing },
    fonts,
  };
}

function fontForRun(fonts: PdfFonts, run: InlineRun): PDFFont {
  if (run.code) return run.bold ? fonts.monoBold : fonts.mono;
  if (run.bold && run.italic) return fonts.boldItalic;
  if (run.bold) return fonts.bold;
  if (run.italic) return fonts.italic;
  return fonts.regular;
}

/**
 * Custom fonts cover the requested typography symbols and broad Latin,
 * Greek/Cyrillic scripts. Unsupported glyphs (notably color emoji) are
 * replaced individually instead of making pdf-lib reject the whole line.
 */
function safeText(text: string, font: PDFFont): string {
  let result = "";
  for (const char of Array.from(normalizePdfText(text))) {
    if (char === "\n") {
      result += char;
      continue;
    }
    try {
      font.encodeText(char);
      result += char;
    } catch {
      result += "?";
    }
  }
  return result;
}

type DrawRun = {
  text: string;
  font: PDFFont;
  width: number;
};

type DrawLine = DrawRun[];

export class PdfWriter {
  private currentPage!: PDFPage;
  private cursorY = 0;

  constructor(
    private readonly pdfDoc: PDFDocument,
    private readonly theme: PdfTheme
  ) {
    this.addPage();
  }

  private addPage() {
    const [pageWidth, pageHeight] = this.theme.pageSize;
    this.currentPage = this.pdfDoc.addPage([pageWidth, pageHeight]);
    this.currentPage.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: color(this.theme.colors.background),
    });
    this.currentPage.drawLine({
      start: {
        x: this.theme.margin.left,
        y: pageHeight - this.theme.margin.top + 17,
      },
      end: {
        x: pageWidth - this.theme.margin.right,
        y: pageHeight - this.theme.margin.top + 17,
      },
      thickness: 1.5,
      color: color(this.theme.colors.accent),
      opacity: 0.35,
    });
    this.cursorY = pageHeight - this.theme.margin.top;
  }

  private ensureSpace(height: number) {
    if (this.cursorY - height < this.theme.margin.bottom) this.addPage();
  }

  private contentWidth(indent = 0): number {
    return (
      this.theme.pageSize[0] -
      this.theme.margin.left -
      this.theme.margin.right -
      indent
    );
  }

  private fontWidth(text: string, font: PDFFont, size: number): number {
    return font.widthOfTextAtSize(safeText(text, font), size);
  }

  private breakWord(
    word: string,
    font: PDFFont,
    size: number,
    maxWidth: number
  ): string[] {
    const chunks: string[] = [];
    let current = "";
    for (const char of Array.from(word)) {
      const candidate = current + char;
      if (current && this.fontWidth(candidate, font, size) > maxWidth) {
        chunks.push(current);
        current = char;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  private wrapRichText(
    rich: RichText,
    size: number,
    maxWidth: number,
    defaultFont?: PDFFont
  ): DrawLine[] {
    const lines: DrawLine[] = [[]];
    let lineWidth = 0;

    const newline = () => {
      lines.push([]);
      lineWidth = 0;
    };
    const append = (text: string, font: PDFFont) => {
      if (!text) return;
      const safe = safeText(text, font);
      const width = font.widthOfTextAtSize(safe, size);
      lines[lines.length - 1].push({ text: safe, font, width });
      lineWidth += width;
    };

    for (const run of rich) {
      const font = defaultFont || fontForRun(this.theme.fonts, run);
      const parts = normalizePdfText(run.text).split(/(\n|[ \t]+|[^ \t\n]+)/);

      for (const part of parts) {
        if (!part) continue;
        if (part === "\n") {
          newline();
          continue;
        }
        const whitespace = /^[ \t]+$/.test(part);
        if (whitespace) {
          if (lineWidth > 0) {
            const space = " ";
            const width = this.fontWidth(space, font, size);
            if (lineWidth + width <= maxWidth) append(space, font);
          }
          continue;
        }

        const wordWidth = this.fontWidth(part, font, size);
        if (lineWidth > 0 && lineWidth + wordWidth > maxWidth) newline();

        if (wordWidth <= maxWidth) {
          append(part, font);
          continue;
        }

        for (const chunk of this.breakWord(part, font, size, maxWidth)) {
          const chunkWidth = this.fontWidth(chunk, font, size);
          if (lineWidth > 0 && lineWidth + chunkWidth > maxWidth) newline();
          append(chunk, font);
          if (chunkWidth >= maxWidth * 0.98) newline();
        }
      }
    }

    while (lines.length > 1 && lines[lines.length - 1].length === 0) {
      lines.pop();
    }
    return lines;
  }

  private drawLines(
    lines: DrawLine[],
    options: {
      x: number;
      size: number;
      lineHeight: number;
      color: PdfColor;
      firstLinePrefix?: () => void;
    }
  ) {
    lines.forEach((line, index) => {
      this.ensureSpace(options.lineHeight);
      if (index === 0) options.firstLinePrefix?.();
      let x = options.x;
      for (const run of line) {
        this.currentPage.drawText(run.text, {
          x,
          y: this.cursorY - options.size,
          size: options.size,
          font: run.font,
          color: color(options.color),
        });
        x += run.width;
      }
      this.cursorY -= options.lineHeight;
    });
  }

  heading1(value: string | RichText) {
    const { sizes, spacing, colors, fonts, margin } = this.theme;
    this.cursorY -= spacing.heading;
    const lines = this.wrapRichText(
      typeof value === "string" ? plainRichText(value) : value,
      sizes.h1,
      this.contentWidth(),
      fonts.bold
    );
    const lineHeight = sizes.h1 * 1.18;
    this.ensureSpace(lines.length * lineHeight + spacing.paragraph * 2);
    this.drawLines(lines, {
      x: margin.left,
      size: sizes.h1,
      lineHeight,
      color: colors.heading,
    });
    this.cursorY -= spacing.paragraph / 2;
    this.currentPage.drawLine({
      start: { x: margin.left, y: this.cursorY },
      end: {
        x: this.theme.pageSize[0] - margin.right,
        y: this.cursorY,
      },
      color: color(colors.line),
      thickness: 1,
    });
    this.cursorY -= spacing.paragraph;
  }

  heading2(value: string | RichText) {
    const { sizes, spacing, colors, fonts, margin } = this.theme;
    this.cursorY -= spacing.heading;
    const lines = this.wrapRichText(
      typeof value === "string" ? plainRichText(value) : value,
      sizes.h2,
      this.contentWidth(),
      fonts.bold
    );
    const lineHeight = sizes.h2 * 1.22;
    this.drawLines(lines, {
      x: margin.left,
      size: sizes.h2,
      lineHeight,
      color: colors.heading,
    });
    this.cursorY -= spacing.paragraph;
  }

  heading3(value: string | RichText) {
    const { sizes, spacing, colors, fonts, margin } = this.theme;
    this.cursorY -= spacing.paragraph;
    const lines = this.wrapRichText(
      typeof value === "string" ? plainRichText(value) : value,
      sizes.h3,
      this.contentWidth(),
      fonts.semibold
    );
    this.drawLines(lines, {
      x: margin.left,
      size: sizes.h3,
      lineHeight: sizes.h3 * 1.28,
      color: colors.subheading,
    });
    this.cursorY -= spacing.paragraph / 2;
  }

  paragraph(value: string | RichText, options: { color?: PdfColor } = {}) {
    const { sizes, spacing, colors, margin } = this.theme;
    const lines = this.wrapRichText(
      typeof value === "string" ? plainRichText(value) : value,
      sizes.body,
      this.contentWidth()
    );
    this.drawLines(lines, {
      x: margin.left,
      size: sizes.body,
      lineHeight: sizes.body * spacing.line,
      color: options.color || colors.text,
    });
    this.cursorY -= spacing.paragraph;
  }

  bulletList(items: RichText[]) {
    this.list(items, "bullet");
  }

  numberedList(items: RichText[]) {
    this.list(items, "number");
  }

  private list(items: RichText[], type: "bullet" | "number") {
    const { sizes, spacing, colors, fonts, margin } = this.theme;
    const lineHeight = sizes.body * spacing.line;
    const labelWidth = spacing.listIndent + (type === "number" ? 5 : 0);
    const textX = margin.left + labelWidth;

    items.forEach((item, index) => {
      const lines = this.wrapRichText(
        item,
        sizes.body,
        this.contentWidth(labelWidth)
      );
      this.ensureSpace(Math.min(lines.length, 2) * lineHeight);
      this.drawLines(lines, {
        x: textX,
        size: sizes.body,
        lineHeight,
        color: colors.text,
        firstLinePrefix: () => {
          const label = type === "bullet" ? "•" : `${index + 1}.`;
          this.currentPage.drawText(label, {
            x: margin.left,
            y: this.cursorY - sizes.body,
            size: sizes.body,
            font: type === "bullet" ? fonts.regular : fonts.semibold,
            color: color(colors.accent),
          });
        },
      });
      this.cursorY -= spacing.paragraph / 2;
    });
    this.cursorY -= spacing.paragraph / 2;
  }

  quote(value: string | RichText) {
    const { sizes, spacing, colors, fonts, margin } = this.theme;
    const indent = 20;
    const lines = this.wrapRichText(
      typeof value === "string" ? plainRichText(value) : value,
      sizes.body,
      this.contentWidth(indent),
      fonts.italic
    );
    const lineHeight = sizes.body * spacing.line;
    const startY = this.cursorY;
    this.drawLines(lines, {
      x: margin.left + indent,
      size: sizes.body,
      lineHeight,
      color: colors.muted,
    });
    this.currentPage.drawRectangle({
      x: margin.left,
      y: this.cursorY + spacing.paragraph,
      width: 3,
      height: Math.max(3, startY - this.cursorY),
      color: color(colors.accent),
    });
    this.cursorY -= spacing.paragraph;
  }

  code(value: string) {
    const { sizes, spacing, colors, fonts, margin } = this.theme;
    const padding = 10;
    const lineHeight = sizes.code * 1.35;
    const rich = normalizePdfText(value)
      .split("\n")
      .flatMap<InlineRun>((line, index, all) => [
        { text: line, code: true },
        ...(index < all.length - 1
          ? [{ text: "\n", code: true } satisfies InlineRun]
          : []),
      ]);
    const lines = this.wrapRichText(
      rich,
      sizes.code,
      this.contentWidth() - padding * 2,
      fonts.mono
    );

    for (const line of lines) {
      this.ensureSpace(lineHeight + padding);
      this.currentPage.drawRectangle({
        x: margin.left,
        y: this.cursorY - lineHeight - 2,
        width: this.contentWidth(),
        height: lineHeight + 3,
        color: color(colors.codeBackground),
      });
      this.drawLines([line], {
        x: margin.left + padding,
        size: sizes.code,
        lineHeight,
        color: [0.2, 0.2, 0.3],
      });
    }
    this.cursorY -= padding + spacing.paragraph;
  }

  divider() {
    const { colors, spacing, margin } = this.theme;
    this.cursorY -= spacing.paragraph;
    this.ensureSpace(2);
    this.currentPage.drawLine({
      start: { x: margin.left, y: this.cursorY },
      end: {
        x: this.theme.pageSize[0] - margin.right,
        y: this.cursorY,
      },
      color: color(colors.line),
      thickness: 1,
    });
    this.cursorY -= spacing.paragraph;
  }

  spacer(height = 10) {
    this.ensureSpace(height);
    this.cursorY -= height;
  }

  private drawFooters() {
    const pages = this.pdfDoc.getPages();
    const { pageSize, margin, fonts, colors, sizes } = this.theme;
    pages.forEach((page, index) => {
      const label = `Page ${index + 1} of ${pages.length}`;
      const width = fonts.regular.widthOfTextAtSize(label, sizes.small);
      page.drawLine({
        start: { x: margin.left, y: margin.bottom - 15 },
        end: { x: pageSize[0] - margin.right, y: margin.bottom - 15 },
        color: color(colors.line),
        thickness: 0.7,
      });
      page.drawText(label, {
        x: (pageSize[0] - width) / 2,
        y: margin.bottom / 2 - sizes.small / 2,
        size: sizes.small,
        font: fonts.regular,
        color: color(colors.muted),
      });
    });
  }

  async finish(): Promise<Uint8Array> {
    this.drawFooters();
    return this.pdfDoc.save({ useObjectStreams: true });
  }
}

export type GeneratePdfOptions = {
  title?: string;
  subtitle?: string;
  theme?: PdfThemeName;
  themeOverride?: Partial<PdfThemeDefinition>;
};

export async function generateBeautifulPdf(
  blocks: ContentBlock[],
  options: GeneratePdfOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);
  const theme = mergeTheme(
    options.theme || "modern",
    fonts,
    options.themeOverride
  );

  pdfDoc.setTitle(options.title || "Document");
  pdfDoc.setCreator("PDFForge");
  pdfDoc.setProducer("PDFForge");
  pdfDoc.setCreationDate(new Date());

  const writer = new PdfWriter(pdfDoc, theme);
  if (options.title) {
    writer.heading1(options.title);
    if (options.subtitle) {
      writer.paragraph([{ text: options.subtitle, italic: true }], {
        color: theme.colors.muted,
      });
    }
    writer.divider();
  }

  for (const block of blocks) {
    switch (block.type) {
      case "h1":
        writer.heading1(block.content);
        break;
      case "h2":
        writer.heading2(block.content);
        break;
      case "h3":
        writer.heading3(block.content);
        break;
      case "paragraph":
        writer.paragraph(block.content);
        break;
      case "bullet-list":
        writer.bulletList(block.content);
        break;
      case "numbered-list":
        writer.numberedList(block.content);
        break;
      case "quote":
        writer.quote(block.content);
        break;
      case "code":
        writer.code(block.content);
        break;
      case "divider":
        writer.divider();
        break;
      case "spacer":
        writer.spacer();
        break;
    }
  }

  return writer.finish();
}

export type PdfImageInput = {
  bytes: ArrayBuffer;
  mimeType: "image/png" | "image/jpeg";
  name?: string;
};

export type ImagePdfOptions = {
  pageSize?: "a4" | "letter" | [number, number];
  orientation?: "portrait" | "landscape";
  marginPt?: number;
  showFooter?: boolean;
};

export async function generateImagePdf(
  images: PdfImageInput[],
  options: ImagePdfOptions = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  let baseSize: [number, number] =
    options.pageSize === "letter"
      ? PageSizes.Letter
      : Array.isArray(options.pageSize)
        ? options.pageSize
        : PageSizes.A4;
  if (options.orientation === "landscape") {
    baseSize = [Math.max(...baseSize), Math.min(...baseSize)];
  } else {
    baseSize = [Math.min(...baseSize), Math.max(...baseSize)];
  }

  const margin = Math.max(0, options.marginPt ?? 40);
  for (let index = 0; index < images.length; index++) {
    const input = images[index];
    const embedded =
      input.mimeType === "image/png"
        ? await doc.embedPng(input.bytes)
        : await doc.embedJpg(input.bytes);
    const page = doc.addPage(baseSize);
    const footerSpace = options.showFooter === false ? 0 : 22;
    const maxWidth = baseSize[0] - margin * 2;
    const maxHeight = baseSize[1] - margin * 2 - footerSpace;
    const scale = Math.min(
      maxWidth / embedded.width,
      maxHeight / embedded.height
    );
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    page.drawImage(embedded, {
      x: (baseSize[0] - width) / 2,
      y: margin + footerSpace + (maxHeight - height) / 2,
      width,
      height,
    });

    if (options.showFooter !== false) {
      const label = `${index + 1} / ${images.length}`;
      const labelWidth = fonts.regular.widthOfTextAtSize(label, 9);
      page.drawText(label, {
        x: (baseSize[0] - labelWidth) / 2,
        y: 20,
        size: 9,
        font: fonts.regular,
        color: rgb(0.5, 0.5, 0.55),
      });
    }
  }

  doc.setTitle("Images");
  doc.setCreator("PDFForge");
  doc.setProducer("PDFForge");
  return doc.save({ useObjectStreams: true });
}

