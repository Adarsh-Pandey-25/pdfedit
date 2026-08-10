"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  samplePatchColor,
  type EditableTextItem,
} from "@/lib/pdf/text-extraction";
import { sampleTextColorFromCanvas } from "@/lib/pdf/canvas-color-sampler";
import {
  canvasZoom,
  exactTextStyle,
  pdfItemToCssBox,
  resolveItemFontMatch,
} from "@/lib/pdf/pdf-coordinates";
import {
  adjustedFontSize,
  fontDebugLabel,
} from "@/lib/pdf/font-matcher";

type EditTextLayerProps = {
  items: EditableTextItem[];
  pageIndex: number;
  canvas: HTMLCanvasElement | null;
  active: boolean;
  toolbarSelector?: string;
  debugPatches?: boolean;
  onCommitItem: (item: EditableTextItem) => void;
  onRevertItem: (id: string) => void;
  onPushHistory: () => void;
  onSelectId?: (id: string | null) => void;
  searchMatches?: { id: string; current: boolean }[];
  /** Whiteout region on display canvas before HTML editor appears */
  onWhiteoutForEdit?: (item: EditableTextItem, patchColor: string) => void;
  /** Bake final text onto display canvas; remove HTML overlay after */
  onBakeCommit?: (item: EditableTextItem) => void;
  /** Restore canvas after cancel / revert-to-original */
  onRestoreCanvas?: (itemId: string) => void;
};

type EditSession = {
  itemId: string;
  patchColor: string;
  /** Sampled glyph ink — preserves gray/blue when operator list said black */
  inkColor: string;
  /** item.color when edit began (to detect toolbar color changes) */
  colorAtStart: string;
  clickX: number;
  clickY: number;
  initialText: string;
};

/**
 * Hybrid editor: HTML contentEditable ONLY while typing.
 * On commit, text is baked into the PDF display canvas (same pipeline as PDF.js).
 */
export function EditTextLayer({
  items,
  pageIndex,
  canvas,
  active,
  toolbarSelector = "[data-text-toolbar]",
  debugPatches = false,
  onCommitItem,
  onRevertItem,
  onPushHistory,
  onSelectId,
  searchMatches = [],
  onWhiteoutForEdit,
  onBakeCommit,
  onRestoreCanvas,
}: EditTextLayerProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [session, setSession] = useState<EditSession | null>(null);
  const [liveEditWidthPx, setLiveEditWidthPx] = useState<number | undefined>();

  const editingItemIdRef = useRef<string | null>(null);
  const sessionRef = useRef<EditSession | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef(items);

  editingItemIdRef.current = editingItemId;
  sessionRef.current = session;
  itemsRef.current = items;

  const pageItems = items.filter(
    (i) => i.pageIndex === pageIndex && !i.isDeleted
  );

  const zoomFor = useCallback(
    (item: EditableTextItem) => canvasZoom(canvas, item.pageWidthPdf || 1),
    [canvas]
  );

  const estimateTextWidthPx = useCallback(
    (item: EditableTextItem, text: string, zoom: number) => {
      const match = resolveItemFontMatch(item);
      const size =
        adjustedFontSize(
          item.originalPdfFontSize || item.pdfFontSize,
          match.webFamily
        ) * zoom;
      if (typeof document === "undefined") {
        return Math.max(item.originalPdfWidth || item.pdfWidth, 1) * zoom;
      }
      const canvasEl = document.createElement("canvas");
      const ctx = canvasEl.getContext("2d");
      if (!ctx) return size * Math.max(text.length, 1) * 0.55;
      ctx.font = `${item.isItalic ? "italic " : ""}${item.isBold ? "700 " : "400 "} ${size}px "${match.webFamily}"`;
      return ctx.measureText(text || " ").width;
    },
    []
  );

  const commitEdit = useCallback(() => {
    if (editingItemIdRef.current === null) return;
    const id = editingItemIdRef.current;
    const sess = sessionRef.current;
    const item = itemsRef.current.find((t) => t.id === id);
    const editor = editorRef.current;

    const newText = (editor?.innerText ?? sess?.initialText ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/\n$/g, "")
      .trim();

    editingItemIdRef.current = null;
    sessionRef.current = null;
    setEditingItemId(null);
    setSession(null);
    setLiveEditWidthPx(undefined);
    onSelectId?.(null);

    if (!item || !sess) return;

    if (newText === item.originalText) {
      if (item.isEdited) {
        onPushHistory();
        onRevertItem(id);
        onRestoreCanvas?.(id);
      } else {
        // Cancelled whiteout — restore baked state
        onRestoreCanvas?.(id);
      }
      return;
    }

    const userChangedColor =
      item.color !== sess.colorAtStart && item.color !== sess.inkColor;
    const committed: EditableTextItem = {
      ...item,
      currentText: newText,
      color: userChangedColor ? item.color : sess.inkColor || item.color,
      patchColor: sess.patchColor,
      backgroundColor: sess.patchColor,
      isEdited: true,
      isDeleted: false,
      originalPdfX: item.originalPdfX ?? item.pdfX,
      originalPdfY: item.originalPdfY ?? item.pdfY,
      originalPdfWidth: item.originalPdfWidth ?? item.pdfWidth,
      originalPdfHeight: item.originalPdfHeight ?? item.pdfFontSize,
      originalPdfFontSize: item.originalPdfFontSize ?? item.pdfFontSize,
    };

    onPushHistory();
    onBakeCommit?.(committed);
    onCommitItem(committed);
  }, [
    onCommitItem,
    onRevertItem,
    onPushHistory,
    onSelectId,
    onBakeCommit,
    onRestoreCanvas,
  ]);

  const cancelEdit = useCallback(() => {
    if (editingItemIdRef.current === null) return;
    const id = editingItemIdRef.current;
    editingItemIdRef.current = null;
    sessionRef.current = null;
    setEditingItemId(null);
    setSession(null);
    setLiveEditWidthPx(undefined);
    onSelectId?.(null);
    onRestoreCanvas?.(id);
  }, [onSelectId, onRestoreCanvas]);

  const measureLiveWidth = useCallback(
    (item: EditableTextItem) => {
      const el = editorRef.current;
      const text = (el?.innerText ?? "").replace(/\u00a0/g, " ").replace(/\n$/g, "");
      const zoom = zoomFor(item);
      setLiveEditWidthPx(estimateTextWidthPx(item, text || " ", zoom));
    },
    [zoomFor, estimateTextWidthPx]
  );

  const beginEdit = useCallback(
    (item: EditableTextItem, e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!active || item.isRotated) return;

      if (editingItemIdRef.current && editingItemIdRef.current !== item.id) {
        commitEdit();
      }

      const zoom = zoomFor(item);
      const box = pdfItemToCssBox(item, zoom);
      let patchColor = "rgb(255,255,255)";
      let inkColor = item.color || "#000000";
      if (canvas) {
        try {
          patchColor = samplePatchColor(canvas, box);
        } catch {
          patchColor = "rgb(255,255,255)";
        }
        try {
          const dpr =
            canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;
          const sampled = sampleTextColorFromCanvas(canvas, box, dpr);
          if (sampled) inkColor = sampled;
        } catch {
          /* keep item.color */
        }
      }

      const sess: EditSession = {
        itemId: item.id,
        patchColor,
        inkColor,
        colorAtStart: item.color || "#000000",
        clickX: e.clientX,
        clickY: e.clientY,
        initialText: item.currentText,
      };

      // Cover original on canvas BEFORE HTML editor shows
      onWhiteoutForEdit?.(item, patchColor);

      editingItemIdRef.current = item.id;
      sessionRef.current = sess;
      setSession(sess);
      setEditingItemId(item.id);
      onSelectId?.(item.id);
    },
    [active, canvas, zoomFor, commitEdit, onSelectId, onWhiteoutForEdit]
  );

  useLayoutEffect(() => {
    if (!editingItemId || !session) return;
    const el = editorRef.current;
    if (!el) return;
    el.textContent = session.initialText;
    el.setAttribute("spellcheck", "false");
    el.setAttribute("autocorrect", "off");
    el.setAttribute("autocapitalize", "off");
    el.focus();
    placeCaret(el, session.clickX, session.clickY);
    const item = itemsRef.current.find((t) => t.id === editingItemId);
    if (item) {
      const zoom = zoomFor(item);
      setLiveEditWidthPx(
        estimateTextWidthPx(item, session.initialText || " ", zoom)
      );
    }
  }, [editingItemId, session, zoomFor, estimateTextWidthPx]);

  useEffect(() => {
    if (!editingItemId) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest?.("[data-edit-editor]")) return;
      if (toolbarSelector && t.closest?.(toolbarSelector)) return;
      commitEdit();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [editingItemId, commitEdit, toolbarSelector]);

  useEffect(() => {
    return () => {
      if (editingItemIdRef.current !== null) commitEdit();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, canvas?.width, canvas?.height]);

  useEffect(() => {
    if (!active && editingItemIdRef.current !== null) commitEdit();
  }, [active, commitEdit]);

  if (!active && !pageItems.some((i) => i.isEdited) && !searchMatches.length) {
    return null;
  }

  const editingItem = editingItemId
    ? pageItems.find((i) => i.id === editingItemId)
    : null;

  return (
    <div
      className="pdf-page-overlay absolute inset-0 z-20"
      style={{ pointerEvents: active ? "auto" : "none" }}
    >
      <style>{`
        .pdf-text-hitbox {
          position: absolute;
          margin: 0; padding: 0; border: none;
          background: transparent; box-shadow: none;
          cursor: text; z-index: 5;
        }
        .pdf-text-hitbox:hover, .pdf-text-hitbox:focus {
          background: transparent; outline: none; border: none; box-shadow: none;
        }
        .pdf-text-editor {
          caret-color: #4F46E5;
        }
        .pdf-text-editor:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {pageItems.map((item) => {
        const match = searchMatches.find((m) => m.id === item.id);
        const zoom = zoomFor(item);
        const box = pdfItemToCssBox(item, zoom);
        const isEditing = editingItemId === item.id;
        const isCommittedEdit =
          item.isEdited && item.currentText !== item.originalText;

        return (
          <div key={item.id} className="contents">
            {debugPatches && isCommittedEdit && (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: box.left,
                  top: box.top,
                  width: Math.max(
                    estimateTextWidthPx(item, item.currentText, zoom),
                    box.width
                  ),
                  height: box.height * 1.5,
                  boxShadow: "inset 0 0 0 2px rgba(239,68,68,0.85)",
                  zIndex: 12,
                }}
                title="baked canvas region"
              />
            )}

            {debugPatches &&
              (isCommittedEdit || isEditing) && (
                <div
                  className="pdf-font-debug"
                  style={{
                    left: box.left,
                    top: Math.max(0, box.top - 14),
                  }}
                >
                  {fontDebugLabel(
                    item.embeddedCleanName ||
                      item.embeddedFontName ||
                      item.fontName,
                    resolveItemFontMatch(item),
                    item.originalPdfFontSize || item.pdfFontSize,
                    item.isBold
                  )}
                  {" · canvas-baked"}
                </div>
              )}

            {/* Committed edits live on canvas — only invisible hitbox for re-edit */}
            {isEditing ? null : isCommittedEdit ? (
              active ? (
                <button
                  type="button"
                  className="pdf-text-hitbox"
                  aria-label={`Edit ${item.currentText}`}
                  style={{
                    left: box.left,
                    top: box.top,
                    width: Math.max(
                      box.width,
                      estimateTextWidthPx(item, item.currentText, zoom),
                      8
                    ),
                    height: box.height,
                  }}
                  onDoubleClick={(e) => beginEdit(item, e)}
                />
              ) : null
            ) : !active ? (
              match ? (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                    background: match.current
                      ? "rgba(251,146,60,0.45)"
                      : "rgba(253,224,71,0.35)",
                    zIndex: 5,
                  }}
                />
              ) : null
            ) : (
              <button
                type="button"
                className="pdf-text-hitbox"
                aria-label={`Edit ${item.originalText}`}
                title="Double-click to edit"
                style={{
                  left: box.left,
                  top: box.top,
                  width: Math.max(box.width, 8),
                  height: box.height,
                  ...(match
                    ? {
                        background: match.current
                          ? "rgba(251,146,60,0.35)"
                          : "rgba(253,224,71,0.28)",
                      }
                    : null),
                }}
                onDoubleClick={(e) => beginEdit(item, e)}
              />
            )}
          </div>
        );
      })}

      {/* HTML editor — ONLY while actively typing */}
      {active && editingItem && session && (
        <>
          {debugPatches && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: pdfItemToCssBox(editingItem, zoomFor(editingItem)).left,
                top: pdfItemToCssBox(editingItem, zoomFor(editingItem)).top,
                width: Math.max(
                  liveEditWidthPx ??
                    pdfItemToCssBox(editingItem, zoomFor(editingItem)).width,
                  4
                ),
                height: pdfItemToCssBox(editingItem, zoomFor(editingItem))
                  .height,
                boxShadow: "inset 0 0 0 1px rgba(34,197,94,0.9)",
                zIndex: 13,
              }}
            />
          )}
          <div
            key={editingItem.id}
            ref={editorRef}
            data-edit-editor
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            {...{ autoCorrect: "off", autoCapitalize: "off" }}
            className={
              editingItem.isUnderline
                ? "pdf-text-editor is-underlined"
                : "pdf-text-editor"
            }
            style={{
              ...exactTextStyle(editingItem, zoomFor(editingItem)),
              // Opaque bg while typing so canvas whiteout + HTML don't double-ghost
              background: session.patchColor,
              // Keep original fill color while typing (e.g. gray labels / link blue)
              color: session.inkColor || editingItem.color || "#000000",
              ...(editingItem.isUnderline
                ? {
                    textDecoration: "underline",
                    textDecorationColor:
                      session.inkColor || editingItem.color || "#0563C1",
                  }
                : null),
            }}
            onInput={() => measureLiveWidth(editingItem)}
            onBlur={(e) => {
              const next = e.relatedTarget as HTMLElement | null;
              if (next && toolbarSelector && next.closest?.(toolbarSelector)) {
                return;
              }
              commitEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitEdit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </>
      )}
    </div>
  );
}

function placeCaret(el: HTMLElement, x: number, y: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const docAny = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  if (docAny.caretRangeFromPoint) {
    const range = docAny.caretRangeFromPoint(x, y);
    if (range && el.contains(range.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
  }
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}
