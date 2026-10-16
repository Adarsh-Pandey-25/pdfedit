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
import {
  addPageNumbers,
  PageNumberInputError,
  parsePageNumberStart,
  type PageNumberOptions,
} from "@/lib/pdf/operations";
import { downloadBlob , pdfBlob} from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function PageNumbersClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [position, setPosition] =
    useState<PageNumberOptions["position"]>("bottom-center");
  const [format, setFormat] = useState<PageNumberOptions["format"]>("numeric");
  const [startText, setStartText] = useState("1");
  const [startError, setStartError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState("#431407");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const buf = await files[0].arrayBuffer();
    let count: number | null = null;
    try {
      const { PDFDocument } = await import("pdf-lib");
      count = (await PDFDocument.load(buf, { ignoreEncryption: true })).getPageCount();
    } catch {
      // addPageNumbers loads it again and reports the failure.
    }
    setPageCount(count);
    setBuffer(buf);
    setResult(null);
    setStartError(null);
    toast.success("PDF loaded");
  }, []);

  const apply = async () => {
    if (!buffer) return;
    const parsed = parsePageNumberStart(startText, format, pageCount ?? 1);
    if ("error" in parsed) {
      setStartError(parsed.error);
      setResult(null);
      return;
    }
    setStartError(null);
    setProcessing(true);
    setProgress(40);
    try {
      const bytes = await addPageNumbers(buffer, {
        position,
        format,
        start: parsed.value,
        fontSize,
        color,
      });
      setProgress(100);
      setResult(pdfBlob(bytes));
      confetti();
      toast.success("Page numbers added!");
    } catch (e) {
      if (e instanceof PageNumberInputError) {
        setStartError(e.message);
        setResult(null);
      } else {
        toast.error("Failed to add page numbers");
      }
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : buffer ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Configure", "Download"]} current={step} />
      {!buffer && (
        <FileUploader accept={{ "application/pdf": [".pdf"] }} onFiles={onFiles} />
      )}

      {buffer && (
        <div className="mt-6 max-w-lg mx-auto card-surface rounded-2xl p-6 space-y-4">
          <div>
            <Label htmlFor="pos">Position</Label>
            <select
              id="pos"
              className="mt-1.5 w-full h-11 rounded-xl border border-primary/20 bg-bg-card px-3 text-sm"
              value={position}
              onChange={(e) =>
                setPosition(e.target.value as PageNumberOptions["position"])
              }
            >
              {[
                "top-left",
                "top-center",
                "top-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="fmt">Format</Label>
            <select
              id="fmt"
              className="mt-1.5 w-full h-11 rounded-xl border border-primary/20 bg-bg-card px-3 text-sm"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as PageNumberOptions["format"]);
                setStartError(null);
              }}
            >
              <option value="numeric">1, 2, 3</option>
              <option value="page-n">Page 1, Page 2</option>
              <option value="roman">i, ii, iii</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="number"
                className="mt-1.5"
                value={startText}
                onChange={(e) => {
                  setStartText(e.target.value);
                  setStartError(null);
                }}
                aria-invalid={startError ? true : undefined}
                aria-describedby={startError ? "start-error" : undefined}
              />
              {startError && (
                <p id="start-error" role="alert" className="mt-1 text-xs text-red-600">
                  {startError}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                type="number"
                className="mt-1.5"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value) || 12)}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                className="mt-1.5 h-11"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={apply}>Add page numbers</Button>
            <Button variant="outline" onClick={() => { setBuffer(null); setResult(null); }}>
              New file
            </Button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result, "numbered.pdf")}
            filename="numbered.pdf"
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Adding numbers…" />
    </>
  );
}
