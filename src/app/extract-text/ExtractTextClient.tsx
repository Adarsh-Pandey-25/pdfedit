"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Download } from "lucide-react";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseTextContent } from "@/lib/pdf-content-parser";
import { generateBeautifulPdf } from "@/lib/pdf-generator";
import {
  THEME_OPTIONS,
  type PdfThemeName,
} from "@/lib/pdf-themes";
import { extractTextFromPdf, loadPdfDocument } from "@/lib/pdf/pdfjs";
import { downloadBlob, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function ExtractTextClient() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState<PdfThemeName>("modern");
  const confetti = useConfetti();

  const onFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      setFileName(file.name);
      setProcessing(true);
      setProgress(10);
      try {
        const buf = await file.arrayBuffer();
        const doc = await loadPdfDocument(buf);
        setProgress(40);
        const extracted = await extractTextFromPdf(doc);
        await doc.cleanup();
        setText(extracted || "(No extractable text found in this PDF.)");
        setProgress(100);
        confetti();
        toast.success("Text extracted!");
      } catch (e) {
        console.error(e);
        toast.error("Could not extract text");
        setText("");
      } finally {
        setProcessing(false);
      }
    },
    [confetti]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard access denied");
    }
  };

  const downloadPdf = async () => {
    if (!text) return;
    setProcessing(true);
    setProgress(20);
    try {
      const title = fileName.replace(/\.pdf$/i, "") + " — Extracted Text";
      const bytes = await generateBeautifulPdf(parseTextContent(text), {
        title,
        theme,
      });
      setProgress(100);
      downloadBlob(
        pdfBlob(bytes),
        fileName.replace(/\.pdf$/i, "") + "-extracted.pdf"
      );
      toast.success("Formatted PDF created!");
    } catch (e) {
      console.error(e);
      toast.error("Could not create formatted PDF");
    } finally {
      setProcessing(false);
    }
  };

  const step = text ? 2 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Extract", "Export"]} current={step} />
      {!text && (
        <FileUploader
          accept={{ "application/pdf": [".pdf"] }}
          onFiles={onFiles}
          label="Drop a PDF to extract text"
        />
      )}

      {text && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <div className="flex gap-2">
              <select
                aria-label="PDF theme"
                className="h-10 rounded-xl border border-primary/20 bg-bg-card px-3 text-sm"
                value={theme}
                onChange={(e) => setTheme(e.target.value as PdfThemeName)}
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={copy}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button
                onClick={() =>
                  downloadBlob(
                    new Blob([text], { type: "text/plain;charset=utf-8" }),
                    fileName.replace(/\.pdf$/i, "") + ".txt"
                  )
                }
              >
                <Download className="h-4 w-4" /> Download .txt
              </Button>
              <Button onClick={downloadPdf}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setText("");
                  setFileName("");
                }}
              >
                New file
              </Button>
            </div>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[420px] font-mono text-sm"
            aria-label="Extracted text"
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Extracting text…" />
    </>
  );
}
