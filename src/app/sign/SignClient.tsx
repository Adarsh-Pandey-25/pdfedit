"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  MousePointerClick,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { PlacementLayer } from "@/components/sign/PlacementLayer";
import { SignatureBuilder } from "@/components/sign/SignatureBuilder";
import { loadPdfDocument, type PdfDoc } from "@/lib/pdf/pdfjs";
import {
  DEFAULT_SIGNATURE_WIDTH_RATIO,
  applySignatures,
  type SignatureAsset,
  type SignaturePlacement,
} from "@/lib/pdf/signature-engine";
import { downloadBlob, formatBytes, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

type PageSize = { width: number; height: number };

export function SignClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(
    null
  );
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize | null>(null);
  const [asset, setAsset] = useState<SignatureAsset | null>(null);
  const [placements, setPlacements] = useState<SignaturePlacement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      const bytes = await file.arrayBuffer();
      const loaded = await loadPdfDocument(bytes);
      setBuffer(bytes);
      setFileMeta({ name: file.name, size: file.size });
      setDoc(loaded);
      setPageNumber(1);
      setPlacements([]);
      setResult(null);
      toast.success("PDF loaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not read that PDF");
    }
  }, []);

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

  const heightRatioFor = useCallback(
    (widthRatio: number, source: SignatureAsset, size: PageSize) =>
      widthRatio *
      (size.width / size.height) *
      (source.height / source.width),
    []
  );

  const addPlacement = useCallback(
    (xRatio: number, yRatio: number) => {
      if (!asset || !pageSize) return;
      const widthRatio = DEFAULT_SIGNATURE_WIDTH_RATIO;
      const heightRatio = heightRatioFor(widthRatio, asset, pageSize);
      const id = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setPlacements((prev) => [
        ...prev,
        {
          id,
          pageIndex: pageNumber - 1,
          xRatio: Math.min(Math.max(xRatio - widthRatio / 2, 0), 1 - widthRatio),
          yRatio: Math.min(
            Math.max(yRatio - heightRatio / 2, 0),
            Math.max(0, 1 - heightRatio)
          ),
          widthRatio,
          heightRatio,
          asset,
        },
      ]);
      setSelectedId(id);
      setResult(null);
    },
    [asset, pageSize, pageNumber, heightRatioFor]
  );

  const updatePlacement = useCallback(
    (id: string, patch: Partial<SignaturePlacement>) => {
      setPlacements((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
      setResult(null);
    },
    []
  );

  const removePlacement = useCallback((id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
    setResult(null);
  }, []);

  const copyToAllPages = useCallback(() => {
    const source = placements.find((p) => p.id === selectedId);
    if (!source || !doc) return;
    const copies: SignaturePlacement[] = [];
    for (let index = 0; index < doc.numPages; index++) {
      if (index === source.pageIndex) continue;
      copies.push({
        ...source,
        id: `sig-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        pageIndex: index,
      });
    }
    if (!copies.length) return;
    setPlacements((prev) => [...prev, ...copies]);
    setResult(null);
    toast.success(`Copied to ${copies.length} more page${copies.length === 1 ? "" : "s"}`);
  }, [placements, selectedId, doc]);

  const pagePlacements = useMemo(
    () => placements.filter((p) => p.pageIndex === pageNumber - 1),
    [placements, pageNumber]
  );

  const downloadName = `${fileMeta?.name.replace(/\.pdf$/i, "") || "document"}-signed.pdf`;

  const applyAndDownload = async () => {
    if (!buffer || !placements.length) return;
    setProcessing(true);
    setProgress(35);
    try {
      const bytes = await applySignatures(buffer, placements);
      setProgress(100);
      const blob = pdfBlob(bytes);
      setResult(blob);
      downloadBlob(blob, downloadName);
      confetti();
      toast.success("Document signed!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to sign PDF");
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = doc?.numPages ?? 0;
  const step = result ? 2 : buffer ? 1 : 0;

  if (!buffer || !doc) {
    return (
      <>
        <StepIndicator steps={["Upload", "Sign", "Download"]} current={0} />
        <FileUploader accept={{ "application/pdf": [".pdf"] }} onFiles={onFiles} />
      </>
    );
  }

  return (
    <>
      <StepIndicator steps={["Upload", "Sign", "Download"]} current={step} />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
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
                onClick={() => {
                  setBuffer(null);
                  setDoc(null);
                  setPlacements([]);
                  setResult(null);
                }}
                aria-label="Remove file"
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-secondary/10 hover:text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl card-surface p-4">
            <SignatureBuilder active={asset} onCreate={setAsset} />
          </div>

          <div className="rounded-2xl card-surface p-4 space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-text-secondary">
                {asset
                  ? "Click the page to place your signature, then drag it or pull the corner to resize."
                  : "Create a signature above, then click the page to place it."}
              </p>
            </div>

            <p className="text-sm text-text-primary">
              <span className="font-semibold">{placements.length}</span>{" "}
              signature{placements.length === 1 ? "" : "s"} placed
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copyToAllPages}
                disabled={!selectedId || totalPages < 2}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy to all pages
              </Button>
              {placements.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPlacements([]);
                    setSelectedId(null);
                    setResult(null);
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={applyAndDownload}
              disabled={!placements.length || processing}
            >
              Apply &amp; download
            </Button>

            {result && (
              <div className="flex justify-center pt-1">
                <DownloadButton
                  onClick={() => downloadBlob(result, downloadName)}
                  filename={downloadName}
                  size={result.size}
                  label="Download again"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono text-sm text-text-secondary">
              {pageNumber} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <PlacementLayer
            doc={doc}
            pageNumber={pageNumber}
            placements={pagePlacements}
            selectedId={selectedId}
            canPlace={Boolean(asset)}
            onSelect={setSelectedId}
            onAdd={addPlacement}
            onUpdate={updatePlacement}
            onRemove={removePlacement}
          />
        </div>
      </div>

      <ProcessingOverlay open={processing} progress={progress} message="Signing…" />
    </>
  );
}
