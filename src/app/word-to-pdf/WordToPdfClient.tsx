"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { parseWordContent } from "@/lib/pdf-content-parser";
import { generateBeautifulPdf } from "@/lib/pdf-generator";
import {
  THEME_OPTIONS,
  type PdfThemeName,
} from "@/lib/pdf-themes";
import { downloadBlob, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

export function WordToPdfClient() {
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [theme, setTheme] = useState<PdfThemeName>("modern");
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const file = files[0];
    setFileName(file.name);
    setResult(null);
    setProcessing(true);
    setProgress(20);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = (await import("mammoth")).default;
      const { value } = await mammoth.convertToHtml({ arrayBuffer });
      setHtml(value);
      setProgress(100);
      toast.success("Document parsed — preview ready");
    } catch (e) {
      console.error(e);
      toast.error("Could not read DOCX file");
      setHtml("");
    } finally {
      setProcessing(false);
    }
  }, []);

  const convert = async () => {
    if (!html) return;
    setProcessing(true);
    setProgress(20);
    try {
      const blocks = parseWordContent(html);
      const title = fileName.replace(/\.[^.]+$/i, "");
      const bytes = await generateBeautifulPdf(blocks, { title, theme });
      setProgress(90);
      setResult(pdfBlob(bytes));
      setProgress(100);
      confetti();
      toast.success("PDF created!");
    } catch (e) {
      console.error(e);
      toast.error("Conversion failed");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : html ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Preview", "Download"]} current={step} />
      {!html && (
        <FileUploader
          accept={{
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
              ".docx",
            ],
          }}
          onFiles={onFiles}
          label="Drop a Word (.docx) file"
          hint="DOCX"
        />
      )}

      {html && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Label htmlFor="word-pdf-theme">Theme</Label>
                <select
                  id="word-pdf-theme"
                  className="h-10 rounded-xl border border-primary/20 bg-bg-card px-3"
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value as PdfThemeName);
                    setResult(null);
                  }}
                >
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={convert}>Convert to PDF</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setHtml("");
                  setResult(null);
                }}
              >
                New file
              </Button>
            </div>
          </div>
          <div
            className="card-surface rounded-2xl p-6 prose prose-sm max-w-none text-text-primary overflow-auto max-h-[480px]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() =>
              downloadBlob(result, fileName.replace(/\.docx$/i, "") + ".pdf")
            }
            filename={fileName.replace(/\.docx$/i, "") + ".pdf"}
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Converting…" />
    </>
  );
}
