"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
  active: boolean;
};

/** Pan the scroll container when Hand tool is active */
export function useHandTool({ containerRef, active }: Props) {
  const start = useRef<{ x: number; y: number; sl: number; st: number } | null>(
    null
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !active) return;

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      start.current = {
        x: e.clientX,
        y: e.clientY,
        sl: el.scrollLeft,
        st: el.scrollTop,
      };
      el.style.cursor = "grabbing";
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!start.current) return;
      el.scrollLeft = start.current.sl - (e.clientX - start.current.x);
      el.scrollTop = start.current.st - (e.clientY - start.current.y);
    };
    const up = () => {
      start.current = null;
      el.style.cursor = "grab";
    };

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.style.cursor = "";
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [containerRef, active]);
}

export function HandToolBridge({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const tool = useEditorStore((s) => s.activeTool);
  useHandTool({ containerRef, active: tool === "hand" });
  return null;
}
