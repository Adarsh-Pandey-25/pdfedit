"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { downloadBlob, cn } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

type Fmt = "png" | "jpeg";

export function PdfToImageClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [format, setFormat] = useState<Fmt>("png");
  const [quality, setQuality] = useState(0.92);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    setBuffer(await files[0].arrayBuffer());
    setPreviews([]);
    setZipBlob(null);
    toast.success("PDF loaded");
  }, []);

  const convert = async () => {
    if (!buffer) return;
    setProcessing(true);
    setProgress(5);
    try {
      const doc = await loadPdfDocument(buffer);
      const urls: string[] = [];
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const mime = format === "png" ? "image/png" : "image/jpeg";
      const ext = format === "png" ? "png" : "jpg";

      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, 2);
        const dataUrl = canvas.toDataURL(mime, quality);
        urls.push(dataUrl);
        const bytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        zip.file(`page-${i}.${ext}`, bytes);
        setProgress(Math.round((i / doc.numPages) * 85));
      }

      await doc.cleanup();
      setPreviews(urls);
      const blob = await zip.generateAsync({ type: "blob" });
      setZipBlob(blob);
      setProgress(100);
      confetti();
      toast.success(`Converted ${urls.length} pages`);
    } catch (e) {
      console.error(e);
      toast.error("Conversion failed");
    } finally {
      setProcessing(false);
    }
  };

  const step = zipBlob ? 2 : buffer ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Convert", "Download"]} current={step} />
      {!buffer && (
        <FileUploader accept={{ "application/pdf": [".pdf"] }} onFiles={onFiles} />
      )}

      {buffer && (
        <div className="mt-6 max-w-lg mx-auto space-y-5">
          <div className="card-surface rounded-2xl p-5 space-y-4">
            <div>
              <Label>Format</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["png", "jpeg"] as Fmt[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      "rounded-xl border-2 py-2.5 text-sm font-semibold uppercase",
                      format === f ? "border-primary bg-primary/10" : "border-primary/15"
                    )}
                  >
                    {f === "jpeg" ? "JPG" : "PNG"}
                  </button>
                ))}
              </div>
            </div>
            {format === "jpeg" && (
              <div>
                <Label>Quality: {Math.round(quality * 100)}%</Label>
                <Slider
                  className="mt-3"
                  value={[quality]}
                  min={0.4}
                  max={1}
                  step={0.05}
                  onValueChange={(v) => setQuality(v[0])}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={convert}>Convert pages</Button>
              <Button variant="outline" onClick={() => { setBuffer(null); setPreviews([]); setZipBlob(null); }}>
                New file
              </Button>
            </div>
          </div>
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex justify-center">
            {zipBlob && (
              <DownloadButton
                onClick={() => downloadBlob(zipBlob, "pdf-pages.zip")}
                filename="pdf-pages.zip"
                size={zipBlob.size}
                label="Download all (ZIP)"
              />
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((src, i) => (
              <a
                key={i}
                href={src}
                download={`page-${i + 1}.${format === "png" ? "png" : "jpg"}`}
                className="card-surface rounded-xl p-2 block hover:shadow-glow transition-shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Page ${i + 1}`} className="rounded-lg w-full" />
                <p className="text-xs text-center mt-1 font-medium">Page {i + 1}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Rendering pages…" />
    </>
  );
}
