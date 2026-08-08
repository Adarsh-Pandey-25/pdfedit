import type { EditorElement, PointNorm } from "@/lib/editor-types";
import { smoothPath } from "@/lib/editor-types";
import {
  debugExportCoords,
  ensureNormalized,
  fontPtToCanvasPx,
  isExportDebugEnabled,
  normalizedToPixel,
  resolveFontSizePt,
  resolveStrokeWidthPt,
  strokePtToCanvasPx,
} from "@/lib/coords";
import { normalizeRotation, toRawPageSpace, viewSize } from "@/lib/pdf/page-space";
import { parseHexColor } from "@/lib/pdf/text-extraction";

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return new Uint8Array();
  const bin = atob(m[2]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hexRgb(c: string) {
  const p = parseHexColor(c || "#000000");
  return { r: p.r / 255, g: p.g / 255, b: p.b / 255 };
}

function safeTextForFont(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number }
): string {
  try {
    font.widthOfTextAtSize(text, 12);
    return text;
  } catch {
    return Array.from(text)
      .map((ch) => {
        try {
          font.widthOfTextAtSize(ch, 12);
          return ch;
        } catch {
          return "?";
        }
      })
      .join("");
  }
}

type CanvasPageSize = { pageWidthPt: number; pageHeightPt: number };

/** Draw overlay elements onto a page canvas (bitmap space) for HQ export */
export function drawElementsOnCanvas(
  ctx: CanvasRenderingContext2D,
  elements: EditorElement[],
  pageIndex: number,
  canvasW: number,
  canvasH: number,
  pageSize?: CanvasPageSize
) {
  const pw = pageSize?.pageWidthPt ?? canvasW;
  const ph = pageSize?.pageHeightPt ?? canvasH;

  const list = elements
    .filter((e) => e.pageIndex === pageIndex)
    .map((e) => ensureNormalized(e));

  for (const el of list) {
    const x = normalizedToPixel(el.x, canvasW);
    const y = normalizedToPixel(el.y, canvasH);
    const w = normalizedToPixel(el.width, canvasW);
    const h = normalizedToPixel(el.height, canvasH);

    if (isExportDebugEnabled()) {
      console.log("[EXPORT-canvas]", {
        type: el.type,
        stored: { x: el.x, y: el.y, w: el.width, h: el.height },
        canvasSize: { w: canvasW, h: canvasH },
        pageSizePt: { w: pw, h: ph },
        pixelCoords: { x, y, w, h },
      });
    }

    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;
    if (el.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    switch (el.type) {
      case "text": {
        const d = el.data;
        const sizePx = fontPtToCanvasPx(resolveFontSizePt(d), canvasH, ph);
        const bgRaw =
          (d.backgroundColor as string) ||
          (d.bgColor as string) ||
          "transparent";
        const hasBg =
          !!bgRaw &&
          bgRaw !== "transparent" &&
          bgRaw !== "none" &&
          bgRaw !== "rgba(0,0,0,0)";
        const padding = Number(d.padding ?? 4) * (canvasH / ph || 1);

        if (hasBg) {
          const padX = padding * 1.5;
          const padY = padding;
          ctx.font = `${d.italic ? "italic " : ""}${d.bold ? "bold " : ""}${sizePx}px "${d.fontFamily || "PDF-Inter"}", sans-serif`;
          const metrics = ctx.measureText(String(d.text || " "));
          const tw = Math.max(w, metrics.width + padX * 2);
          const th = Math.max(h, sizePx * 1.15 + padY * 2);
          ctx.fillStyle = bgRaw;
          const radius = Number(d.borderRadius ?? 4) * (canvasW / pw || 1);
          if (radius > 0 && typeof ctx.roundRect === "function") {
            ctx.beginPath();
            ctx.roundRect(x, y, tw, th, radius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, tw, th);
          }
        }

        ctx.font = `${d.italic ? "italic " : ""}${d.bold ? "bold " : ""}${sizePx}px "${d.fontFamily || "PDF-Inter"}", sans-serif`;
        ctx.fillStyle = (d.color as string) || "#000";
        ctx.textBaseline = "top";
        ctx.fillText(
          String(d.text || ""),
          x + (hasBg ? padding * 1.5 : 0),
          y + (hasBg ? padding : 0)
        );
        break;
      }
      case "highlight": {
        ctx.globalAlpha = ((el.data.opacity as number) ?? 0.4) * (el.opacity ?? 1);
        ctx.fillStyle = (el.data.color as string) || "#FDE047";
        ctx.fillRect(x, y, w, h);
        break;
      }
      case "rectangle":
      case "ellipse": {
        const sw = strokePtToCanvasPx(
          resolveStrokeWidthPt(el.data.strokeWidth as number),
          canvasW,
          pw
        );
        ctx.strokeStyle = (el.data.strokeColor as string) || "#111";
        ctx.lineWidth = sw;
        const fill = el.data.fillColor as string;
        if (el.type === "ellipse") {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          if (fill && fill !== "transparent") {
            ctx.fillStyle = fill;
            ctx.fill();
          }
          ctx.stroke();
        } else {
          if (fill && fill !== "transparent") {
            ctx.fillStyle = fill;
            ctx.fillRect(x, y, w, h);
          }
          ctx.strokeRect(x, y, w, h);
        }
        break;
      }
      case "line":
      case "arrow": {
        const d = el.data;
        const x1 = normalizedToPixel(d.x1 as number, canvasW);
        const y1 = normalizedToPixel(d.y1 as number, canvasH);
        const x2 = normalizedToPixel(d.x2 as number, canvasW);
        const y2 = normalizedToPixel(d.y2 as number, canvasH);
        const sw = strokePtToCanvasPx(
          resolveStrokeWidthPt(d.strokeWidth as number),
          canvasW,
          pw
        );
        ctx.strokeStyle = (d.strokeColor as string) || "#111";
        ctx.lineWidth = sw;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (el.type === "arrow") {
          const ang = Math.atan2(y2 - y1, x2 - x1);
          const arrowSize = Math.max(8, sw * 4);
          const headAngle = Math.PI / 6;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - arrowSize * Math.cos(ang - headAngle),
            y2 - arrowSize * Math.sin(ang - headAngle)
          );
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - arrowSize * Math.cos(ang + headAngle),
            y2 - arrowSize * Math.sin(ang + headAngle)
          );
          ctx.stroke();
        }
        break;
      }
      case "draw": {
        const points = (el.data.points as PointNorm[]) || [];
        if (points.length < 2) break;
        const sw = strokePtToCanvasPx(
          resolveStrokeWidthPt(el.data.strokeWidth as number),
          canvasW,
          pw
        );
        ctx.strokeStyle = (el.data.strokeColor as string) || "#111";
        ctx.lineWidth = sw;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(
          normalizedToPixel(points[0].x, canvasW),
          normalizedToPixel(points[0].y, canvasH)
        );
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(
            normalizedToPixel(points[i].x, canvasW),
            normalizedToPixel(points[i].y, canvasH)
          );
        }
        ctx.stroke();
        break;
      }
      case "cross": {
        const sw = strokePtToCanvasPx(
          resolveStrokeWidthPt(el.data.strokeWidth as number),
          canvasW,
          pw
        );
        ctx.strokeStyle = (el.data.color as string) || "#FF0000";
        ctx.lineWidth = sw;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();
        break;
      }
      case "check": {
        const sw = strokePtToCanvasPx(
          resolveStrokeWidthPt(el.data.strokeWidth as number),
          canvasW,
          pw
        );
        ctx.strokeStyle = (el.data.color as string) || "#10B981";
        ctx.lineWidth = sw;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, y + h * 0.55);
        ctx.lineTo(x + w * 0.4, y + h * 0.8);
        ctx.lineTo(x + w * 0.9, y + h * 0.15);
        ctx.stroke();
        break;
      }
      case "note": {
        ctx.fillStyle = (el.data.color as string) || "#FFEB3B";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#111";
        ctx.font = `${Math.max(10, h * 0.15)}px sans-serif`;
        ctx.fillText(String(el.data.text || "").slice(0, 80), x + 4, y + 16);
        break;
      }
      case "link": {
        ctx.strokeStyle = "rgba(56,189,248,0.8)";
        ctx.strokeRect(x, y, w, h);
        break;
      }
      default:
        break;
    }
    ctx.restore();
  }

  void smoothPath;
}

export async function drawImageElementsOnCanvas(
  ctx: CanvasRenderingContext2D,
  elements: EditorElement[],
  pageIndex: number,
  canvasW: number,
  canvasH: number
) {
  const list = elements
    .filter(
      (e) =>
        e.pageIndex === pageIndex &&
        (e.type === "image" || e.type === "signature")
    )
    .map((e) => ensureNormalized(e));

  for (const el of list) {
    const src = el.data.imageData as string;
    if (!src) continue;
    const img = await loadImage(src);
    const x = normalizedToPixel(el.x, canvasW);
    const y = normalizedToPixel(el.y, canvasH);
    const w = normalizedToPixel(el.width, canvasW);
    const h = normalizedToPixel(el.height, canvasH);
    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;
    if (el.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Embed editor elements into a pdf-lib document.
 * Elements are stored top-left normalized (0–1). PDF is bottom-left.
 * Also maps through page /Rotate so export matches the PDF.js editor view.
 */
export async function applyElementsToPdfDoc(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  elements: EditorElement[]
) {
  const { rgb, degrees, PDFString, LineCapStyle } = await import("pdf-lib");
  const pages = doc.getPages();
  const debug = isExportDebugEnabled();
  const { loadFonts } = await import("@/lib/pdf-generator");
  const overlayFonts = await loadFonts(doc);

  for (const raw of elements) {
    const el = ensureNormalized(raw);
    const page = pages[el.pageIndex];
    if (!page) continue;

    const { width: rawWidth, height: rawHeight } = page.getSize();
    const rotation = normalizeRotation(page.getRotation()?.angle ?? 0);
    const { width: viewW, height: viewH } = viewSize(
      rawWidth,
      rawHeight,
      rotation
    );

    // Visible page box (CropBox) when unrotated — matches PDF.js paint area.
    let pageWidthPt = viewW;
    let pageHeightPt = viewH;
    let originX = 0;
    let originY = 0;
    if (rotation === 0) {
      try {
        const crop = page.getCropBox();
        if (crop?.width > 0 && crop?.height > 0) {
          pageWidthPt = crop.width;
          pageHeightPt = crop.height;
          originX = crop.x ?? 0;
          originY = crop.y ?? 0;
        }
      } catch {
        /* use MediaBox via getSize */
      }
    }

    /** Normalized top-down point → raw pdf-lib draw position */
    const mapPoint = (nx: number, ny: number) => {
      const vx = originX + nx * pageWidthPt;
      const vy = originY + pageHeightPt * (1 - ny);
      return toRawPageSpace(vx, vy, 0, rotation, rawWidth, rawHeight);
    };

    /** Normalized top-down rect → raw bottom-left + size + draw angle */
    const mapRect = (nx: number, ny: number, nw: number, nh: number) => {
      const vx = originX + nx * pageWidthPt;
      // Bottom edge of the box in view (PDF Y-up) space
      const vy = originY + pageHeightPt * (1 - ny - nh);
      const vw = nw * pageWidthPt;
      const vh = nh * pageHeightPt;
      const raw = toRawPageSpace(vx, vy, 0, rotation, rawWidth, rawHeight);
      return { x: raw.x, y: raw.y, width: vw, height: vh, angle: raw.angle };
    };

    const rect = mapRect(el.x, el.y, el.width, el.height);
    const { x: pdfX, y: pdfY, width: pdfW, height: pdfH, angle: drawAngle } =
      rect;

    if (debug) {
      debugExportCoords(el, pageWidthPt, pageHeightPt);
      console.log("[EXPORT]", {
        type: el.type,
        stored: { x: el.x, y: el.y, w: el.width, h: el.height },
        pageSize: { w: pageWidthPt, h: pageHeightPt },
        rotation,
        pdfCoords: { x: pdfX, y: pdfY, w: pdfW, h: pdfH, angle: drawAngle },
      });
    }

    const hex = (c: string) => {
      const p = hexRgb(c);
      return rgb(p.r, p.g, p.b);
    };

    switch (el.type) {
      case "text": {
        const d = el.data;
        const size = resolveFontSizePt(d);
        const font =
          d.bold && d.italic
            ? overlayFonts.boldItalic
            : d.bold
              ? overlayFonts.bold
              : d.italic
                ? overlayFonts.italic
                : overlayFonts.regular;
        const bgRaw =
          (d.backgroundColor as string) ||
          (d.bgColor as string) ||
          "transparent";
        const hasBg =
          !!bgRaw &&
          bgRaw !== "transparent" &&
          bgRaw !== "none" &&
          bgRaw !== "rgba(0,0,0,0)";
        const padding = Number(d.padding ?? 4);

        if (hasBg) {
          const padX = padding * 1.5;
          const padY = padding;
          // Background at the same top-left as the text box (no ascent shift)
          const bgRect = mapRect(
            el.x,
            el.y,
            Math.max(el.width, (size + padX * 2) / pageWidthPt),
            Math.max(el.height, (size * 1.15 + padY * 2) / pageHeightPt)
          );
          page.drawRectangle({
            x: bgRect.x,
            y: bgRect.y,
            width: bgRect.width,
            height: bgRect.height,
            color: hex(bgRaw),
            borderWidth: 0,
            rotate: degrees(bgRect.angle),
          });
        }

        // Baseline at top of box (view): topY - fontSize
        const topY = originY + pageHeightPt * (1 - el.y);
        const baseline = toRawPageSpace(
          originX + el.x * pageWidthPt + (hasBg ? padding * 1.5 : 0),
          topY - size - (hasBg ? padding : 0),
          drawAngle,
          rotation,
          rawWidth,
          rawHeight
        );
        page.drawText(safeTextForFont(String(d.text || ""), font), {
          x: baseline.x,
          y: baseline.y,
          size,
          font,
          color: hex((d.color as string) || "#000"),
          maxWidth: pdfW,
          lineHeight: size * 1.2,
          rotate: degrees(baseline.angle),
        });
        break;
      }
      case "highlight":
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: hex((el.data.color as string) || "#FFEB3B"),
          opacity: (el.data.opacity as number) ?? 0.4,
          borderWidth: 0,
          rotate: degrees(drawAngle),
        });
        break;
      case "rectangle":
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          borderColor: hex((el.data.strokeColor as string) || "#111"),
          borderWidth: resolveStrokeWidthPt(el.data.strokeWidth as number),
          color:
            el.data.fillColor && el.data.fillColor !== "transparent"
              ? hex(el.data.fillColor as string)
              : undefined,
          opacity: el.opacity || 1,
          rotate: degrees(drawAngle),
        });
        break;
      case "ellipse": {
        const center = mapPoint(el.x + el.width / 2, el.y + el.height / 2);
        page.drawEllipse({
          x: center.x,
          y: center.y,
          xScale: pdfW / 2,
          yScale: pdfH / 2,
          borderColor: hex((el.data.strokeColor as string) || "#111"),
          borderWidth: resolveStrokeWidthPt(el.data.strokeWidth as number),
          color:
            el.data.fillColor && el.data.fillColor !== "transparent"
              ? hex(el.data.fillColor as string)
              : undefined,
          rotate: degrees(drawAngle),
        });
        break;
      }
      case "line":
      case "arrow": {
        const d = el.data;
        const p1 = mapPoint(d.x1 as number, d.y1 as number);
        const p2 = mapPoint(d.x2 as number, d.y2 as number);
        const thickness = resolveStrokeWidthPt(d.strokeWidth as number);
        const color = hex((d.strokeColor as string) || "#111");

        page.drawLine({
          start: { x: p1.x, y: p1.y },
          end: { x: p2.x, y: p2.y },
          thickness,
          color,
          lineCap: LineCapStyle.Round,
        });

        if (el.type === "arrow") {
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const arrowSize = Math.max(8, thickness * 4);
          const headAngle = Math.PI / 6;
          page.drawLine({
            start: { x: p2.x, y: p2.y },
            end: {
              x: p2.x - arrowSize * Math.cos(angle - headAngle),
              y: p2.y - arrowSize * Math.sin(angle - headAngle),
            },
            thickness,
            color,
            lineCap: LineCapStyle.Round,
          });
          page.drawLine({
            start: { x: p2.x, y: p2.y },
            end: {
              x: p2.x - arrowSize * Math.cos(angle + headAngle),
              y: p2.y - arrowSize * Math.sin(angle + headAngle),
            },
            thickness,
            color,
            lineCap: LineCapStyle.Round,
          });
        }
        break;
      }
      case "cross": {
        const thickness = resolveStrokeWidthPt(el.data.strokeWidth as number);
        const stroke = hex((el.data.color as string) || "#EF4444");
        const a = mapPoint(el.x, el.y);
        const b = mapPoint(el.x + el.width, el.y + el.height);
        const c = mapPoint(el.x + el.width, el.y);
        const dpt = mapPoint(el.x, el.y + el.height);
        page.drawLine({
          start: { x: a.x, y: a.y },
          end: { x: b.x, y: b.y },
          color: stroke,
          thickness,
          lineCap: LineCapStyle.Round,
        });
        page.drawLine({
          start: { x: c.x, y: c.y },
          end: { x: dpt.x, y: dpt.y },
          color: stroke,
          thickness,
          lineCap: LineCapStyle.Round,
        });
        break;
      }
      case "check": {
        const thickness = resolveStrokeWidthPt(el.data.strokeWidth as number);
        const stroke = hex((el.data.color as string) || "#10B981");
        // Top-down local fractions (editor SVG check shape)
        const p1 = mapPoint(el.x + el.width * 0.15, el.y + el.height * 0.55);
        const p2 = mapPoint(el.x + el.width * 0.4, el.y + el.height * 0.8);
        const p3 = mapPoint(el.x + el.width * 0.9, el.y + el.height * 0.15);
        page.drawLine({
          start: { x: p1.x, y: p1.y },
          end: { x: p2.x, y: p2.y },
          thickness,
          color: stroke,
          lineCap: LineCapStyle.Round,
        });
        page.drawLine({
          start: { x: p2.x, y: p2.y },
          end: { x: p3.x, y: p3.y },
          thickness,
          color: stroke,
          lineCap: LineCapStyle.Round,
        });
        break;
      }
      case "draw": {
        const points = (el.data.points as PointNorm[]) || [];
        const thickness = resolveStrokeWidthPt(el.data.strokeWidth as number);
        const color = hex((el.data.strokeColor as string) || "#111");
        for (let i = 1; i < points.length; i++) {
          const a = mapPoint(points[i - 1].x, points[i - 1].y);
          const b = mapPoint(points[i].x, points[i].y);
          page.drawLine({
            start: { x: a.x, y: a.y },
            end: { x: b.x, y: b.y },
            thickness,
            color,
            lineCap: LineCapStyle.Round,
          });
        }
        break;
      }
      case "signature":
      case "image": {
        const dataUrl = el.data.imageData as string;
        if (!dataUrl) break;
        const bytes = dataUrlToBytes(dataUrl);
        const img = dataUrl.includes("image/png")
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        page.drawImage(img, {
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          rotate: degrees(drawAngle + (el.rotation || 0)),
          opacity: el.opacity || 1,
        });
        break;
      }
      case "note": {
        const noteSize = Math.min(pdfW, pdfH, 20);
        page.drawRectangle({
          x: pdfX,
          y: pdfY + pdfH - noteSize,
          width: noteSize,
          height: noteSize,
          color: rgb(1, 0.92, 0.23),
          borderColor: rgb(0.8, 0.7, 0.1),
          borderWidth: 1,
          rotate: degrees(drawAngle),
        });
        break;
      }
      case "link": {
        try {
          const { normalizeLinkUrl } = await import("@/lib/pdf/link-utils");
          const url = normalizeLinkUrl(String(el.data.url || ""));
          if (!url) break;
          const link = page.doc.context.register(
            page.doc.context.obj({
              Type: "Annot",
              Subtype: "Link",
              Rect: [pdfX, pdfY, pdfX + pdfW, pdfY + pdfH],
              Border: [0, 0, 0],
              C: [0.2, 0.4, 1],
              A: {
                Type: "Action",
                S: "URI",
                URI: PDFString.of(url),
              },
            })
          );
          page.node.addAnnot(link);
        } catch {
          /* annotation may fail on some pdf-lib builds */
        }
        break;
      }
      default:
        break;
    }
  }
}
