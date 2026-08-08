"use client";

import { useCallback, useState } from "react";
import { GripVertical, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { PDFThumbnail } from "@/components/shared/PDFThumbnail";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { mergePdfs } from "@/lib/pdf/operations";
import { downloadBlob, formatBytes , pdfBlob} from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

type Item = {
  id: string;
  file: File;
  buffer: ArrayBuffer;
};

export function MergeClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const next: Item[] = [];
    for (const file of files) {
      next.push({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        buffer: await file.arrayBuffer(),
      });
    }
    setItems((prev) => [...prev, ...next]);
    setResult(null);
    toast.success(`Added ${files.length} file${files.length > 1 ? "s" : ""}`);
  }, []);

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setResult(null);
  };

  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === dragId);
      const to = prev.findIndex((i) => i.id === overId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  };

  const merge = async () => {
    if (items.length < 2) {
      toast.error("Add at least 2 PDFs to merge");
      return;
    }
    setProcessing(true);
    setProgress(10);
    try {
      // Read straight from the File handles so merging never depends on the
      // cached buffers, which preview rendering may have consumed.
      const buffers = await Promise.all(
        items.map((i) => i.file.arrayBuffer())
      );
      setProgress(40);
      const bytes = await mergePdfs(
        buffers,
        items.map((i) => i.file.name)
      );
      setProgress(90);
      const blob = pdfBlob(bytes);
      setResult(blob);
      setProgress(100);
      confetti();
      toast.success("PDFs merged successfully!");
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to merge PDFs. Check that files are valid."
      );
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : items.length ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Reorder", "Download"]} current={step} />
      <FileUploader
        accept={{ "application/pdf": [".pdf"] }}
        multiple
        onFiles={onFiles}
        label="Drop PDF files here"
        hint="PDF"
      />

      {items.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {items.length} file{items.length !== 1 ? "s" : ""} · drag cards to reorder
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setItems([]); setResult(null); }}>
                Clear all
              </Button>
              <Button onClick={merge} disabled={items.length < 2}>
                Merge All
              </Button>
            </div>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => onDragStart(item.id)}
                onDragOver={(e) => onDragOver(e, item.id)}
                onDragEnd={() => setDragId(null)}
                className="card-surface rounded-2xl p-3 flex gap-3 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-5 w-5 text-text-secondary shrink-0 mt-8" />
                <div className="w-20 shrink-0">
                  <PDFThumbnail data={item.buffer} alt={item.file.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-primary">#{idx + 1}</p>
                  <p className="font-medium text-sm truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-xs text-text-secondary">{formatBytes(item.file.size)}</p>
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove"
                      onClick={() => remove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Preview"
                      onClick={() => {
                        const url = URL.createObjectURL(item.file);
                        window.open(url, "_blank", "noopener,noreferrer");
                        // Revoke after the browser has a chance to load it
                        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result, "merged.pdf")}
            filename="merged.pdf"
            size={result.size}
            label="Download merged PDF"
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Merging PDFs…" />
    </>
  );
}
