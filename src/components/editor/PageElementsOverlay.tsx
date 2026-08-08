"use client";

import { useEffect, useRef, useState } from "react";
import { ElementRenderer } from "./ElementRenderer";
import { ToolInteractionLayer } from "./ToolInteractionLayer";
import { ensureNormalized } from "@/lib/coords";
import { useEditorStore } from "@/lib/editor-store";

type Props = {
  pageIndex: number;
  /** Disable when Edit Text is active (EditTextLayer owns interactions) */
  editTextActive: boolean;
};

export function PageElementsOverlay({ pageIndex, editTextActive }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pageEl, setPageEl] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  /** CSS px per PDF point — must match export (1 CSS px = 1 pt at zoom 1) */
  const [pageZoom, setPageZoom] = useState(1);

  const elements = useEditorStore((s) => s.elements);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectElement = useEditorStore((s) => s.selectElement);

  const pageElements = elements
    .filter((e) => e.pageIndex === pageIndex)
    .map((e) => ensureNormalized(e));

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    setPageEl(node);
    const measure = () => {
      const width = node.clientWidth;
      const height = node.clientHeight;
      setSize({ width, height });
      const shell = node.parentElement;
      const widthPt = Number(shell?.getAttribute("data-page-width-pt") || 0);
      if (widthPt > 0 && width > 0) {
        setPageZoom(width / widthPt);
      } else {
        setPageZoom(1);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const selectMode = !editTextActive && activeTool === "select";

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 z-[15] overflow-visible"
      style={{
        // Only the Select tool owns the page surface. Every other mode stays
        // click-through so the tool layer / hand tool / Edit Text can work.
        pointerEvents: selectMode ? "auto" : "none",
      }}
      onPointerDown={(e) => {
        if (selectMode && e.target === wrapRef.current) {
          selectElement(null);
        }
      }}
    >
      {pageElements.map((el) => (
        <ElementRenderer
          key={el.id}
          element={el}
          pageRef={wrapRef}
          interactive={selectMode}
          pageWidthPx={size.width}
          pageHeightPx={size.height}
          pageZoom={pageZoom}
        />
      ))}

      <ToolInteractionLayer
        pageIndex={pageIndex}
        pageEl={pageEl}
        enabled={!editTextActive}
      />
    </div>
  );
}
