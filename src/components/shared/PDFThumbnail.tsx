"use client";

import { useEffect, useState } from "react";
import { loadPdfDocument, renderPageThumbnail } from "@/lib/pdf/pdfjs";
import { cn } from "@/lib/utils";

type PDFThumbnailProps = {
  data: ArrayBuffer | Uint8Array;
  pageNumber?: number;
  className?: string;
  alt?: string;
  maxWidth?: number;
};

export function PDFThumbnail({
  data,
  pageNumber = 1,
  className,
  alt = `Page ${pageNumber}`,
  maxWidth = 160,
}: PDFThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await loadPdfDocument(data);
        const url = await renderPageThumbnail(doc, pageNumber, maxWidth);
        if (!cancelled) setSrc(url);
        await doc.cleanup();
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, pageNumber, maxWidth]);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-primary/10 text-xs text-text-secondary aspect-[3/4]",
          className
        )}
      >
        Preview N/A
      </div>
    );
  }

  if (!src) {
    return <div className={cn("skeleton aspect-[3/4] w-full", className)} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("rounded-lg object-contain bg-white shadow-sm w-full", className)}
      loading="lazy"
    />
  );
}
