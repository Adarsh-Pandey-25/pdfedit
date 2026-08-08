"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import toast from "react-hot-toast";
import { FileUploader } from "@/components/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadPdfDocument,
  renderPageToCanvas,
  renderPageThumbnail,
  getDisplayPixelRatio,
  type PdfDoc,
} from "@/lib/pdf/pdfjs";

export function ViewerClient() {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [fit, setFit] = useState<"width" | "page" | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onFiles = useCallback(async (files: File[]) => {
    try {
      if (doc) await doc.cleanup();
      const buf = await files[0].arrayBuffer();
      const pdf = await loadPdfDocument(buf);
      setDoc(pdf);
      setPage(1);
      setMatches([]);
      const t: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
        t.push(await renderPageThumbnail(pdf, i, 100));
      }
      setThumbs(t);
      toast.success(`${pdf.numPages} pages loaded`);
    } catch {
      toast.error("Could not open PDF");
    }
  }, [doc]);

  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      let s = scale;
      if (fit && containerRef.current) {
        const pg = await doc.getPage(page);
        const vp = pg.getViewport({ scale: 1 });
        const cw = containerRef.current.clientWidth - 32;
        const ch = containerRef.current.clientHeight - 32;
        if (fit === "width") s = cw / vp.width;
        else s = Math.min(cw / vp.width, ch / vp.height);
        if (!cancelled) setScale(s);
      }
      if (!cancelled && canvasRef.current) {
        await renderPageToCanvas(doc, page, s, canvasRef.current, {
          pixelRatio: getDisplayPixelRatio(),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, page, scale, fit]);

  const search = async () => {
    if (!doc || !query.trim()) return;
    const found: number[] = [];
    const q = query.toLowerCase();
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i);
      const content = await p.getTextContent();
      const text = content.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .toLowerCase();
      if (text.includes(q)) found.push(i);
    }
    setMatches(found);
    if (found.length) {
      setPage(found[0]);
      toast.success(`Found on ${found.length} page(s)`);
    } else toast.error("No matches");
  };

  if (!doc) {
    return (
      <FileUploader
        accept={{ "application/pdf": [".pdf"] }}
        onFiles={onFiles}
        label="Drop a PDF to view"
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[70vh]">
      <aside className="lg:w-36 shrink-0 max-h-[70vh] overflow-y-auto space-y-2 card-surface rounded-2xl p-2">
        {thumbs.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i + 1)}
            className={`block w-full rounded-lg overflow-hidden border-2 ${
              page === i + 1 ? "border-primary" : "border-transparent"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Page ${i + 1}`} className="w-full" />
          </button>
        ))}
        {doc.numPages > 40 && (
          <p className="text-[10px] text-center text-text-secondary px-1">
            Showing first 40 thumbs
          </p>
        )}
      </aside>

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 card-surface rounded-2xl p-2">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium tabular-nums px-2">
            {page} / {doc.numPages}
          </span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Next page"
            disabled={page >= doc.numPages}
            onClick={() => setPage((p) => Math.min(doc.numPages, p + 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="w-px h-6 bg-primary/20 mx-1" />
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom out"
            onClick={() => {
              setFit(null);
              setScale((s) => Math.max(0.4, s - 0.15));
            }}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom in"
            onClick={() => {
              setFit(null);
              setScale((s) => Math.min(3, s + 0.15));
            }}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFit("width")}>
            Fit width
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFit("page")}>
            <Maximize className="h-4 w-4" /> Fit page
          </Button>
          <div className="flex-1" />
          <div className="flex gap-1 items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search text…"
              className="h-9 w-36 sm:w-48"
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
            <Button size="icon" variant="secondary" onClick={search} aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await doc.cleanup();
              setDoc(null);
              setThumbs([]);
            }}
          >
            Close
          </Button>
        </div>

        {matches.length > 0 && (
          <p className="text-xs text-text-secondary">
            Matches on pages: {matches.join(", ")}
          </p>
        )}

        <div
          ref={containerRef}
          className="flex-1 overflow-auto card-surface rounded-2xl p-4 flex justify-center bg-orange-950/5 min-h-[50vh]"
        >
          <canvas ref={canvasRef} className="max-w-full shadow-soft rounded-lg bg-white" />
        </div>
      </div>
    </div>
  );
}
