"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { renderPageToCanvas, getDisplayPixelRatio, type PdfDoc } from "@/lib/pdf/pdfjs";
import { cn } from "@/lib/utils";
import type { SignaturePlacement } from "@/lib/pdf/signature-engine";

const RENDER_SCALE = 1.4;
const MIN_WIDTH_RATIO = 0.04;

type Interaction = {
  type: "move" | "resize";
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
  rectWidth: number;
  rectHeight: number;
};

type PlacementLayerProps = {
  doc: PdfDoc;
  pageNumber: number;
  placements: SignaturePlacement[];
  selectedId: string | null;
  canPlace: boolean;
  onSelect: (id: string | null) => void;
  onAdd: (xRatio: number, yRatio: number) => void;
  onUpdate: (id: string, patch: Partial<SignaturePlacement>) => void;
  onRemove: (id: string) => void;
};

export function PlacementLayer({
  doc,
  pageNumber,
  placements,
  selectedId,
  canPlace,
  onSelect,
  onAdd,
  onUpdate,
  onRemove,
}: PlacementLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<Interaction | null>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        await renderPageToCanvas(doc, pageNumber, RENDER_SCALE, canvas, {
          pixelRatio: getDisplayPixelRatio(),
        });
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber]);

  const beginInteraction = useCallback(
    (
      e: React.PointerEvent<HTMLElement>,
      type: Interaction["type"],
      placement: SignaturePlacement
    ) => {
      const frame = frameRef.current;
      if (!frame) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = frame.getBoundingClientRect();
      interaction.current = {
        type,
        id: placement.id,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: placement.xRatio,
        originY: placement.yRatio,
        originWidth: placement.widthRatio,
        originHeight: placement.heightRatio,
        rectWidth: rect.width,
        rectHeight: rect.height,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      onSelect(placement.id);
    },
    [onSelect]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const state = interaction.current;
      if (!state || state.pointerId !== e.pointerId) return;
      const dx = (e.clientX - state.startX) / state.rectWidth;
      const dy = (e.clientY - state.startY) / state.rectHeight;

      if (state.type === "move") {
        onUpdate(state.id, {
          xRatio: clamp01(state.originX + dx, state.originWidth),
          yRatio: clamp01(state.originY + dy, state.originHeight),
        });
        return;
      }

      const widthRatio = Math.max(
        MIN_WIDTH_RATIO,
        Math.min(1 - state.originX, state.originWidth + dx)
      );
      // Keep the aspect the bitmap was captured at.
      const heightRatio =
        (state.originHeight / state.originWidth) * widthRatio;
      if (state.originY + heightRatio > 1) return;
      onUpdate(state.id, { widthRatio, heightRatio });
    },
    [onUpdate]
  );

  const endInteraction = useCallback(() => {
    interaction.current = null;
  }, []);

  const onFrameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canPlace) {
      onSelect(null);
      return;
    }
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    onAdd((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  };

  return (
    <div className="flex justify-center">
      <div
        ref={frameRef}
        onClick={onFrameClick}
        className={cn(
          "relative inline-block max-w-full",
          canPlace ? "cursor-crosshair" : "cursor-default"
        )}
      >
        <canvas
          ref={canvasRef}
          className="block max-h-[70vh] max-w-full rounded-xl bg-white shadow-soft"
        />

        {rendering && (
          <div className="absolute inset-0 animate-pulse rounded-xl bg-black/5" />
        )}

        {placements.map((placement) => {
          const selected = placement.id === selectedId;
          return (
            <div
              key={placement.id}
              onPointerDown={(e) => beginInteraction(e, "move", placement)}
              onPointerMove={onPointerMove}
              onPointerUp={endInteraction}
              onPointerCancel={endInteraction}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "absolute touch-none",
                selected
                  ? "cursor-move ring-2 ring-primary"
                  : "cursor-move ring-1 ring-primary/30 hover:ring-primary/60"
              )}
              style={{
                left: `${placement.xRatio * 100}%`,
                top: `${placement.yRatio * 100}%`,
                width: `${placement.widthRatio * 100}%`,
                height: `${placement.heightRatio * 100}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={placement.asset.dataUrl}
                alt="Placed signature"
                draggable={false}
                className="pointer-events-none h-full w-full select-none object-fill"
              />

              {selected && (
                <>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(placement.id);
                    }}
                    aria-label="Remove signature"
                    className="absolute -right-2.5 -top-2.5 rounded-full bg-secondary p-1 text-white shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span
                    onPointerDown={(e) => beginInteraction(e, "resize", placement)}
                    onPointerMove={onPointerMove}
                    onPointerUp={endInteraction}
                    onPointerCancel={endInteraction}
                    role="presentation"
                    className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-white bg-primary shadow"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function clamp01(value: number, size: number): number {
  return Math.min(Math.max(value, 0), Math.max(0, 1 - size));
}
