"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import {
  Type,
  SquarePen,
  Highlighter,
  Pencil,
  MousePointer2,
  Hand,
  Undo2,
  Redo2,
  PanelLeft,
  Image as ImageIcon,
  Circle,
  Square,
  Minus,
  PenTool,
  StickyNote,
  Link2,
  MoreHorizontal,
  LayoutGrid,
  Files,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Search,
  Printer,
  Download,
  Save,
  Trash2,
  Bold,
  Italic,
  Plus,
} from "lucide-react";
import { FileUploader } from "@/components/shared/FileUploader";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadPdfDocument, renderPageToCanvas, getDisplayPixelRatio, type PdfDoc } from "@/lib/pdf/pdfjs";
import {
  extractPageTextItems,
  enrichTextFormattingFromCanvas,
  type EditableTextItem,
} from "@/lib/pdf/text-extraction";
import { matchFont } from "@/lib/pdf/font-matcher";
import {
  exportCanvasPdf,
  exportEditedPdf,
  type AnnotationStroke,
} from "@/lib/pdf/pdf-export";
import {
  exportPdfViaDirectDownload,
  exportPdfViaPrint,
} from "@/lib/pdf/pdf-export-print";
import {
  blitDisplayToVisible,
  createPageRender,
  type PageRender,
  rebakePageEdits,
  removeBakedEdit,
  warmCanvasFonts,
  whiteoutTextRegion,
  displayCanvasToPng,
} from "@/lib/pdf/page-render-cache";
import {
  saveEditorSession,
  loadEditorSession,
  clearEditorSession,
  consumePendingEditPdf,
  type EditorSession,
} from "@/lib/editor-session";
import { EditTextLayer } from "@/components/tools/EditTextLayer";
import { PageElementsOverlay } from "@/components/editor/PageElementsOverlay";
import { ContextualToolbar } from "@/components/editor/ContextualToolbar";
import { HandToolBridge } from "@/components/tools/HandTool";
import { SignatureModal } from "@/components/tools/SignatureModal";
import { LinkToolHost } from "@/components/tools/LinkTool";
import { PageLayoutModal } from "@/components/modals/PageLayoutModal";
import { useEditorStore } from "@/lib/editor-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  drawElementsOnCanvas,
  drawImageElementsOnCanvas,
} from "@/lib/pdf/draw-elements";
import { downloadBlob, cn, pdfBlob } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";

const FONTS: { id: string; label: string }[] = [
  { id: "Arial, Helvetica, sans-serif", label: "Arial / Helvetica" },
  { id: '"Times New Roman", Times, serif', label: "Times New Roman" },
  { id: '"Courier New", Courier, monospace', label: "Courier" },
];

const SIZES = [6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

type HistorySnap = {
  textItems: EditableTextItem[];
  strokes: Record<number, AnnotationStroke[]>;
  savedAt: number;
};

export function EditClient() {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [filename, setFilename] = useState("document.pdf");
  const [editingName, setEditingName] = useState(false);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.25);
  const scaleRef = useRef(1.25);
  scaleRef.current = scale;
  /** Bumps when devicePixelRatio / window size changes so pages re-render crisply */
  const [dpiTick, setDpiTick] = useState(0);
  const tool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const editorElements = useEditorStore((s) => s.elements);
  const clearElements = useEditorStore((s) => s.clearElements);
  const setSignatureOpen = useEditorStore((s) => s.setSignatureOpen);
  const setLayoutOpen = useEditorStore((s) => s.setLayoutOpen);
  const storeUndo = useEditorStore((s) => s.undo);
  const storeRedo = useEditorStore((s) => s.redo);
  const storePast = useEditorStore((s) => s.past);
  const storeFuture = useEditorStore((s) => s.future);
  const historySeq = useEditorStore((s) => s.historySeq);
  const addExportTestRect = useEditorStore((s) => s.addExportTestRect);
  const normalizeAllElements = useEditorStore((s) => s.normalizeAll);
  const selectElement = useEditorStore((s) => s.selectElement);
  const [showThumbs, setShowThumbs] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const textCacheRef = useRef<Record<number, EditableTextItem[]>>({});
  const [textCache, setTextCache] = useState<Record<number, EditableTextItem[]>>({});
  const [textItems, setTextItems] = useState<EditableTextItem[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Record<number, AnnotationStroke[]>>({});
  const [past, setPast] = useState<HistorySnap[]>([]);
  const [future, setFuture] = useState<HistorySnap[]>([]);
  const pastRef = useRef(past);
  pastRef.current = past;
  const futureRef = useRef(future);
  futureRef.current = future;
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState("Processing PDF…");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<{ id: string; pageIndex: number }[]>([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const [manageOpen, setManageOpen] = useState(false);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [scannedBanner, setScannedBanner] = useState(false);
  const [resumePrompt, setResumePrompt] = useState<EditorSession | null>(null);
  const [debugPatches, setDebugPatches] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [pageLayout, setPageLayout] = useState<{
    widthPx: number;
    heightPx: number;
    widthPt: number;
    heightPt: number;
  } | null>(null);
  const pageRendersRef = useRef<Map<number, PageRender>>(new Map());
  const textItemsRef = useRef<EditableTextItem[]>([]);
  textItemsRef.current = textItems;
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const pageRef = useRef(page);
  pageRef.current = page;

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const pageShellRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const confetti = useConfetti();

  // Desktop: show thumbs by default; mobile/tablet: hidden until toggled
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setShowThumbs(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Re-render when moving across monitors / DPR changes
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setDpiTick((t) => t + 1), 200);
    };
    window.addEventListener("resize", bump);
    const mq = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
    mq.addEventListener?.("change", bump);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", bump);
      mq.removeEventListener?.("change", bump);
    };
  }, []);

  // Keep Edit Text exclusive: when switching away, clear text selection
  useEffect(() => {
    if (tool !== "edit-text") setSelectedTextId(null);
  }, [tool]);

  // Pinch-to-zoom on the PDF scroll area (mobile)
  useEffect(() => {
    if (!doc) return;
    const container = scrollRef.current;
    if (!container) return;

    let touchStartDistance = 0;
    let initialZoom = 1;
    let raf = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance = Math.sqrt(dx * dx + dy * dy);
      initialZoom = scaleRef.current;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || touchStartDistance <= 0) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const next = Math.max(
        0.5,
        Math.min(2.5, Math.round(initialZoom * (distance / touchStartDistance) * 100) / 100)
      );
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScale(next));
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [doc]);

  const pageCount = doc?.numPages ?? 0;
  const selectedItem = textItems.find((t) => t.id === selectedTextId) || null;
  const showTextCtx = tool === "edit-text" || tool === "add-text" || Boolean(selectedItem);

  const pushHistory = useCallback(() => {
    const snap: HistorySnap = {
      textItems: textItemsRef.current,
      strokes: strokesRef.current,
      savedAt: Date.now(),
    };
    pastRef.current = [...pastRef.current.slice(-40), snap];
    futureRef.current = [];
    setPast(pastRef.current);
    setFuture([]);
    // Drop overlay redo stack so unified redo stays consistent
    useEditorStore.setState({ future: [] });
  }, []);

  // When overlays push a new history entry, drop text/stroke redo
  const prevHistorySeq = useRef(historySeq);
  useEffect(() => {
    if (historySeq === prevHistorySeq.current) return;
    prevHistorySeq.current = historySeq;
    futureRef.current = [];
    setFuture([]);
  }, [historySeq]);

  const applyTextHistory = useCallback((snap: HistorySnap) => {
    textItemsRef.current = snap.textItems;
    strokesRef.current = snap.strokes;
    setTextItems(snap.textItems);
    setStrokes(snap.strokes);
    const pageIndex = pageRef.current - 1;
    const cache = { ...textCacheRef.current, [pageIndex]: snap.textItems };
    textCacheRef.current = cache;
    setTextCache(cache);
    const pr = pageRendersRef.current.get(pageIndex);
    const visible = pdfCanvasRef.current;
    if (pr && visible) {
      rebakePageEdits(pr, snap.textItems);
      blitDisplayToVisible(pr, visible);
    }
  }, []);

  const undoText = useCallback((): boolean => {
    const p = pastRef.current;
    if (!p.length) return false;
    const taken = p[p.length - 1];
    const current: HistorySnap = {
      textItems: textItemsRef.current,
      strokes: strokesRef.current,
      savedAt: Date.now(),
    };
    pastRef.current = p.slice(0, -1);
    futureRef.current = [current, ...futureRef.current];
    setPast(pastRef.current);
    setFuture(futureRef.current);
    applyTextHistory(taken);
    return true;
  }, [applyTextHistory]);

  const redoText = useCallback((): boolean => {
    const f = futureRef.current;
    if (!f.length) return false;
    const taken = f[0];
    const current: HistorySnap = {
      textItems: textItemsRef.current,
      strokes: strokesRef.current,
      savedAt: Date.now(),
    };
    futureRef.current = f.slice(1);
    pastRef.current = [...pastRef.current, current];
    setPast(pastRef.current);
    setFuture(futureRef.current);
    applyTextHistory(taken);
    return true;
  }, [applyTextHistory]);

  const undoAll = useCallback(() => {
    const textPast = pastRef.current;
    const elPast = useEditorStore.getState().past;
    const textAt = textPast.length ? textPast[textPast.length - 1].savedAt : 0;
    const elAt = elPast.length ? elPast[elPast.length - 1].savedAt : 0;
    if (!textAt && !elAt) return;
    if (elAt >= textAt) storeUndo();
    else undoText();
  }, [storeUndo, undoText]);

  const redoAll = useCallback(() => {
    const textFuture = futureRef.current;
    const elFuture = useEditorStore.getState().future;
    const textAt = textFuture.length ? textFuture[0].savedAt : 0;
    const elAt = elFuture.length ? elFuture[0].savedAt : 0;
    if (!textAt && !elAt) return;
    if (elAt >= textAt) storeRedo();
    else redoText();
  }, [storeRedo, redoText]);

  useKeyboardShortcuts({
    enabled: Boolean(doc),
    setScale,
    onUndoText: undoAll,
    onRedoText: redoAll,
  });

  const canUndo = past.length > 0 || storePast.length > 0;
  const canRedo = future.length > 0 || storeFuture.length > 0;

  useEffect(() => {
    normalizeAllElements();
  }, [normalizeAllElements]);

  // Preload + warm canvas fonts as soon as editor mounts
  useEffect(() => {
    let cancelled = false;
    warmCanvasFonts()
      .then(() => {
        if (!cancelled) setFontsReady(true);
      })
      .catch(() => {
        if (!cancelled) setFontsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const syncPageRender = useCallback(
    async (pageIndex: number, pdf: PdfDoc, renderScale: number) => {
      const visible = pdfCanvasRef.current;
      if (!visible) return null;
      const pageProxy = await pdf.getPage(pageIndex + 1);
      const base = pageProxy.getViewport({ scale: 1 });
      const pr = createPageRender(
        pageIndex,
        visible,
        renderScale,
        base.width,
        base.height
      );
      rebakePageEdits(pr, textItemsRef.current);
      blitDisplayToVisible(pr, visible);
      pageRendersRef.current.set(pageIndex, pr);
      return pr;
    },
    []
  );

  const ensurePageText = useCallback(async (pageIndex: number, pdf: PdfDoc, force = false) => {
    if (!force && textCacheRef.current[pageIndex]) return textCacheRef.current[pageIndex];
    try {
      const items = await extractPageTextItems(pdf, pageIndex);
      textCacheRef.current = { ...textCacheRef.current, [pageIndex]: items };
      setTextCache(textCacheRef.current);
      setTextItems((prev) => {
        const existingEdited = prev.filter(
          (t) => t.pageIndex === pageIndex && (t.isEdited || t.isDeleted)
        );
        const fresh = items.map((it) => {
          const hit = existingEdited.find(
            (p) =>
              Math.abs(p.pdfX - it.pdfX) < 0.5 && Math.abs(p.pdfY - it.pdfY) < 0.5
          );
          return hit
            ? {
                ...it,
                currentText: hit.currentText,
                isEdited: hit.isEdited,
                isDeleted: hit.isDeleted,
                patchColor: hit.patchColor,
                backgroundColor: hit.backgroundColor || hit.patchColor,
                // Prefer live toolbar color if user changed it; else extracted
                color: hit.color || it.color,
                isUnderline: it.isUnderline || !!hit.isUnderline,
                isLink: it.isLink || !!hit.isLink,
                linkUrl: it.linkUrl || hit.linkUrl,
                fontFamily: it.fontFamily,
                matchedWebFamily: it.matchedWebFamily,
                embeddedFontName: hit.embeddedFontName || it.embeddedFontName,
                embeddedCleanName: hit.embeddedCleanName || it.embeddedCleanName,
                pdfFontSize: hit.pdfFontSize,
                fontSize: hit.pdfFontSize,
                isBold: hit.isBold,
                isItalic: hit.isItalic,
                originalPdfX: hit.originalPdfX ?? it.originalPdfX,
                originalPdfY: hit.originalPdfY ?? it.originalPdfY,
                originalPdfWidth: hit.originalPdfWidth ?? it.originalPdfWidth,
                originalPdfHeight: hit.originalPdfHeight ?? it.originalPdfHeight,
                originalPdfFontSize:
                  hit.originalPdfFontSize ?? it.originalPdfFontSize,
              }
            : it;
        });
        return [...prev.filter((t) => t.pageIndex !== pageIndex), ...fresh];
      });
      return items;
    } catch (e) {
      console.error("Text extraction failed", e);
      toast.error("Could not extract text on this page");
      return [];
    }
  }, []);

  const openPdf = useCallback(
    async (buf: ArrayBuffer, name: string, restore?: EditorSession) => {
      try {
        setFontsReady(false);
        pageRendersRef.current.clear();
        clearElements();
        setTool("select");

        const pdf = await loadPdfDocument(buf);
        setBuffer(buf);
        setDoc(pdf);
        setFilename(name);
        setPage(restore?.page ?? 1);
        setScale(restore?.scale ?? 1.25);
        setPageOrder(Array.from({ length: pdf.numPages }, (_, i) => i));
        setStrokes(restore?.strokes ?? {});
        setPast([]);
        setFuture([]);
        textCacheRef.current = {};
        setTextCache({});

        // Preload bundled web fonts (full glyph sets)
        try {
          await warmCanvasFonts();
          setFontsReady(true);
        } catch (e) {
          console.warn("Font preload failed", e);
          setFontsReady(true);
        }

        if (restore?.textItems?.length) {
          const remapped = restore.textItems.map((t) => {
            const m = matchFont(
              t.embeddedFontName || t.embeddedCleanName || t.fontName,
              t.fontDescriptorFlags
            );
            return {
              ...t,
              matchedWebFamily: m.webFamily,
              fontFamily: `'${m.webFamily}', -apple-system, BlinkMacSystemFont, sans-serif`,
            };
          });
          setTextItems(remapped);
          const cache: Record<number, EditableTextItem[]> = {};
          for (const t of remapped) {
            (cache[t.pageIndex] ||= []).push(t);
          }
          textCacheRef.current = cache;
          setTextCache(cache);
        } else {
          setTextItems([]);
          const first = await extractPageTextItems(pdf, 0);
          textCacheRef.current = { 0: first };
          setTextCache({ 0: first });
          setTextItems(first);
          setScannedBanner(first.length === 0);
        }

        // Thumbnails — don't block editor if some fail
        const t: string[] = [];
        const maxThumbs = Math.min(pdf.numPages, 40);
        for (let i = 1; i <= maxThumbs; i++) {
          try {
            const c = document.createElement("canvas");
            await renderPageToCanvas(pdf, i, 0.22, c);
            t.push(c.toDataURL("image/jpeg", 0.55));
          } catch {
            t.push("");
          }
        }
        setThumbs(t);
        toast.success("PDF ready to edit");
      } catch (e) {
        console.error(e);
        toast.error(e instanceof Error ? e.message : "Failed to open PDF");
        setFontsReady(false);
      }
    },
    [clearElements, setTool]
  );

  // Homepage hero handoff, then optional resume-session prompt
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pending = await consumePendingEditPdf();
        if (cancelled) return;
        if (pending) {
          await openPdf(pending.pdfBytes, pending.filename);
          return;
        }
        const data = await loadEditorSession();
        if (cancelled) return;
        if (data) setResumePrompt(data.session);
      } catch {
        /* ignore corrupt pending/session data */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openPdf]);

  const onFiles = useCallback(
    async (files: File[]) => {
      const f = files[0];
      try {
        const buf = await f.arrayBuffer();
        await openPdf(buf, f.name);
      } catch (e) {
        console.error(e);
        toast.error("Could not read that file");
      }
    },
    [openPdf]
  );

  const resume = useCallback(async () => {
    try {
      const data = await loadEditorSession();
      if (!data) return;
      await openPdf(data.pdfBytes, data.session.filename, data.session);
      setResumePrompt(null);
      toast.success("Session restored");
    } catch (e) {
      console.error(e);
      toast.error("Could not restore session");
    }
  }, [openPdf]);

  // Render current page → snapshot original/display → rebake edits
  useEffect(() => {
    if (!doc || !pdfCanvasRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const pixelRatio = getDisplayPixelRatio();
        await renderPageToCanvas(doc, page, scale, pdfCanvasRef.current!, {
          pixelRatio,
        });
        if (cancelled) return;
        const pageProxy = await doc.getPage(page);
        const baseVp = pageProxy.getViewport({ scale: 1 });
        // Layout uses CSS/logical size — not the HiDPI bitmap size
        setPageLayout({
          widthPx: baseVp.width * scale,
          heightPx: baseVp.height * scale,
          widthPt: baseVp.width,
          heightPt: baseVp.height,
        });
        if (cancelled) return;
        // Baking / whiteout operate in bitmap pixels (= scale × pixelRatio)
        await syncPageRender(page - 1, doc, scale * pixelRatio);
        if (cancelled) return;
        const ov = overlayRef.current;
        const visible = pdfCanvasRef.current;
        if (ov && visible) {
          ov.width = visible.width;
          ov.height = visible.height;
          ov.style.width = `${baseVp.width * scale}px`;
          ov.style.height = `${baseVp.height * scale}px`;
        }
        await ensurePageText(page - 1, doc);
        if (cancelled) return;
        // Refine colors/underlines from painted pixels (exact ink)
        const pr = pageRendersRef.current.get(page - 1);
        if (pr && visible) {
          const enriched = enrichTextFormattingFromCanvas(
            textItemsRef.current,
            pr.originalCanvas,
            page - 1
          );
          textItemsRef.current = enriched;
          setTextItems(enriched);
          const cache = { ...textCacheRef.current };
          cache[page - 1] = enriched.filter((t) => t.pageIndex === page - 1);
          textCacheRef.current = cache;
          setTextCache(cache);

          rebakePageEdits(pr, enriched);
          blitDisplayToVisible(pr, visible);
          // Preserve CSS size after blit (assigning canvas.width clears content only)
          visible.style.width = `${baseVp.width * scale}px`;
          visible.style.height = `${baseVp.height * scale}px`;
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (!/cancel/i.test(msg)) {
          console.error(e);
          toast.error("Failed to render page");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, page, scale, dpiTick, ensurePageText, syncPageRender]);

  // Auto-save every 30s
  useEffect(() => {
    if (!buffer) return;
    const id = setInterval(async () => {
      await saveEditorSession(
        {
          filename,
          page,
          scale,
          textItems,
          strokes,
          savedAt: Date.now(),
        },
        buffer
      );
      setSavedAt(Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, [buffer, filename, page, scale, textItems, strokes]);

  const updateSelected = useCallback(
    (patch: Partial<EditableTextItem>) => {
      if (!selectedTextId) return;
      pushHistory();
      setTextItems((items) =>
        items.map((t) => {
          if (t.id !== selectedTextId) return t;
          const next = { ...t, ...patch, isEdited: true };
          if (typeof patch.fontSize === "number") {
            next.pdfFontSize = patch.fontSize;
          }
          if (typeof patch.pdfFontSize === "number") {
            next.fontSize = patch.pdfFontSize;
          }
          return next;
        })
      );
    },
    [selectedTextId, pushHistory]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedTextId) return;
    pushHistory();
    const id = selectedTextId;
    setTextItems((items) => {
      const next = items.map((t) =>
        t.id === id ? { ...t, isDeleted: true, isEdited: true } : t
      );
      textItemsRef.current = next;
      const pr = pageRendersRef.current.get(pageRef.current - 1);
      const visible = pdfCanvasRef.current;
      if (pr && visible) {
        rebakePageEdits(pr, next);
        blitDisplayToVisible(pr, visible);
      }
      return next;
    });
    setSelectedTextId(null);
  }, [selectedTextId, pushHistory]);

  const runSearch = useCallback(async () => {
    if (!doc || !searchQuery.trim()) {
      setSearchHits([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const hits: { id: string; pageIndex: number }[] = [];
    for (let i = 0; i < doc.numPages; i++) {
      let items = textCache[i];
      if (!items) items = await ensurePageText(i, doc);
      for (const it of items) {
        if (!it.isDeleted && it.currentText.toLowerCase().includes(q)) {
          hits.push({ id: it.id, pageIndex: i });
        }
      }
    }
    setSearchHits(hits);
    setSearchIdx(0);
    if (hits.length) {
      setPage(hits[0].pageIndex + 1);
      toast.success(`${hits.length} match${hits.length === 1 ? "" : "es"}`);
    } else toast.error("No matches");
  }, [doc, searchQuery, textCache, ensurePageText]);

  const buildFinalPdf = useCallback(
    async (mode: "canvas" | "searchable" = "canvas") => {
      if (!buffer || !doc) throw new Error("No PDF");

      if (mode === "canvas") {
        // High quality: bake edits onto each page canvas, embed as PNG
        const pages: {
          pngBytes: ArrayBuffer;
          widthPdf: number;
          heightPdf: number;
        }[] = [];
        const bakeScale = Math.max(scale, 2);

        for (let i = 0; i < doc.numPages; i++) {
          setProgress(10 + Math.round((i / doc.numPages) * 70));
          const pageProxy = await doc.getPage(i + 1);
          const base = pageProxy.getViewport({ scale: 1 });
          const tmp = document.createElement("canvas");
          await renderPageToCanvas(doc, i + 1, bakeScale, tmp);
          const pr = createPageRender(
            i,
            tmp,
            bakeScale,
            base.width,
            base.height
          );
          rebakePageEdits(pr, textItemsRef.current);

          // Overlay annotation elements onto the canvas bitmap
          const ctx = pr.displayCanvas.getContext("2d")!;
          drawElementsOnCanvas(
            ctx,
            editorElements,
            i,
            pr.displayCanvas.width,
            pr.displayCanvas.height,
            { pageWidthPt: base.width, pageHeightPt: base.height }
          );
          await drawImageElementsOnCanvas(
            ctx,
            editorElements,
            i,
            pr.displayCanvas.width,
            pr.displayCanvas.height
          );

          // Draw annotation strokes if any (scaled from editor coords)
          const list = strokes[i + 1] || [];
          if (list.length && scale > 0) {
            const ctx = pr.displayCanvas.getContext("2d")!;
            const k = bakeScale / scale;
            for (const s of list) {
              ctx.lineCap = "round";
              ctx.strokeStyle = s.color;
              ctx.fillStyle = s.color;
              ctx.lineWidth = s.size * k;
              if (
                (s.tool === "draw" || s.tool === "highlight") &&
                s.points?.length
              ) {
                if (s.tool === "highlight") ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.moveTo(s.points[0].x * k, s.points[0].y * k);
                s.points.forEach((p: { x: number; y: number }) =>
                  ctx.lineTo(p.x * k, p.y * k)
                );
                ctx.stroke();
                ctx.globalAlpha = 1;
              } else if (s.tool === "rect" && s.x != null) {
                ctx.strokeRect(s.x * k, s.y! * k, s.w! * k, s.h! * k);
              } else if (s.text && s.x != null) {
                ctx.font = `${Math.max(14, s.size * 5) * k}px sans-serif`;
                ctx.fillText(s.text, s.x * k, s.y! * k);
              }
            }
          }

          pages.push({
            pngBytes: await displayCanvasToPng(pr),
            widthPdf: base.width,
            heightPdf: base.height,
          });
        }
        return exportCanvasPdf({ pages });
      }

      // Searchable: pdf-lib text overlay on original PDF
      const overlays: { pageIndex: number; pngBytes: ArrayBuffer }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const list = strokes[i] || [];
        if (!list.length) continue;
        await renderPageToCanvas(doc, i, 1.4, pdfCanvasRef.current!);
        const ov = document.createElement("canvas");
        ov.width = pdfCanvasRef.current!.width;
        ov.height = pdfCanvasRef.current!.height;
        const c = ov.getContext("2d")!;
        for (const s of list) {
          c.lineCap = "round";
          c.strokeStyle = s.color;
          c.fillStyle = s.color;
          c.lineWidth = s.size;
          if ((s.tool === "draw" || s.tool === "highlight") && s.points?.length) {
            if (s.tool === "highlight") c.globalAlpha = 0.4;
            c.beginPath();
            c.moveTo(s.points[0].x, s.points[0].y);
            s.points.forEach((p: { x: number; y: number }) =>
              c.lineTo(p.x, p.y)
            );
            c.stroke();
            c.globalAlpha = 1;
          } else if (s.tool === "rect" && s.x != null) {
            c.strokeRect(s.x, s.y!, s.w!, s.h!);
          } else if (s.tool === "circle" && s.x != null) {
            c.beginPath();
            c.ellipse(
              s.x + (s.w || 0) / 2,
              s.y! + (s.h || 0) / 2,
              Math.abs((s.w || 0) / 2),
              Math.abs((s.h || 0) / 2),
              0,
              0,
              Math.PI * 2
            );
            c.stroke();
          } else if (s.tool === "line" && s.x != null) {
            c.beginPath();
            c.moveTo(s.x, s.y!);
            c.lineTo(s.x + (s.w || 0), s.y! + (s.h || 0));
            c.stroke();
          } else if (s.text && s.x != null) {
            c.font = `${Math.max(14, s.size * 5)}px sans-serif`;
            c.fillText(s.text, s.x, s.y!);
          }
        }
        overlays.push({
          pageIndex: i - 1,
          pngBytes: await fetch(ov.toDataURL("image/png")).then((r) =>
            r.arrayBuffer()
          ),
        });
      }
      return exportEditedPdf({
        originalBytes: buffer,
        textItems: textItemsRef.current,
        overlayPngs: overlays,
        elements: editorElements,
      });
    },
    [buffer, doc, strokes, scale, editorElements]
  );

  const handleDone = async (mode: "exact" | "searchable" = "exact") => {
    if (!buffer || !doc) return;
    setSelectedTextId(null);
    selectElement(null);
    setExportMenuOpen(false);
    setProcessing(true);
    setProgress(5);
    setProcessingMsg(
      mode === "exact"
        ? "Preparing PDF download…"
        : "Building searchable PDF…"
    );
    try {
      if (mode === "exact") {
        const bytes = await exportPdfViaDirectDownload({
          originalBytes: buffer,
          elements: editorElements,
          textItems: textItemsRef.current,
          fileName: filename.replace(/\.pdf$/i, "") + "-edited.pdf",
          onProgress: ({ current, total }) => {
            setProgress(Math.round((current / Math.max(total, 1)) * 100));
          },
        });
        setProgress(100);
        downloadBlob(
          pdfBlob(bytes),
          filename.replace(/\.pdf$/i, "") + "-edited.pdf"
        );
        await clearEditorSession();
        confetti();
        toast.success("Downloaded");
      } else {
        setProgress(20);
        const bytes = await buildFinalPdf("searchable");
        setProgress(100);
        downloadBlob(
          pdfBlob(bytes),
          filename.replace(/\.pdf$/i, "") + "-edited-searchable.pdf"
        );
        await clearEditorSession();
        confetti();
        toast.success("Downloaded (searchable text)");
      }
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Export failed";
      toast.error(msg);
    } finally {
      setProcessing(false);
      setProgress(0);
      setProcessingMsg("Processing PDF…");
    }
  };

  const handlePrint = async () => {
    if (!buffer || !doc) return;
    selectElement(null);
    setSelectedTextId(null);
    setProcessing(true);
    setProgress(5);
    setProcessingMsg("Opening print dialog…");
    try {
      await exportPdfViaPrint({
        originalBytes: buffer,
        elements: editorElements,
        textItems: textItemsRef.current,
        fileName: filename,
        autoPrint: true,
        onProgress: ({ current, total }) => {
          setProgress(Math.round((current / Math.max(total, 1)) * 100));
        },
      });
      setProgress(100);
    } catch {
      toast.error("Print failed — allow popups and try again");
    } finally {
      setProcessing(false);
      setProgress(0);
      setProcessingMsg("Processing PDF…");
    }
  };

  const handleSave = async () => {
    if (!buffer) return;
    await saveEditorSession(
      { filename, page, scale, textItems, strokes, savedAt: Date.now() },
      buffer
    );
    setSavedAt(Date.now());
    toast.success("Progress saved");
  };

  const scrollToolbar = (dir: -1 | 1) => {
    toolbarRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  if (!doc) {
    return (
      <div className="space-y-4">
        {resumePrompt && (
          <div className="card-surface rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">Resume previous session?</p>
              <p className="text-xs text-text-secondary">
                {resumePrompt.filename} ·{" "}
                {new Date(resumePrompt.savedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={resume}>
                Resume
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await clearEditorSession();
                  setResumePrompt(null);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
        <FileUploader
          accept={{ "application/pdf": [".pdf"] }}
          onFiles={onFiles}
          label="Drop a PDF to edit"
        />
      </div>
    );
  }

  const searchMatchMeta = searchHits.map((h, i) => ({
    id: h.id,
    current: i === searchIdx,
  }));

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-2 flex flex-col min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] bg-bg-secondary/40">
      {/* Sticky chrome: file bar + tools stay under navbar while scrolling */}
      <div className="sticky top-14 sm:top-16 z-40 bg-bg-card shadow-soft border-b border-primary/10">
      {/* HEADER */}
      <header className="bg-bg-card border-b border-primary/15 px-2 sm:px-4 h-12 sm:h-14 flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="hidden sm:inline text-sm font-bold text-primary shrink-0">
            PDFForge
          </span>
          <span className="hidden sm:inline text-primary/30">|</span>
          {editingName ? (
            <Input
              autoFocus
              className="h-8 max-w-xs text-base sm:text-sm"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            />
          ) : (
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-medium truncate hover:text-primary min-w-0"
              onClick={() => setEditingName(true)}
              title="Rename file"
            >
              <SquarePen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{filename}</span>
            </button>
          )}
          {savedAt && (
            <span className="text-[10px] text-emerald-600 shrink-0">Saved ✓</span>
          )}
        </div>

        <div className="relative flex items-center gap-0.5 sm:gap-2 shrink-0">
          <IconBtn label="Search" onClick={() => setSearchOpen((v) => !v)}>
            <Search className="h-4 w-4" />
          </IconBtn>
          <span className="hidden sm:inline-flex">
            <IconBtn label="Print" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </IconBtn>
          </span>
          <IconBtn label="Save as PDF" onClick={() => handleDone("exact")}>
            <Download className="h-4 w-4" />
          </IconBtn>
          <Button size="sm" variant="outline" onClick={handleSave} className="hidden xs:inline-flex">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <div className="relative">
            <Button
              size="sm"
              onClick={() => setExportMenuOpen((v) => !v)}
            >
              Done
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-orange-200/60 bg-bg-card shadow-soft p-1 text-sm">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-primary/10"
                  onClick={() => handleDone("exact")}
                >
                  <span className="font-medium">Save as PDF</span>
                  <span className="ml-1 text-[10px] text-primary font-semibold">
                    Recommended
                  </span>
                  <span className="block text-[10px] text-text-secondary">
                    Opens print preview — choose &quot;Save as PDF&quot; in the dialog
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-primary/10"
                  onClick={() => handleDone("searchable")}
                >
                  <span className="font-medium">Searchable Text</span>
                  <span className="block text-[10px] text-text-secondary">
                    Text remains searchable; positions may vary slightly.
                  </span>
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-primary/10 border-t border-orange-200/40 mt-1 pt-2"
                  onClick={() => {
                    addExportTestRect(page - 1);
                    setExportMenuOpen(false);
                    toast.success(
                      "Test kit added (debug logging on). Download to verify positions."
                    );
                  }}
                >
                  <span className="font-medium text-red-600">Add coordinate test kit</span>
                  <span className="block text-[10px] text-text-secondary">
                    Highlight, rect, line, pencil, text at known positions
                  </span>
                </button>
              </div>
            )}
          </div>

          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 card-surface rounded-xl p-3 w-72 shadow-soft">
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Search in PDF…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runSearch();
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setSearchHits([]);
                    }
                  }}
                  className="h-9"
                />
                <Button size="sm" onClick={runSearch}>
                  Go
                </Button>
              </div>
              {searchHits.length > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span>
                    {searchIdx + 1} of {searchHits.length}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        const i = (searchIdx - 1 + searchHits.length) % searchHits.length;
                        setSearchIdx(i);
                        setPage(searchHits[i].pageIndex + 1);
                      }}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        const i = (searchIdx + 1) % searchHits.length;
                        setSearchIdx(i);
                        setPage(searchHits[i].pageIndex + 1);
                      }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* MAIN TOOLBAR */}
      <div className="bg-bg-card border-b border-primary/10 relative flex items-center">
        <button
          type="button"
          className="absolute left-0 z-10 h-full px-1 bg-bg-card/90 hidden sm:flex items-center"
          onClick={() => scrollToolbar(-1)}
          aria-label="Scroll tools left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={toolbarRef}
          className="flex gap-0.5 overflow-x-auto scrollbar-hide px-2 sm:px-6 py-1.5 snap-x min-w-0"
        >
          <ToolBtn
            active={showThumbs}
            label="Thumbs"
            tip="Thumbnails"
            onClick={() => setShowThumbs((v) => !v)}
          >
            <PanelLeft className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn active={tool === "hand"} label="Hand" tip="Pan (H)" onClick={() => setTool("hand")}>
            <Hand className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={false}
            label="Undo"
            tip="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={undoAll}
          >
            <Undo2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={false}
            label="Redo"
            tip="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onClick={redoAll}
          >
            <Redo2 className="h-4 w-4" />
          </ToolBtn>
          <Sep />
          <ToolBtn
            active={tool === "add-text"}
            label="Add Text"
            tip="Add text"
            onClick={() => setTool("add-text")}
          >
            <Type className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "edit-text"}
            label={fontsReady ? "Edit Text" : "Fonts…"}
            tip={
              fontsReady
                ? "Double-click text to edit (right-click: patch/font debug)"
                : "Loading fonts…"
            }
            disabled={!fontsReady}
            onClick={async () => {
              if (!fontsReady) {
                toast("Loading fonts…", { id: "fonts-loading" });
                return;
              }
              setTool("edit-text");
              setSelectedTextId(null);
              if (doc) {
                const items = await ensurePageText(page - 1, doc, true);
                if (!items.filter((t) => !t.isRotated).length) {
                  toast.error("No editable text — try Add Text for scanned PDFs");
                } else {
                  toast.success("Double-click text to edit in place", {
                    id: "edit-text-hint",
                    duration: 2800,
                  });
                }
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setDebugPatches((v) => {
                const next = !v;
                toast(next ? "Patch + font debug ON" : "Patch + font debug OFF", {
                  id: "patch-debug",
                });
                return next;
              });
            }}
          >
            <SquarePen className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "highlight"}
            label="Highlight"
            tip="Highlight (L)"
            onClick={() => setTool("highlight")}
          >
            <Highlighter className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "pencil"}
            label="Pencil"
            tip="Draw (P)"
            onClick={() => setTool("pencil")}
          >
            <Pencil className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "rectangle"}
            label="Shape"
            tip="Rectangle (R)"
            onClick={() => setTool("rectangle")}
          >
            <Square className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "ellipse"}
            label="Ellipse"
            tip="Ellipse (O)"
            onClick={() => setTool("ellipse")}
          >
            <Circle className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "line"}
            label="Line"
            tip="Line"
            onClick={() => setTool("line")}
          >
            <Minus className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "arrow"}
            label="Arrow"
            tip="Arrow"
            onClick={() => setTool("arrow")}
          >
            <ChevronRight className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "sign"}
            label="Sign"
            tip="Signature (S)"
            onClick={() => {
              setTool("sign");
              setSignatureOpen(true);
            }}
          >
            <PenTool className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "note"}
            label="Note"
            tip="Sticky note"
            onClick={() => setTool("note")}
          >
            <StickyNote className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "image"}
            label="Image"
            tip="Add image"
            onClick={() => setTool("image")}
          >
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "link"}
            label="Links"
            tip="Drag to draw a link area, then enter a URL"
            onClick={() => setTool("link")}
          >
            <Link2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={false}
            label="More"
            tip="More tools"
            onClick={() => setTool("arrow")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </ToolBtn>
          <Sep />
          <ToolBtn
            active={false}
            label="Layout"
            tip="Page layout"
            onClick={() => setLayoutOpen(true)}
          >
            <LayoutGrid className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={manageOpen}
            label="Pages"
            tip="Manage pages"
            onClick={() => setManageOpen(true)}
          >
            <Files className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={tool === "select"}
            label="Select"
            tip="Select"
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="h-4 w-4" />
          </ToolBtn>
        </div>
        <button
          type="button"
          className="absolute right-0 z-10 h-full px-1 bg-bg-card/90 hidden sm:flex items-center"
          onClick={() => scrollToolbar(1)}
          aria-label="Scroll tools right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <ContextualToolbar />

      {/* CONTEXTUAL TEXT TOOLBAR */}
      {showTextCtx && (
        <div
          data-text-toolbar
          className="bg-bg-card border-b border-primary/10 px-3 py-1.5 flex flex-wrap items-center gap-2 text-sm"
        >
          <Button
            size="sm"
            variant={tool === "add-text" ? "default" : "outline"}
            onClick={() => setTool("add-text")}
          >
            <Plus className="h-3.5 w-3.5" />
            Add text
          </Button>
          <input
            type="color"
            className="h-8 w-10 rounded border border-primary/20 cursor-pointer"
            value={selectedItem?.color || "#000000"}
            onChange={(e) => updateSelected({ color: e.target.value })}
            aria-label="Text color"
          />
          <span className="w-px h-6 bg-primary/20" />
          <select
            className="h-8 rounded-lg border border-primary/20 bg-bg-card px-2 text-xs"
            value={selectedItem?.fontFamily || "Arial, Helvetica, sans-serif"}
            onChange={(e) =>
              updateSelected({ fontFamily: e.target.value })
            }
            aria-label="Font family"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border border-primary/20 bg-bg-card px-2 text-xs w-16"
            value={Math.round(selectedItem?.pdfFontSize || selectedItem?.fontSize || 12)}
            onChange={(e) =>
              updateSelected({
                pdfFontSize: Number(e.target.value),
                fontSize: Number(e.target.value),
              })
            }
            aria-label="Font size"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            size="icon"
            variant={selectedItem?.isBold ? "default" : "outline"}
            className="h-8 w-8"
            onClick={() => updateSelected({ isBold: !selectedItem?.isBold })}
            aria-label="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant={selectedItem?.isItalic ? "default" : "outline"}
            className="h-8 w-8"
            onClick={() => updateSelected({ isItalic: !selectedItem?.isItalic })}
            aria-label="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="destructive"
            disabled={!selectedItem}
            onClick={deleteSelected}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      )}

      {scannedBanner && (
        <div className="bg-amber-50 text-amber-900 text-sm px-4 py-2 border-b border-amber-200">
          This looks like a scanned PDF — no editable text found. Use Add Text instead.
        </div>
      )}
      </div>

      {/* BODY */}
      <div className="relative flex flex-1 min-h-[60vh] overflow-hidden">
        {showThumbs && (
          <aside className="hidden lg:block w-36 xl:w-44 shrink-0 border-r border-primary/10 bg-bg-card overflow-y-auto p-2 space-y-2 h-[calc(100vh-8rem)]">
            {thumbs.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i + 1)}
                className={cn(
                  "block w-full rounded-lg overflow-hidden border-2 min-h-[44px]",
                  page === i + 1 ? "border-primary" : "border-transparent"
                )}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`Page ${i + 1}`} className="w-full" />
                ) : (
                  <div className="aspect-[3/4] bg-primary/10 flex items-center justify-center text-xs text-text-secondary">
                    {i + 1}
                  </div>
                )}
                <span className="block text-[10px] text-center py-0.5">{i + 1}</span>
              </button>
            ))}
          </aside>
        )}

        {/* Mobile thumbs strip when enabled */}
        {showThumbs && (
          <div className="lg:hidden absolute left-0 top-0 bottom-0 z-30 w-24 sm:w-28 border-r border-primary/10 bg-bg-card overflow-y-auto p-1.5 space-y-1.5 shadow-soft">
            {thumbs.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i + 1)}
                className={cn(
                  "block w-full rounded-lg overflow-hidden border-2",
                  page === i + 1 ? "border-primary" : "border-transparent"
                )}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={`Page ${i + 1}`} className="w-full" />
                ) : (
                  <div className="aspect-[3/4] bg-primary/10 flex items-center justify-center text-xs">
                    {i + 1}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 overflow-auto relative p-2 sm:p-4 md:p-6 flex justify-center bg-orange-950/[0.03] touch-pan-x touch-pan-y"
        >
          <HandToolBridge containerRef={scrollRef} />
          <div
            ref={pageShellRef}
            data-pdf-page={page - 1}
            data-page-width-pt={pageLayout?.widthPt}
            data-page-height-pt={pageLayout?.heightPt}
            className="pdf-page-container relative shadow-soft bg-white rounded-sm"
            style={
              pageLayout
                ? {
                    width: pageLayout.widthPx,
                    height: pageLayout.heightPx,
                  }
                : undefined
            }
          >
            <canvas
              ref={pdfCanvasRef}
              className="pdf-page-canvas block w-full h-full"
            />
            {/* Annotation canvas — never capture clicks in Edit Text mode */}
            <canvas
              ref={overlayRef}
              className="pdf-page-overlay absolute inset-0 w-full h-full pointer-events-none"
            />
            <PageElementsOverlay
              pageIndex={page - 1}
              editTextActive={tool === "edit-text"}
            />
            <EditTextLayer
              items={textItems}
              pageIndex={page - 1}
              canvas={pdfCanvasRef.current}
              active={tool === "edit-text"}
              toolbarSelector="[data-text-toolbar]"
              debugPatches={debugPatches}
              searchMatches={searchMatchMeta}
              onSelectId={setSelectedTextId}
              onPushHistory={pushHistory}
              onWhiteoutForEdit={(item, patchColor) => {
                const pr = pageRendersRef.current.get(page - 1);
                const visible = pdfCanvasRef.current;
                if (!pr || !visible) return;
                whiteoutTextRegion(
                  pr,
                  { ...item, patchColor },
                  patchColor,
                  textItemsRef.current
                );
                blitDisplayToVisible(pr, visible);
              }}
              onBakeCommit={(item) => {
                const pr = pageRendersRef.current.get(page - 1);
                const visible = pdfCanvasRef.current;
                if (!pr || !visible) return;
                const next = textItemsRef.current.map((t) =>
                  t.id === item.id ? item : t
                );
                textItemsRef.current = next;
                rebakePageEdits(pr, next);
                blitDisplayToVisible(pr, visible);
              }}
              onRestoreCanvas={(itemId) => {
                const pr = pageRendersRef.current.get(page - 1);
                const visible = pdfCanvasRef.current;
                if (!pr || !visible) return;
                removeBakedEdit(pr, textItemsRef.current, itemId);
                blitDisplayToVisible(pr, visible);
              }}
              onRevertItem={(id) => {
                setTextItems((prev) =>
                  prev.map((t) =>
                    t.id === id
                      ? {
                          ...t,
                          currentText: t.originalText,
                          isEdited: false,
                          patchColor: "rgb(255,255,255)",
                          backgroundColor: "rgb(255,255,255)",
                        }
                      : t
                  )
                );
                const pr = pageRendersRef.current.get(page - 1);
                const visible = pdfCanvasRef.current;
                if (pr && visible) {
                  removeBakedEdit(pr, textItemsRef.current, id);
                  blitDisplayToVisible(pr, visible);
                }
              }}
              onCommitItem={(item) => {
                setTextItems((prev) =>
                  prev.map((t) => (t.id === item.id ? item : t))
                );
                setSelectedTextId(item.id);
              }}
            />
          </div>

          {/* Floating page controls */}
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 sm:gap-2 rounded-full bg-slate-900/85 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-soft text-xs sm:text-sm backdrop-blur-md">
            <span className="hidden xs:inline text-xs opacity-80 pl-1">Page:</span>
            <button
              type="button"
              className="p-1.5 sm:p-1 rounded hover:bg-white/10 disabled:opacity-40 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <span className="tabular-nums min-w-[2.75rem] sm:min-w-[3rem] text-center">
              {page}/{pageCount}
            </span>
            <button
              type="button"
              className="p-1.5 sm:p-1 rounded hover:bg-white/10 disabled:opacity-40 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <span className="w-px h-4 bg-white/20 mx-0.5 sm:mx-1" />
            <button
              type="button"
              className="p-1.5 sm:p-1 rounded hover:bg-white/10 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center"
              onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 sm:p-1 rounded hover:bg-white/10 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              type="button"
              className={cn(
                "p-1.5 sm:p-1 rounded hover:bg-white/10 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center",
                tool === "hand" && "bg-white/20"
              )}
              onClick={() => setTool("hand")}
              aria-label="Hand tool"
            >
              <Hand className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manage pages modal */}
      {manageOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-bg-card rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-auto p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Manage pages</h2>
              <Button size="sm" variant="outline" onClick={() => setManageOpen(false)}>
                Close
              </Button>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Reorder, rotate, or jump to pages. Structural changes apply on Done export.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pageOrder.map((pi, orderIdx) => (
                <div key={pi} className="card-surface rounded-xl p-2 text-center">
                  {thumbs[pi] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbs[pi]} alt="" className="w-full rounded-lg mb-2" />
                  ) : (
                    <div className="skeleton aspect-[3/4] mb-2" />
                  )}
                  <p className="text-xs font-medium mb-1">Page {pi + 1}</p>
                  <div className="flex justify-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-2"
                      onClick={() => setPage(pi + 1)}
                    >
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-2"
                      disabled={orderIdx === 0}
                      onClick={() => {
                        setPageOrder((ord) => {
                          const n = [...ord];
                          [n[orderIdx - 1], n[orderIdx]] = [n[orderIdx], n[orderIdx - 1]];
                          return n;
                        });
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] px-2"
                      disabled={orderIdx === pageOrder.length - 1}
                      onClick={() => {
                        setPageOrder((ord) => {
                          const n = [...ord];
                          [n[orderIdx + 1], n[orderIdx]] = [n[orderIdx], n[orderIdx + 1]];
                          return n;
                        });
                      }}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <SignatureModal />
      <LinkToolHost />
      <PageLayoutModal
        onAddBlank={() => {
          toast.success("Add blank page: use Pages → duplicate last, then clear");
        }}
      />

      <ProcessingOverlay open={processing} progress={progress} message={processingMsg} />
    </div>
  );
}

function ToolBtn({
  children,
  label,
  tip,
  active,
  disabled,
  onClick,
  onContextMenu,
}: {
  children: ReactNode;
  label: string;
  tip: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  onContextMenu?: (e: ReactMouseEvent) => void;
}) {
  return (
    <button
      type="button"
      title={tip}
      disabled={disabled}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "snap-start flex flex-col items-center justify-center gap-0.5 min-w-[50px] sm:min-w-[3.25rem] h-12 sm:h-14 rounded-lg px-1 sm:px-1.5 text-[10px] sm:text-[10px] font-medium transition-colors shrink-0",
        active
          ? "bg-primary text-white"
          : "text-text-secondary hover:bg-primary/10 hover:text-text-primary",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {children}
      <span className="leading-none truncate max-w-[3.5rem]">{label}</span>
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-9 w-9 sm:h-9 sm:w-9 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 inline-flex items-center justify-center rounded-lg text-text-secondary hover:bg-primary/10 hover:text-text-primary"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-10 bg-primary/15 mx-1 shrink-0 self-center" />;
}
