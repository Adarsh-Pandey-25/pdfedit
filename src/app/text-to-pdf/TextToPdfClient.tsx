"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseTextContent } from "@/lib/pdf-content-parser";
import { generateBeautifulPdf } from "@/lib/pdf-generator";
import {
  THEME_OPTIONS,
  type PdfThemeName,
} from "@/lib/pdf-themes";
import { downloadBlob, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

const EXAMPLE = `# Project Overview

A clean PDF can preserve **bold text**, *italic text*, and Unicode symbols:
→ arrows, • bullets, — em dashes, “smart quotes”, … ellipses, and ★ stars.

## Key benefits

- Professional typography and spacing
- Automatic line wrapping and page breaks
- Consistent one-inch margins

1. Write or paste your content
2. Choose a visual theme
3. Download the finished PDF

> Good typography makes information easier to understand.`;

export function TextToPdfClient() {
  const [title, setTitle] = useState("Document");
  const [text, setText] = useState(EXAMPLE);
  const [theme, setTheme] = useState<PdfThemeName>("modern");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const convert = async () => {
    if (!text.trim()) {
      toast.error("Enter some text first");
      return;
    }
    setProcessing(true);
    setProgress(20);
    try {
      const bytes = await generateBeautifulPdf(parseTextContent(text), {
        title: title.trim() || "Document",
        theme,
      });
      setProgress(90);
      setResult(pdfBlob(bytes));
      setProgress(100);
      confetti();
      toast.success("PDF created!");
    } catch (error) {
      console.error(error);
      toast.error("Could not create PDF");
    } finally {
      setProcessing(false);
    }
  };

  const filename =
    (title.trim() || "document")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() + ".pdf";

  return (
    <div className="space-y-5">
      <div className="card-surface rounded-2xl p-5 grid gap-4 sm:grid-cols-[1fr_180px_auto] items-end">
        <div>
          <Label htmlFor="text-pdf-title">Document title</Label>
          <Input
            id="text-pdf-title"
            className="mt-1.5"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setResult(null);
            }}
          />
        </div>
        <div>
          <Label htmlFor="text-pdf-theme">Theme</Label>
          <select
            id="text-pdf-theme"
            className="mt-1.5 h-11 w-full rounded-xl border border-primary/20 bg-bg-card px-3 text-sm"
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
        </div>
        <Button onClick={convert}>Create PDF</Button>
      </div>

      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        className="min-h-[460px] font-mono text-sm leading-relaxed"
        aria-label="Text or Markdown content"
        placeholder="Use # headings, **bold**, *italic*, lists, quotes, and code blocks…"
      />

      {result && (
        <div className="flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result, filename)}
            filename={filename}
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay
        open={processing}
        progress={progress}
        message="Typesetting your PDF…"
      />
    </div>
  );
}

