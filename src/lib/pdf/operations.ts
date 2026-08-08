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

export async function addPageNumbers(
  bytes: ArrayBuffer,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await pdfLib();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const { loadFonts } = await import("@/lib/pdf-generator");
  const font = (await loadFonts(doc)).regular;
  const c = hexToRgb(options.color);
  const color = rgb(c.red, c.green, c.blue);
  const pages = doc.getPages();

  pages.forEach((page, idx) => {
    const num = options.start + idx;
    let label = String(num);
    if (options.format === "page-n") label = `Page ${num}`;
    if (options.format === "roman") label = toRoman(num);

    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    const margin = 28;
    let x = margin;
    let y = margin;

    if (options.position.includes("top")) y = height - margin - options.fontSize;
    if (options.position.includes("center")) x = (width - textWidth) / 2;
    if (options.position.includes("right")) x = width - margin - textWidth;

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color,
    });
  });

  return doc.save({ useObjectStreams: true });
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
  const { PDFDocument: CantooDoc } = await import("@cantoo/pdf-lib");
  const doc = await CantooDoc.load(bytes, { ignoreEncryption: true });
  doc.encrypt({
    userPassword: userPassword || undefined,
    ownerPassword: ownerPassword || userPassword || "owner",
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
