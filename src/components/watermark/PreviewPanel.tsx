"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Loader2, UploadCloud } from "lucide-react";
import { renderPageToCanvas, getDisplayPixelRatio, type PdfDoc } from "@/lib/pdf/pdfjs";
import {
  drawWatermarkOnCanvas,
  ensureWatermarkFont,
  type WatermarkSettings,
} from "@/lib/pdf/watermark-engine";

const PREVIEW_SCALE = 1.4;
const DEBOUNCE_MS = 200;

type PreviewPanelProps = {
  doc: PdfDoc | null;
  settings: WatermarkSettings;
  pageNumber: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

export function PreviewPanel({
  doc,
  settings,
  pageNumber,
  totalPages,
  onPageChange,
  loading,
}: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);

  const {
    text,
    fontSize,
    color,
    opacity,
    angle,
    position,
    fontFamily,
    bold,
    italic,
  } = settings;

  useEffect(() => {
    if (!doc) return undefined;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setRendering(true);
      try {
        await ensureWatermarkFont(fontFamily, bold, italic);
        if (cancelled) return;

        const pixelRatio = getDisplayPixelRatio();
        const bitmapScale = PREVIEW_SCALE * pixelRatio;
        await renderPageToCanvas(doc, pageNumber, PREVIEW_SCALE, canvas, {
          pixelRatio,
        });
        if (cancelled) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        drawWatermarkOnCanvas(ctx, {
          settings: {
            text,
            fontSize,
            color,
            opacity,
            angle,
            position,
            fontFamily,
            bold,
            italic,
          },
          scale: bitmapScale,
          viewWidth: canvas.width / bitmapScale,
          viewHeight: canvas.height / bitmapScale,
        });
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setRendering(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    doc,
    pageNumber,
    text,
    fontSize,
    color,
    opacity,
    angle,
    position,
    fontFamily,
    bold,
    italic,
  ]);

  return (
    <div className="overflow-hidden rounded-2xl card-surface">
      <div className="flex items-center justify-between border-b border-primary/10 bg-bg-secondary/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-text-primary">
            Live preview
          </span>
          {(rendering || loading) && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          )}
        </div>
        {doc && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              aria-label="Previous page"
              className="rounded-lg p-1 text-text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-sm text-text-secondary">
              {pageNumber} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, pageNumber + 1))}
              disabled={pageNumber >= totalPages}
              aria-label="Next page"
              className="rounded-lg p-1 text-text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-[480px] items-center justify-center bg-bg-secondary/40 p-4">
        {doc ? (
          <canvas
            ref={canvasRef}
            className="max-h-[640px] max-w-full rounded shadow-soft"
          />
        ) : (
          <div className="text-center text-text-secondary">
            <UploadCloud className="mx-auto mb-3 h-12 w-12 opacity-40" />
            <p className="text-sm">Upload a PDF to see the live preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
