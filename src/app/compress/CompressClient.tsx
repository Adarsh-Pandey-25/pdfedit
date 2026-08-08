"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { downloadBlob, formatBytes, percentReduction, cn, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

type Level = "low" | "medium" | "high";

const LEVELS: { id: Level; label: string; scale: number; quality: number }[] = [
  { id: "low", label: "Low", scale: 1.5, quality: 0.85 },
  { id: "medium", label: "Medium", scale: 1.2, quality: 0.7 },
  { id: "high", label: "High", scale: 0.9, quality: 0.5 },
];

export function CompressClient() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [level, setLevel] = useState<Level>("medium");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setBuffer(await f.arrayBuffer());
    setResult(null);
    toast.success(`Loaded ${f.name}`);
  }, []);

  const compress = async () => {
    if (!buffer) return;
    const cfg = LEVELS.find((l) => l.id === level)!;
    setProcessing(true);
    setProgress(5);
    try {
      const srcDoc = await loadPdfDocument(buffer);
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      const total = srcDoc.numPages;

      for (let i = 1; i <= total; i++) {
        const canvas = await renderPageToCanvas(srcDoc, i, cfg.scale);
        const dataUrl = canvas.toDataURL("image/jpeg", cfg.quality);
        const jpgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        const img = await out.embedJpg(jpgBytes);
        const page = out.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        setProgress(Math.round((i / total) * 90));
      }

      await srcDoc.cleanup();
      const bytes = await out.save({ useObjectStreams: true });
      const blob = pdfBlob(bytes);
      setResult(blob);
      setProgress(100);
      confetti();
      toast.success("Compression complete!");
    } catch (e) {
      console.error(e);
      toast.error("Compression failed");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : buffer ? 1 : 0;
  const reduction =
    file && result ? percentReduction(file.size, result.size) : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Compress", "Download"]} current={step} />
      {!buffer && (
        <FileUploader
          accept={{ "application/pdf": [".pdf"] }}
          onFiles={onFiles}
          label="Drop a PDF to compress"
        />
      )}

      {buffer && file && (
        <div className="mt-6 space-y-6 max-w-xl mx-auto">
          <div className="card-surface rounded-2xl p-5">
            <p className="font-semibold truncate">{file.name}</p>
            <p className="text-sm text-text-secondary mt-1">
              Original size: {formatBytes(file.size)}
            </p>
          </div>

          <div>
            <Label className="mb-3 block">Compression level</Label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { setLevel(l.id); setResult(null); }}
                  className={cn(
                    "rounded-xl border-2 py-3 text-sm font-semibold transition-all",
                    level === l.id
                      ? "border-primary bg-primary/10 shadow-soft"
                      : "border-primary/15 hover:border-primary/40"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-secondary">
              Higher compression rebuilds pages as images for smaller files (may reduce sharpness).
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={compress}>Compress PDF</Button>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setBuffer(null);
                setResult(null);
              }}
            >
              New file
            </Button>
          </div>
        </div>
      )}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-text-secondary">
            Compressed: {formatBytes(result.size)} ·{" "}
            <span className="text-emerald-600 font-semibold">{reduction}% smaller</span>
          </p>
          <DownloadButton
            onClick={() => downloadBlob(result, `compressed-${file.name}`)}
            filename={`compressed-${file.name}`}
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Compressing…" />
    </>
  );
}
