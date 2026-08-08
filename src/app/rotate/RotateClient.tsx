"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { RotateCw } from "lucide-react";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { PDFThumbnail } from "@/components/shared/PDFThumbnail";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { loadPdfDocument } from "@/lib/pdf/pdfjs";
import { rotatePdf } from "@/lib/pdf/operations";
import { downloadBlob, cn , pdfBlob} from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function RotateClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const buf = await files[0].arrayBuffer();
    try {
      const doc = await loadPdfDocument(buf);
      setPageCount(doc.numPages);
      setBuffer(buf);
      setRotations({});
      setResult(null);
      await doc.cleanup();
      toast.success("PDF loaded");
    } catch {
      toast.error("Invalid PDF");
    }
  }, []);

  const rotatePage = (n: number, delta = 90) => {
    setRotations((prev) => ({
      ...prev,
      [n]: ((prev[n] || 0) + delta) % 360,
    }));
    setResult(null);
  };

  const rotateAll = (delta = 90) => {
    setRotations((prev) => {
      const next = { ...prev };
      for (let i = 1; i <= pageCount; i++) {
        next[i] = ((next[i] || 0) + delta) % 360;
      }
      return next;
    });
    setResult(null);
  };

  const apply = async () => {
    if (!buffer) return;
    setProcessing(true);
    setProgress(30);
    try {
      const bytes = await rotatePdf(buffer, rotations);
      setProgress(100);
      setResult(pdfBlob(bytes));
      confetti();
      toast.success("Rotation applied!");
    } catch {
      toast.error("Failed to rotate");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : buffer ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Rotate", "Download"]} current={step} />
      {!buffer && (
        <FileUploader accept={{ "application/pdf": [".pdf"] }} onFiles={onFiles} />
      )}

      {buffer && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => rotateAll(90)}>
              <RotateCw className="h-4 w-4" /> Rotate all 90°
            </Button>
            <Button variant="secondary" onClick={() => rotateAll(180)}>
              Rotate all 180°
            </Button>
            <Button onClick={apply}>Apply & prepare download</Button>
            <Button variant="outline" onClick={() => { setBuffer(null); setResult(null); }}>
              New file
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <div key={n} className="card-surface rounded-xl p-3 text-center">
                <div
                  className={cn("transition-transform duration-300")}
                  style={{ transform: `rotate(${rotations[n] || 0}deg)` }}
                >
                  <PDFThumbnail data={buffer} pageNumber={n} />
                </div>
                <p className="mt-2 text-xs font-medium">
                  Page {n} · {rotations[n] || 0}°
                </p>
                <div className="mt-2 flex justify-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => rotatePage(n, 90)}>
                    90°
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rotatePage(n, 180)}>
                    180°
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result, "rotated.pdf")}
            filename="rotated.pdf"
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Rotating…" />
    </>
  );
}
