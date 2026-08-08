"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { GripVertical, Trash2 } from "lucide-react";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  generateImagePdf,
  type PdfImageInput,
} from "@/lib/pdf-generator";
import { downloadBlob, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

type Item = { id: string; file: File; url: string };

type PageSize = "a4" | "letter" | "custom";

export function ImageToPdfClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState(20);
  const [customW, setCustomW] = useState(210);
  const [customH, setCustomH] = useState(297);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const confetti = useConfetti();

  const onFiles = useCallback(async (files: File[]) => {
    const next = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    setItems((prev) => [...prev, ...next]);
    setResult(null);
    toast.success(`Added ${files.length} image(s)`);
  }, []);

  const remove = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const convert = async () => {
    if (!items.length) {
      toast.error("Add at least one image");
      return;
    }
    setProcessing(true);
    setProgress(10);
    try {
      const images: PdfImageInput[] = [];
      for (let i = 0; i < items.length; i++) {
        images.push(await fileToPdfImage(items[i].file));
        setProgress(10 + Math.round(((i + 1) / items.length) * 45));
      }

      const mmToPt = (mm: number) => (mm * 72) / 25.4;
      const pdfPageSize =
        pageSize === "custom"
          ? ([mmToPt(customW), mmToPt(customH)] as [number, number])
          : pageSize;
      const bytes = await generateImagePdf(images, {
        pageSize: pdfPageSize,
        orientation,
        marginPt: mmToPt(margin),
        showFooter: true,
      });
      setProgress(90);
      setResult(pdfBlob(bytes));
      setProgress(100);
      confetti();
      toast.success("PDF created!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create PDF");
    } finally {
      setProcessing(false);
    }
  };

  const step = result ? 2 : items.length ? 1 : 0;

  return (
    <>
      <StepIndicator steps={["Upload", "Arrange", "Download"]} current={step} />
      <FileUploader
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
        multiple
        onFiles={onFiles}
        label="Drop images (JPG, PNG, WEBP)"
        hint="JPG, PNG, WEBP"
      />

      {items.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="card-surface rounded-2xl p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="ps">Page size</Label>
              <select
                id="ps"
                className="mt-1.5 w-full h-11 rounded-xl border border-primary/20 bg-bg-card px-3 text-sm"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as PageSize)}
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="custom">Custom (mm)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="or">Orientation</Label>
              <select
                id="or"
                className="mt-1.5 w-full h-11 rounded-xl border border-primary/20 bg-bg-card px-3 text-sm"
                value={orientation}
                onChange={(e) =>
                  setOrientation(e.target.value as "portrait" | "landscape")
                }
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <Label htmlFor="mg">Margin (mm)</Label>
              <Input
                id="mg"
                type="number"
                className="mt-1.5"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value) || 0)}
              />
            </div>
            {pageSize === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-between">
            <p className="text-sm text-text-secondary">Drag to reorder</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  items.forEach((i) => URL.revokeObjectURL(i.url));
                  setItems([]);
                  setResult(null);
                }}
              >
                Clear
              </Button>
              <Button onClick={convert}>Convert to PDF</Button>
            </div>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item, idx) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === item.id) return;
                  setItems((prev) => {
                    const from = prev.findIndex((i) => i.id === dragId);
                    const to = prev.findIndex((i) => i.id === item.id);
                    if (from < 0 || to < 0) return prev;
                    const copy = [...prev];
                    const [m] = copy.splice(from, 1);
                    copy.splice(to, 0, m);
                    return copy;
                  });
                }}
                onDragEnd={() => setDragId(null)}
                className="card-surface rounded-xl p-2 cursor-grab relative"
              >
                <GripVertical className="absolute top-2 left-2 h-4 w-4 text-text-secondary" />
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 rounded-lg bg-bg-card/80"
                  onClick={() => remove(item.id)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.file.name}
                  className="rounded-lg w-full aspect-square object-cover"
                />
                <p className="text-xs mt-1 truncate text-center">
                  #{idx + 1} {item.file.name}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-8 flex justify-center">
          <DownloadButton
            onClick={() => downloadBlob(result, "images.pdf")}
            filename="images.pdf"
            size={result.size}
          />
        </div>
      )}

      <ProcessingOverlay open={processing} progress={progress} message="Creating PDF…" />
    </>
  );
}

async function fileToPdfImage(file: File): Promise<PdfImageInput> {
  if (file.type === "image/png" || file.type === "image/jpeg") {
    return {
      bytes: await file.arrayBuffer(),
      mimeType: file.type,
      name: file.name,
    };
  }

  // pdf-lib embeds PNG/JPEG directly. Convert WEBP and other browser-readable
  // formats once, preserving their natural dimensions and alpha channel.
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`Could not read ${file.name}`));
      element.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image for PDF.");
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error("Image conversion failed.")),
        "image/png"
      )
    );
    return {
      bytes: await blob.arrayBuffer(),
      mimeType: "image/png",
      name: file.name,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
