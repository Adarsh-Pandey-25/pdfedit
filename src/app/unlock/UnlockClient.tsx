"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadPdfDocument, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { downloadBlob, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function UnlockClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [password, setPassword] = useState("");
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    setFileName(files[0].name);
    setBuffer(await files[0].arrayBuffer());
    setResult(null);
    toast.success("PDF loaded — enter password if required");
  }, []);

  const unlock = async () => {
    if (!buffer) return;
    setProcessing(true);
    setProgress(15);
    try {
      // Try opening with PDF.js (handles user password)
      let doc;
      try {
        doc = await loadPdfDocument(buffer, password || undefined);
      } catch {
        toast.error("Incorrect password or unsupported encryption");
        setProcessing(false);
        return;
      }

      setProgress(30);
      // Rebuild as unencrypted PDF by rasterizing pages (most reliable unlock)
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (let i = 1; i <= doc.numPages; i++) {
        const canvas = await renderPageToCanvas(doc, i, 1.5);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const jpg = await fetch(dataUrl).then((r) => r.arrayBuffer());
        const img = await out.embedJpg(jpg);
        const page = out.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        setProgress(30 + Math.round((i / doc.numPages) * 60));
      }
      await doc.cleanup();

      const bytes = await out.save({ useObjectStreams: true });
      setResult(pdfBlob(bytes));
      setProgress(100);
      confetti();
      toast.success("PDF unlocked!");
    } catch (e) {
      console.error(e);
      toast.error("Could not unlock this PDF");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : buffer ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Unlock", "Download"]} current={step} />
      {!buffer && (
        <FileUploader accept={{ "application/pdf": [".pdf"] }} onFiles={onFiles} />
      )}

      {buffer && (
        <div className="mt-6 max-w-md mx-auto card-surface rounded-2xl p-6 space-y-4">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank if none / owner-only"
            />
          </div>
          <p className="text-xs text-text-secondary">
            Only unlock PDFs you own or have permission to open. Pages are
            rebuilt without encryption.
          </p>
          <div className="flex gap-2">
            <Button onClick={unlock}>Remove protection</Button>
            <Button variant="outline" onClick={() => { setBuffer(null); setResult(null); }}>
              New file
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result, "unlocked.pdf")}
            filename="unlocked.pdf"
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Unlocking…" />
    </>
  );
}
