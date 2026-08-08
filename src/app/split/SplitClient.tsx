"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { PDFThumbnail } from "@/components/shared/PDFThumbnail";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadPdfDocument } from "@/lib/pdf/pdfjs";
import { parsePageRanges, splitAllPages, splitPdf } from "@/lib/pdf/operations";
import { downloadBlob, cn, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function SplitClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [range, setRange] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    const buf = await f.arrayBuffer();
    setBuffer(buf);
    setResult(null);
    try {
      const doc = await loadPdfDocument(buf);
      setPageCount(doc.numPages);
      setSelected(new Set(Array.from({ length: doc.numPages }, (_, i) => i + 1)));
      await doc.cleanup();
      toast.success(`Loaded ${doc.numPages} pages`);
    } catch {
      toast.error("Invalid PDF file");
      setBuffer(null);
    }
  }, []);

  useEffect(() => {
    if (!range.trim() || !pageCount) return;
    const pages = parsePageRanges(range, pageCount);
    if (pages.length) setSelected(new Set(pages));
  }, [range, pageCount]);

  const toggle = (n: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const extractSelected = async () => {
    if (!buffer || selected.size === 0) {
      toast.error("Select at least one page");
      return;
    }
    setProcessing(true);
    setProgress(20);
    try {
      const pages = Array.from(selected).sort((a, b) => a - b);
      const bytes = await splitPdf(buffer, pages);
      setProgress(100);
      setResult({
        blob: pdfBlob(bytes),
        name: "extracted-pages.pdf",
      });
      confetti();
      toast.success("Pages extracted!");
    } catch {
      toast.error("Split failed");
    } finally {
      setProcessing(false);
    }
  };

  const splitIndividually = async () => {
    if (!buffer) return;
    setProcessing(true);
    setProgress(10);
    try {
      const parts = await splitAllPages(buffer);
      setProgress(60);
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      parts.forEach((p) => zip.file(p.name, p.data));
      const blob = await zip.generateAsync(
        { type: "blob" },
        (meta) => setProgress(60 + meta.percent * 0.4)
      );
      setResult({ blob, name: "split-pages.zip" });
      confetti();
      toast.success("Split into individual pages!");
    } catch {
      toast.error("Split failed");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : buffer ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Select pages", "Download"]} current={step} />
      {!buffer && (
        <FileUploader
          accept={{ "application/pdf": [".pdf"] }}
          onFiles={onFiles}
          label="Drop a PDF to split"
        />
      )}

      {buffer && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="range">Custom range (e.g. 1-3, 5, 7-10)</Label>
              <Input
                id="range"
                className="mt-1.5"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder={`1-${pageCount}`}
              />
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)))
              }
            >
              Select all
            </Button>
            <Button variant="outline" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button variant="secondary" onClick={() => { setBuffer(null); setResult(null); }}>
              New file
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggle(n)}
                className={cn(
                  "relative card-surface rounded-xl p-2 text-left transition-all",
                  selected.has(n) && "ring-2 ring-primary shadow-glow"
                )}
              >
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox checked={selected.has(n)} />
                </div>
                <PDFThumbnail data={buffer} pageNumber={n} />
                <p className="mt-1 text-center text-xs font-medium">Page {n}</p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={extractSelected}>Extract selected ({selected.size})</Button>
            <Button variant="secondary" onClick={splitIndividually}>
              Split all pages (ZIP)
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result.blob, result.name)}
            filename={result.name}
            size={result.blob.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Splitting PDF…" />
    </>
  );
}
