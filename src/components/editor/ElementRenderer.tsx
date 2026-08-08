"use client";

import type { CSSProperties, RefObject } from "react";
import { fullPageSvgStyle, pageStrokeSvgStyle, resolveFontSizePt } from "@/lib/coords";
import { useEditorStore } from "@/lib/editor-store";
import type { EditorElement, PointNorm } from "@/lib/editor-types";
import { smoothPathPixels } from "@/lib/editor-types";
import { InteractiveElement } from "./InteractiveElement";

type Props = {
  element: EditorElement;
  pageRef: RefObject<HTMLDivElement | null>;
  interactive: boolean;
  pageWidthPx: number;
  pageHeightPx: number;
  /** CSS pixels per PDF point (editor zoom). Export uses 1. */
  pageZoom?: number;
};

/** Content never takes pointer events — InteractiveElement owns all of them. */
const fill: CSSProperties = {
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  userSelect: "none",
};

export function ElementRenderer({
  element: el,
  pageRef,
  interactive,
  pageWidthPx,
  pageHeightPx,
  pageZoom = 1,
}: Props) {
  const updateElementData = useEditorStore((s) => s.updateElementData);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const isEditingText = el.type === "text" && Boolean(el.data.editing);

  const handleDoubleClick = () => {
    if (!interactive) return;
    if (el.type === "text") {
      pushHistory();
      updateElementData(el.id, { editing: true });
      return;
    }
    if (el.type === "note") {
      const next = window.prompt("Edit note:", (el.data.text as string) || "");
      if (next != null) {
        pushHistory();
        updateElementData(el.id, { text: next });
      }
      return;
    }
    if (el.type === "link") {
      const setPendingLink = useEditorStore.getState().setPendingLink;
      setPendingLink({
        pageIndex: el.pageIndex,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        editId: el.id,
        initialUrl: (el.data.url as string) || "https://",
      });
    }
  };

  return (
    <InteractiveElement
      element={el}
      pageRef={pageRef}
      interactive={interactive}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent(el, {
        isEditingText,
        pageWidthPx,
        pageHeightPx,
        pageZoom: pageZoom || 1,
        onCommitText: (text) => {
          pushHistory();
          updateElementData(el.id, { text, editing: false });
        },
      })}
    </InteractiveElement>
  );
}

type ContentCtx = {
  isEditingText: boolean;
  pageWidthPx: number;
  pageHeightPx: number;
  pageZoom: number;
  onCommitText: (text: string) => void;
};

function renderContent(el: EditorElement, ctx: ContentCtx) {
  const d = el.data;

  switch (el.type) {
    case "text": {
      const fontSizePt = resolveFontSizePt(d);
      // Scale with page zoom so editor matches export (1 CSS px = 1 PDF pt at zoom 1)
      const fontSize = fontSizePt * ctx.pageZoom;
      const fontFamily = `'${(d.fontFamily as string) || "PDF-Inter"}', sans-serif`;
      const bgRaw =
        (d.backgroundColor as string) ||
        (d.bgColor as string) ||
        "transparent";
      const hasBg =
        !!bgRaw &&
        bgRaw !== "transparent" &&
        bgRaw !== "none" &&
        bgRaw !== "rgba(0,0,0,0)";
      const padding = Number(d.padding ?? 4) * ctx.pageZoom;
      const borderRadius = Number(d.borderRadius ?? (hasBg ? 4 : 0)) * ctx.pageZoom;

      if (ctx.isEditingText) {
        return (
          <textarea
            data-no-drag
            autoFocus
            defaultValue={(d.text as string) || ""}
            spellCheck={false}
            style={{
              width: "100%",
              height: "100%",
              resize: "none",
              border: "none",
              outline: "none",
              background: hasBg ? bgRaw : "rgba(255,255,255,0.92)",
              padding: hasBg ? `${padding}px ${padding * 1.5}px` : 0,
              margin: 0,
              borderRadius,
              pointerEvents: "auto",
              fontSize,
              fontFamily,
              color: (d.color as string) || "#000",
              fontWeight: d.bold ? 700 : 400,
              fontStyle: d.italic ? "italic" : "normal",
              lineHeight: 1.15,
              textDecoration: "none",
              textDecorationLine: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => ctx.onCommitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") e.currentTarget.blur();
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          />
        );
      }

      // Exact top-left of element box = where user placed text (no ascent hack)
      return (
        <div
          style={{
            ...fill,
            overflow: "visible",
            display: "block",
            position: "relative",
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize,
              fontWeight: d.bold ? 700 : 400,
              fontStyle: d.italic ? "italic" : "normal",
              color: (d.color as string) || "#000",
              lineHeight: 1.15,
              margin: 0,
              padding: hasBg ? `${padding}px ${padding * 1.5}px` : 0,
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              display: "inline-block",
              position: "absolute",
              top: 0,
              left: 0,
              maxWidth: "100%",
              background: hasBg ? bgRaw : "transparent",
              borderRadius: hasBg ? borderRadius : 0,
              boxSizing: "border-box",
              textDecoration: "none",
              WebkitFontSmoothing: "antialiased",
              textRendering: "geometricPrecision",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {(d.text as string) || ""}
          </div>
        </div>
      );
    }

    case "highlight":
      return (
        <div
          style={{
            ...fill,
            background: (d.color as string) || "#FDE047",
            opacity: (d.opacity as number) ?? 0.4,
            // Blend the content only, so the selection outline stays readable.
            mixBlendMode: "multiply",
          }}
        />
      );

    case "rectangle":
      return (
        <div
          style={{
            ...fill,
            border: `${(d.strokeWidth as number) ?? 2}px solid ${(d.strokeColor as string) || "#111"}`,
            background:
              d.fillColor && d.fillColor !== "transparent"
                ? (d.fillColor as string)
                : "transparent",
            borderRadius: (d.borderRadius as number) || 0,
            boxSizing: "border-box",
          }}
        />
      );

    case "ellipse":
      return (
        <div
          style={{
            ...fill,
            border: `${(d.strokeWidth as number) ?? 2}px solid ${(d.strokeColor as string) || "#111"}`,
            background:
              d.fillColor && d.fillColor !== "transparent"
                ? (d.fillColor as string)
                : "transparent",
            borderRadius: "50%",
            boxSizing: "border-box",
          }}
        />
      );

    case "line":
    case "arrow": {
      const color = (d.strokeColor as string) || "#111";
      const sw = (d.strokeWidth as number) ?? 2;
      const x1 = d.x1 as number;
      const y1 = d.y1 as number;
      const x2 = d.x2 as number;
      const y2 = d.y2 as number;
      const head =
        el.type === "arrow"
          ? arrowHead(
              { x1, y1, x2, y2 },
              sw,
              ctx.pageWidthPx,
              ctx.pageHeightPx
            )
          : null;

      return (
        <svg
          style={fullPageSvgStyle(el)}
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
        >
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {head?.map((seg, i) => (
            <line
              key={i}
              x1={x2}
              y1={y2}
              x2={seg.x}
              y2={seg.y}
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      );
    }

    case "draw": {
      const points = (d.points as PointNorm[]) || [];
      const pw = Math.max(1, ctx.pageWidthPx);
      const ph = Math.max(1, ctx.pageHeightPx);
      const sw = (d.strokeWidth as number) ?? 2;
      return (
        <svg
          data-page-stroke="draw"
          data-element-type="draw"
          data-page-width={pw}
          data-page-height={ph}
          width={pw}
          height={ph}
          viewBox={`0 0 ${pw} ${ph}`}
          style={pageStrokeSvgStyle(el, pw, ph)}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={smoothPathPixels(points, pw, ph)}
            fill="none"
            stroke={(d.strokeColor as string) || "#111"}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    case "cross": {
      const color = (d.color as string) || "#EF4444";
      const size = Math.max(
        8,
        Math.min(ctx.pageWidthPx * el.width, ctx.pageHeightPx * el.height)
      );
      return (
        <div
          style={{
            ...fill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
            fontFamily:
              "'Segoe UI Symbol', 'Arial Unicode MS', Arial, sans-serif",
            fontSize: size * 1.3,
            color,
            fontWeight: 900,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          ✗
        </div>
      );
    }

    case "check": {
      const color = (d.color as string) || "#10B981";
      const size = Math.max(
        8,
        Math.min(ctx.pageWidthPx * el.width, ctx.pageHeightPx * el.height)
      );
      return (
        <div
          style={{
            ...fill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
            fontFamily:
              "'Segoe UI Symbol', 'Arial Unicode MS', Arial, sans-serif",
            fontSize: size * 1.3,
            color,
            fontWeight: 900,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          ✓
        </div>
      );
    }

    case "signature":
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={(d.imageData as string) || ""}
          alt=""
          draggable={false}
          style={{ ...fill, objectFit: "contain", display: "block" }}
        />
      );

    case "note":
      return (
        <div
          style={{
            ...fill,
            background: (d.color as string) || "#FFEB3B",
            border: "1px solid #F59E0B",
            borderRadius: 4,
            padding: 6,
            fontSize: 11,
            lineHeight: 1.25,
            color: "#1f2937",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
          title={(d.text as string) || ""}
        >
          <span style={{ fontWeight: 700 }}>📝 </span>
          {(d.text as string) || "Note"}
        </div>
      );

    case "link": {
      const url = String(d.url || "");
      return (
        <div
          style={{
            ...fill,
            border: "1.5px dashed #2563EB",
            background: "rgba(37,99,235,0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "center",
            gap: 2,
            fontSize: 10,
            color: "#1D4ED8",
            overflow: "hidden",
            boxSizing: "border-box",
            textDecoration: "none",
            padding: "2px 4px",
          }}
          title={url ? `${url} — double-click to edit` : "Double-click to edit URL"}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              minWidth: 0,
            }}
          >
            <span aria-hidden>🔗</span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              {url || "Set URL…"}
            </span>
          </div>
          {url ? (
            <a
              data-no-drag
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                fontSize: 9,
                color: "#1D4ED8",
                textDecoration: "underline",
                width: "fit-content",
              }}
            >
              Open link
            </a>
          ) : null}
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * Arrowhead segments in page-normalized space. The angle is measured in screen
 * pixels so the head stays symmetric even though x and y have different scales.
 */
function arrowHead(
  line: { x1: number; y1: number; x2: number; y2: number },
  strokeWidth: number,
  pageWidthPx: number,
  pageHeightPx: number
): PointNorm[] {
  const w = pageWidthPx || 1;
  const h = pageHeightPx || 1;
  const angle = Math.atan2((line.y2 - line.y1) * h, (line.x2 - line.x1) * w);
  const size = Math.max(8, strokeWidth * 4);
  const spread = Math.PI / 6;

  return [angle - spread, angle + spread].map((a) => ({
    x: line.x2 - (size * Math.cos(a)) / w,
    y: line.y2 - (size * Math.sin(a)) / h,
  }));
}
