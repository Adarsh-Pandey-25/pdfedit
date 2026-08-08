"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { PositionPicker } from "@/components/watermark/PositionPicker";
import { PreviewPanel } from "@/components/watermark/PreviewPanel";
import { QuickPresets } from "@/components/watermark/QuickPresets";
import { StyleControls } from "@/components/watermark/StyleControls";
import { loadPdfDocument, type PdfDoc } from "@/lib/pdf/pdfjs";
import {
  DEFAULT_WATERMARK_SETTINGS,
  applyWatermark,
  calculateMaxFontSize,
  ensureWatermarkFont,
  measureWatermarkWidth,
  normalizeWatermarkText,
  type WatermarkPreset,
  type WatermarkSettings,
} from "@/lib/pdf/watermark-engine";
import { cn, downloadBlob, formatBytes, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function WatermarkClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null
  );
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const [settings, setSettings] = useState<WatermarkSettings>(
    DEFAULT_WATERMARK_SETTINGS
  );
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const patch = useCallback((changes: Partial<WatermarkSettings>) => {
    setSettings((prev) => ({ ...prev, ...changes }));
    setActivePreset(null);
  }, []);

  const applyPreset = useCallback((preset: WatermarkPreset) => {
    setSettings((prev) => ({
      ...prev,
      text: preset.text,
      color: preset.color,
      angle: preset.angle,
      opacity: preset.opacity,
      fontSize: preset.fontSize,
      position: preset.position,
    }));
    setActivePreset(preset.name);
  }, []);

  const onFiles = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoadingDoc(true);
    setResult(null);
    try {
      const bytes = await file.arrayBuffer();
      const loaded = await loadPdfDocument(bytes);
      setBuffer(bytes);
      setFileMeta({ name: file.name, size: file.size });
      setDoc(loaded);
      setPageNumber(1);
      toast.success("PDF loaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not read that PDF");
    } finally {
      setLoadingDoc(false);
    }
  }, []);

  const reset = useCallback(() => {
    setBuffer(null);
    setFileMeta(null);
    setDoc(null);
    setPageSize(null);
    setPageNumber(1);
    setResult(null);
  }, []);

  // Page size drives the overflow check, and it changes per previewed page.
  useEffect(() => {
    if (!doc) return undefined;
    let cancelled = false;
    doc
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        setPageSize({ width: viewport.width, height: viewport.height });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber]);

  // Measuring before the web font resolves would report the fallback metrics.
  useEffect(() => {
    let cancelled = false;
    ensureWatermarkFont(
      settings.fontFamily,
      settings.bold,
      settings.italic
    ).then(() => {
      if (!cancelled) setFontsReady((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [settings.fontFamily, settings.bold, settings.italic]);

  const trimmedText = normalizeWatermarkText(settings.text);

  const maxFontSize = useMemo(() => {
    if (!pageSize || !trimmedText) return null;
    void fontsReady;
    return calculateMaxFontSize({
      measureWidth: (size) =>
        measureWatermarkWidth(
          trimmedText,
          size,
          settings.fontFamily,
          settings.bold,
          settings.italic
        ),
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
      angle: settings.angle,
    });
  }, [
    pageSize,
    trimmedText,
    settings.fontFamily,
    settings.bold,
    settings.italic,
    settings.angle,
    fontsReady,
  ]);

  const totalPages = doc?.numPages ?? 0;
  const canApply = Boolean(buffer && trimmedText) && !processing;

  const applyAndDownload = async () => {
    if (!buffer || !trimmedText) return;
    setProcessing(true);
    try {
      const bytes = await applyWatermark(buffer, settings);
      const blob = pdfBlob(bytes);
      const name = fileMeta?.name.replace(/\.pdf$/i, "") || "document";
      setResult(blob);
      downloadBlob(blob, `${name}-watermarked.pdf`);
      confetti();
      toast.success("Watermark added!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to add watermark");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : buffer ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Customize", "Download"]} current={step} />

      {!buffer && (
        <FileUploader
          accept={{ "application/pdf": [".pdf"] }}
          onFiles={onFiles}
          disabled={loadingDoc}
        />
      )}

      {buffer && (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl card-surface p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text-primary">
                    {fileMeta?.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {formatBytes(fileMeta?.size || 0)} · {totalPages}{" "}
                    {totalPages === 1 ? "page" : "pages"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Remove file"
                  className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-secondary/10 hover:text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl card-surface p-4">
              <QuickPresets onApply={applyPreset} activeName={activePreset} />
            </div>

            <div className="rounded-2xl card-surface p-4">
              <label
                htmlFor="wm-text"
                className="mb-2 block text-sm font-semibold text-text-primary"
              >
                Watermark text
              </label>
              <input
                id="wm-text"
                type="text"
                value={settings.text}
                onChange={(e) => patch({ text: e.target.value })}
                placeholder="Enter watermark text…"
                className="w-full rounded-xl border-2 border-primary/20 bg-bg-card px-4 py-3 text-lg font-semibold text-text-primary outline-none transition-colors focus:border-primary"
              />
              <p className="mt-1 text-xs text-text-secondary">
                {settings.text.length} characters · applied to every page
              </p>
            </div>

            <div className="rounded-2xl card-surface p-4">
              <h3 className="mb-3 font-semibold text-text-primary">Style</h3>
              <StyleControls
                settings={settings}
                onChange={patch}
                maxFontSize={maxFontSize}
              />
            </div>

            <div className="rounded-2xl card-surface p-4">
              <PositionPicker
                value={settings.position}
                onChange={(position) => patch({ position })}
              />
            </div>

            <button
              type="button"
              onClick={applyAndDownload}
              disabled={!canApply}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 font-bold text-white shadow-soft transition-all",
                canApply
                  ? "hover:shadow-glow"
                  : "cursor-not-allowed opacity-50"
              )}
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Applying watermark…
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Apply &amp; download PDF
                </>
              )}
            </button>

            {result && (
              <div className="flex justify-center">
                <DownloadButton
                  onClick={() =>
                    downloadBlob(
                      result,
                      `${fileMeta?.name.replace(/\.pdf$/i, "") || "document"}-watermarked.pdf`
                    )
                  }
                  filename="watermarked.pdf"
                  size={result.size}
                  label="Download again"
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <PreviewPanel
                doc={doc}
                settings={settings}
                pageNumber={pageNumber}
                totalPages={totalPages}
                onPageChange={setPageNumber}
                loading={loadingDoc}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
