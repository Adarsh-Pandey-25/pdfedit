"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  boundsFromPoints,
  getNormalizedPoint,
  normToCssPercent,
} from "@/lib/coords";
import { useEditorStore } from "@/lib/editor-store";
import type { PointNorm, ToolType } from "@/lib/editor-types";
import { smoothPath, toolCursor } from "@/lib/editor-types";

type Props = {
  pageIndex: number;
  pageEl: HTMLElement | null;
  /** When true, this layer captures events for creation tools */
  enabled: boolean;
};

/**
 * Handles click/drag creation for all tools except edit-text / select / hand.
 */
export function ToolInteractionLayer({ pageIndex, pageEl, enabled }: Props) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const opts = useEditorStore((s) => s.toolOptions);
  const addElement = useEditorStore((s) => s.addElement);
  const pendingPlace = useEditorStore((s) => s.pendingPlace);
  const setPendingPlace = useEditorStore((s) => s.setPendingPlace);
  const setPendingLink = useEditorStore((s) => s.setPendingLink);
  const setTool = useEditorStore((s) => s.setTool);
  const setSignatureOpen = useEditorStore((s) => s.setSignatureOpen);

  const [draft, setDraft] = useState<{
    tool: ToolType;
    start: PointNorm;
    cur: PointNorm;
    points?: PointNorm[];
  } | null>(null);

  const drawing = useRef(false);

  const skip =
    !enabled ||
    activeTool === "edit-text" ||
    activeTool === "select" ||
    activeTool === "hand";

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (skip || !pageEl) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const p = getNormalizedPoint(e, pageEl);

      // Place pending image/signature
      if (pendingPlace && (activeTool === "image" || activeTool === "sign")) {
        const w = 0.3;
        const h = w / pendingPlace.aspectRatio;
        addElement({
          type: pendingPlace.type,
          pageIndex,
          x: p.x - w / 2,
          y: p.y - h / 2,
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          data: {
            imageData: pendingPlace.imageData,
            aspectRatio: pendingPlace.aspectRatio,
          },
        });
        setPendingPlace(null);
        setTool("select");
        return;
      }

      if (activeTool === "sign" && !pendingPlace) {
        setSignatureOpen(true);
        return;
      }

      if (activeTool === "image" && !pendingPlace) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          const dataUrl = await readFileAsDataUrl(file);
          const ar = await imageAspect(dataUrl);
          setPendingPlace({ type: "image", imageData: dataUrl, aspectRatio: ar });
          toast.success("Click on the page to place the image");
        };
        input.click();
        return;
      }

      // Click-to-place tools
      if (activeTool === "add-text") {
        // Compact box — text anchors at click (top-left), same as export canvas
        const fontSize = opts.fontSize || 14;
        addElement({
          type: "text",
          pageIndex,
          x: p.x,
          y: p.y,
          width: Math.min(0.35, Math.max(0.08, (fontSize * 8) / 800)),
          height: Math.min(0.08, Math.max(0.028, (fontSize * 1.4) / 800)),
          rotation: 0,
          opacity: 1,
          data: {
            text: "Type here…",
            fontSize,
            fontFamily: opts.fontFamily,
            color: opts.strokeColor,
            backgroundColor: opts.textBackgroundColor || "transparent",
            padding: 4,
            borderRadius: 4,
            bold: false,
            italic: false,
            editing: true,
          },
        });
        setTool("select");
        return;
      }

      if (activeTool === "cross" || activeTool === "check") {
        // Keep marks large enough to survive html2canvas capture.
        const size = 0.05;
        addElement({
          type: activeTool,
          pageIndex,
          x: p.x - size / 2,
          y: p.y - size / 2,
          width: size,
          height: size,
          rotation: 0,
          opacity: 1,
          data: {
            color: activeTool === "cross" ? "#FF0000" : "#10B981",
            strokeWidth: 3,
          },
        });
        setTool("select");
        return;
      }

      if (activeTool === "note") {
        const text = window.prompt("Sticky note:", "") ?? "";
        addElement({
          type: "note",
          pageIndex,
          x: p.x,
          y: p.y,
          width: 0.18,
          height: 0.14,
          rotation: 0,
          opacity: 1,
          data: { text, color: "#FFEB3B", icon: "📝" },
        });
        setTool("select");
        return;
      }

      // Drag tools
      drawing.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDraft({
        tool: activeTool,
        start: p,
        cur: p,
        points: activeTool === "pencil" ? [p] : undefined,
      });
    },
    [
      skip,
      pageEl,
      pendingPlace,
      activeTool,
      addElement,
      pageIndex,
      setPendingPlace,
      setPendingLink,
      setTool,
      setSignatureOpen,
      opts,
    ]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing.current || !draft || !pageEl) return;
      const p = getNormalizedPoint(e, pageEl);
      if (draft.tool === "pencil") {
        setDraft({
          ...draft,
          cur: p,
          points: [...(draft.points || []), p],
        });
      } else {
        setDraft({ ...draft, cur: p });
      }
    },
    [draft, pageEl]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing.current || !draft || !pageEl) return;
      drawing.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const { start, cur, tool, points } = draft;
      setDraft(null);

      const x = Math.min(start.x, cur.x);
      const y = Math.min(start.y, cur.y);
      const w = Math.max(0.005, Math.abs(cur.x - start.x));
      const h = Math.max(0.005, Math.abs(cur.y - start.y));

      if (tool === "highlight") {
        if (w < 0.005 && h < 0.005) return;
        addElement({
          type: "highlight",
          pageIndex,
          x,
          y,
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          data: { color: opts.highlightColor, opacity: 0.4 },
        });
      } else if (tool === "rectangle" || tool === "ellipse") {
        if (w < 0.004 || h < 0.004) return;
        addElement({
          type: tool,
          pageIndex,
          x,
          y,
          width: w,
          height: h,
          rotation: 0,
          opacity: opts.opacity,
          data: {
            strokeColor: opts.strokeColor,
            strokeWidth: opts.strokeWidth,
            fillColor: opts.fillColor,
            borderRadius: 0,
          },
        });
      } else if (tool === "line" || tool === "arrow") {
        if (w < 0.004 && h < 0.004) return;
        addElement({
          type: tool,
          pageIndex,
          // Real bounding box around the segment so it can be selected,
          // dragged and resized like any other element.
          ...boundsFromPoints([start, cur]),
          rotation: 0,
          opacity: 1,
          data: {
            x1: start.x,
            y1: start.y,
            x2: cur.x,
            y2: cur.y,
            strokeColor: opts.strokeColor,
            strokeWidth: opts.strokeWidth,
          },
        });
      } else if (tool === "link") {
        if (w < 0.005 || h < 0.005) return;
        // Open URL dialog — do not fall through to select until confirmed
        setPendingLink({ pageIndex, x, y, width: w, height: h });
        return;
      } else if (tool === "pencil" && points && points.length > 1) {
        const bounds = boundsFromPoints(points);
        addElement({
          type: "draw",
          pageIndex,
          ...bounds,
          rotation: 0,
          opacity: 1,
          data: {
            points,
            strokeColor: opts.strokeColor,
            strokeWidth: opts.strokeWidth,
            smooth: true,
          },
        });
      }

      setTool("select");
    },
    [draft, pageEl, addElement, pageIndex, opts, setTool, setPendingLink]
  );

  if (skip) return null;

  const preview = draft ? renderPreview(draft, opts) : null;

  return (
    <div
      className="absolute inset-0 z-[25]"
      style={{
        cursor: toolCursor(activeTool),
        touchAction: "none",
        pointerEvents: "auto",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {preview}
      {pendingPlace && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
          Click to place {pendingPlace.type}
        </div>
      )}
    </div>
  );
}

function renderPreview(
  draft: {
    tool: ToolType;
    start: PointNorm;
    cur: PointNorm;
    points?: PointNorm[];
  },
  opts: { strokeColor: string; highlightColor: string; strokeWidth: number; fillColor: string }
) {
  const x = Math.min(draft.start.x, draft.cur.x);
  const y = Math.min(draft.start.y, draft.cur.y);
  const w = Math.abs(draft.cur.x - draft.start.x);
  const h = Math.abs(draft.cur.y - draft.start.y);

  if (draft.tool === "highlight") {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: normToCssPercent(x),
          top: normToCssPercent(y),
          width: normToCssPercent(w),
          height: normToCssPercent(h),
          background: opts.highlightColor,
          opacity: 0.4,
          mixBlendMode: "multiply",
        }}
      />
    );
  }
  if (draft.tool === "rectangle" || draft.tool === "ellipse" || draft.tool === "link") {
    return (
      <div
        className="absolute pointer-events-none border-2 border-dashed"
        style={{
          left: normToCssPercent(x),
          top: normToCssPercent(y),
          width: normToCssPercent(w),
          height: normToCssPercent(h),
          borderColor: draft.tool === "link" ? "#38bdf8" : opts.strokeColor,
          borderRadius: draft.tool === "ellipse" ? "50%" : 0,
        }}
      />
    );
  }
  if (draft.tool === "line" || draft.tool === "arrow") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1 1" preserveAspectRatio="none">
        <line
          x1={draft.start.x}
          y1={draft.start.y}
          x2={draft.cur.x}
          y2={draft.cur.y}
          stroke={opts.strokeColor}
          strokeWidth={opts.strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  if (draft.tool === "pencil" && draft.points) {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1 1" preserveAspectRatio="none">
        <path
          d={smoothPath(draft.points)}
          fill="none"
          stroke={opts.strokeColor}
          strokeWidth={opts.strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
  return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function imageAspect(src: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width / Math.max(1, img.height));
    img.onerror = () => resolve(1);
    img.src = src;
  });
}
