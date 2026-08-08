"use client";

import { useCallback, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import { MIN_ELEMENT_SIZE } from "@/lib/coords";
import { useEditorStore } from "@/lib/editor-store";
import type { EditorElement } from "@/lib/editor-types";
import { ResizeHandles } from "./ResizeHandles";

type DragState = {
  mode: "move" | "resize" | "rotate" | null;
  handle: string;
  startX: number;
  startY: number;
  startElX: number;
  startElY: number;
  startElW: number;
  startElH: number;
  historyPushed: boolean;
  moved: boolean;
};

const IDLE: DragState = {
  mode: null,
  handle: "",
  startX: 0,
  startY: 0,
  startElX: 0,
  startElY: 0,
  startElW: 0,
  startElH: 0,
  historyPushed: false,
  moved: false,
};

type Props = {
  element: EditorElement;
  pageRef: RefObject<HTMLDivElement | null>;
  /** False while a creation tool owns the page — wrapper stays click-through */
  interactive: boolean;
  children: ReactNode;
  onDoubleClick?: () => void;
  /** Extra styles merged into the wrapper box */
  style?: CSSProperties;
};

/**
 * Single wrapper used by every element type. Owns selection, move, resize and
 * rotate so all tools behave identically after creation.
 */
export function InteractiveElement({
  element,
  pageRef,
  interactive,
  children,
  onDoubleClick,
  style,
}: Props) {
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const isSelected = selectedId === element.id;
  const elRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({ ...IDLE });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive || e.button !== 0) return;

      const target = e.target as HTMLElement;
      // Text editors and other inline controls opt out of dragging.
      if (target.closest("[data-no-drag]")) {
        selectElement(element.id);
        return;
      }

      e.stopPropagation();
      selectElement(element.id);

      const handle = target.dataset.handle || "";
      drag.current = {
        mode: handle === "rotate" ? "rotate" : handle ? "resize" : "move",
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startElX: element.x,
        startElY: element.y,
        startElW: element.width,
        startElH: element.height,
        historyPushed: false,
        moved: false,
      };

      elRef.current?.setPointerCapture(e.pointerId);
    },
    [interactive, element, selectElement]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      const page = pageRef.current;
      if (!d.mode || !page) return;

      const rect = page.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dx = (e.clientX - d.startX) / rect.width;
      const dy = (e.clientY - d.startY) / rect.height;

      // Ignore sub-pixel jitter so a plain click never writes history.
      if (!d.moved) {
        if (Math.abs(e.clientX - d.startX) < 2 && Math.abs(e.clientY - d.startY) < 2) {
          return;
        }
        d.moved = true;
      }
      if (!d.historyPushed) {
        pushHistory();
        d.historyPushed = true;
      }

      if (d.mode === "move") {
        updateElement(element.id, {
          x: Math.max(0, Math.min(1 - d.startElW, d.startElX + dx)),
          y: Math.max(0, Math.min(1 - d.startElH, d.startElY + dy)),
        });
        return;
      }

      if (d.mode === "rotate") {
        const cx = rect.left + (d.startElX + d.startElW / 2) * rect.width;
        const cy = rect.top + (d.startElY + d.startElH / 2) * rect.height;
        const angle =
          (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
        updateElement(element.id, {
          rotation: e.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle),
        });
        return;
      }

      const h = d.handle;
      const patch: Partial<EditorElement> = {};

      if (h.includes("e")) {
        patch.width = Math.max(MIN_ELEMENT_SIZE, d.startElW + dx);
      }
      if (h.includes("w")) {
        const width = Math.max(MIN_ELEMENT_SIZE, d.startElW - dx);
        patch.width = width;
        patch.x = d.startElX + (d.startElW - width);
      }
      if (h.includes("s")) {
        patch.height = Math.max(MIN_ELEMENT_SIZE, d.startElH + dy);
      }
      if (h.includes("n")) {
        const height = Math.max(MIN_ELEMENT_SIZE, d.startElH - dy);
        patch.height = height;
        patch.y = d.startElY + (d.startElH - height);
      }

      const lockAspect =
        e.shiftKey || element.type === "image" || element.type === "signature";
      if (lockAspect && d.startElH > 1e-6) {
        const aspect = d.startElW / d.startElH;
        if (patch.width !== undefined && h !== "n" && h !== "s") {
          patch.height = patch.width / aspect;
          if (patch.y !== undefined) {
            patch.y = d.startElY + (d.startElH - patch.height);
          }
        } else if (patch.height !== undefined) {
          patch.width = patch.height * aspect;
          if (patch.x !== undefined) {
            patch.x = d.startElX + (d.startElW - patch.width);
          }
        }
      }

      updateElement(element.id, patch);
    },
    [element.id, element.type, pageRef, pushHistory, updateElement]
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (!drag.current.mode) return;
    drag.current = { ...IDLE };
    try {
      elRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  const box: CSSProperties = {
    position: "absolute",
    left: `${element.x * 100}%`,
    top: `${element.y * 100}%`,
    width: `${element.width * 100}%`,
    height: `${element.height * 100}%`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: "center center",
    opacity: element.opacity ?? 1,
    cursor: interactive ? "move" : "default",
    outline: isSelected ? "2px solid #4F46E5" : "none",
    outlineOffset: 2,
    pointerEvents: interactive ? "auto" : "none",
    touchAction: "none",
    userSelect: "none",
    overflow: "visible",
    zIndex: isSelected ? 100 : 10,
    ...style,
  };

  return (
    <div
      ref={elRef}
      className="editor-element"
      data-element-id={element.id}
      data-element-type={element.type}
      style={box}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
    >
      {children}
      {isSelected && interactive && <ResizeHandles />}
    </div>
  );
}
