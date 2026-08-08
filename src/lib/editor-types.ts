export type ToolType =
  | "hand"
  | "add-text"
  | "edit-text"
  | "highlight"
  | "pencil"
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "cross"
  | "check"
  | "sign"
  | "note"
  | "image"
  | "link"
  | "select";

export type ElementType =
  | "text"
  | "highlight"
  | "draw"
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "cross"
  | "check"
  | "signature"
  | "note"
  | "image"
  | "link";

export type PointNorm = { x: number; y: number };
/** @deprecated use PointNorm */
export type PointPct = PointNorm;

export type EditorElement = {
  id: string;
  type: ElementType;
  pageIndex: number;
  /** Fraction of page (0–1), top-left origin */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  data: Record<string, unknown>;
};

export type ToolOptions = {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  highlightColor: string;
  /** Background behind Add Text glyphs */
  textBackgroundColor: string;
  opacity: number;
};

export const DEFAULT_TOOL_OPTIONS: ToolOptions = {
  strokeColor: "#111827",
  fillColor: "transparent",
  strokeWidth: 2,
  fontSize: 14,
  fontFamily: "PDF-Inter",
  highlightColor: "#FDE047",
  textBackgroundColor: "transparent",
  opacity: 1,
};

export const HIGHLIGHT_SWATCHES = [
  "#FDE047",
  "#86EFAC",
  "#F9A8D4",
  "#93C5FD",
  "#FDBA74",
];

export function uid(prefix = "el"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Quadratic-bezier smoothed SVG path from normalized points (viewBox 0–1) */
export function smoothPath(points: PointNorm[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Same as smoothPath but points are scaled to page pixel dimensions */
export function smoothPathPixels(
  points: PointNorm[],
  pageWidthPx: number,
  pageHeightPx: number
): string {
  const w = Math.max(1, pageWidthPx);
  const h = Math.max(1, pageHeightPx);
  return smoothPath(points.map((p) => ({ x: p.x * w, y: p.y * h })));
}

export function toolCursor(tool: ToolType): string {
  switch (tool) {
    case "hand":
      return "grab";
    case "add-text":
    case "edit-text":
      return "text";
    case "highlight":
    case "pencil":
    case "rectangle":
    case "ellipse":
    case "line":
    case "arrow":
    case "link":
      return "crosshair";
    case "cross":
    case "check":
    case "note":
    case "image":
    case "sign":
      return "copy";
    default:
      return "default";
  }
}

/** Map legacy EditClient tool ids → ToolType */
export function normalizeTool(t: string): ToolType {
  const map: Record<string, ToolType> = {
    draw: "pencil",
    rect: "rectangle",
    circle: "ellipse",
  };
  return (map[t] || t) as ToolType;
}
