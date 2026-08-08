"use client";

import type { CSSProperties } from "react";

const ACCENT = "#4F46E5";

const HANDLES: { pos: string; style: CSSProperties }[] = [
  { pos: "nw", style: { top: -6, left: -6, cursor: "nwse-resize" } },
  { pos: "n", style: { top: -6, left: "50%", marginLeft: -6, cursor: "ns-resize" } },
  { pos: "ne", style: { top: -6, right: -6, cursor: "nesw-resize" } },
  { pos: "w", style: { top: "50%", left: -6, marginTop: -6, cursor: "ew-resize" } },
  { pos: "e", style: { top: "50%", right: -6, marginTop: -6, cursor: "ew-resize" } },
  { pos: "sw", style: { bottom: -6, left: -6, cursor: "nesw-resize" } },
  { pos: "s", style: { bottom: -6, left: "50%", marginLeft: -6, cursor: "ns-resize" } },
  { pos: "se", style: { bottom: -6, right: -6, cursor: "nwse-resize" } },
];

const dot: CSSProperties = {
  position: "absolute",
  width: 12,
  height: 12,
  background: "#fff",
  border: `2px solid ${ACCENT}`,
  borderRadius: 2,
  boxSizing: "border-box",
  zIndex: 200,
  pointerEvents: "auto",
  touchAction: "none",
};

export function ResizeHandles() {
  return (
    <>
      {HANDLES.map((h) => (
        <div key={h.pos} data-handle={h.pos} style={{ ...dot, ...h.style }} />
      ))}

      <div
        style={{
          position: "absolute",
          top: -20,
          left: "50%",
          width: 1,
          height: 20,
          background: ACCENT,
          pointerEvents: "none",
        }}
      />
      <div
        data-handle="rotate"
        title="Rotate"
        style={{
          ...dot,
          top: -32,
          left: "50%",
          marginLeft: -6,
          borderRadius: "50%",
          cursor: "grab",
        }}
      />
    </>
  );
}
