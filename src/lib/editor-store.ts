"use client";

import { create } from "zustand";
import {
  DEFAULT_TOOL_OPTIONS,
  type EditorElement,
  type ToolOptions,
  type ToolType,
  uid,
} from "./editor-types";
import { ensureNormalized, remapElementGeometry } from "./coords";

type Snapshot = {
  elements: EditorElement[];
  /** Wall-clock time when this snapshot was taken (for unified undo with text history). */
  savedAt: number;
};

type EditorStore = {
  activeTool: ToolType;
  elements: EditorElement[];
  selectedElementId: string | null;
  toolOptions: ToolOptions;
  past: Snapshot[];
  future: Snapshot[];
  /** Bumps only on pushHistory (not undo/redo) so hosts can clear sibling redo stacks. */
  historySeq: number;
  /** Pending image/signature to place on next click */
  pendingPlace: {
    type: "image" | "signature";
    imageData: string;
    aspectRatio: number;
  } | null;
  /** Pending link hotspot waiting for URL (Links tool only) */
  pendingLink: {
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    /** When set, dialog edits an existing link instead of creating */
    editId?: string;
    initialUrl?: string;
  } | null;
  layoutOpen: boolean;
  signatureOpen: boolean;

  setTool: (t: ToolType) => void;
  setToolOptions: (patch: Partial<ToolOptions>) => void;
  selectElement: (id: string | null) => void;
  setPendingPlace: (p: EditorStore["pendingPlace"]) => void;
  setPendingLink: (p: EditorStore["pendingLink"]) => void;
  setLayoutOpen: (v: boolean) => void;
  setSignatureOpen: (v: boolean) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  addElement: (el: Omit<EditorElement, "id"> & { id?: string }) => string;
  updateElement: (id: string, patch: Partial<EditorElement>) => void;
  updateElementData: (id: string, data: Record<string, unknown>) => void;
  removeElement: (id: string) => void;
  /** Alias of removeElement */
  deleteElement: (id: string) => void;
  /** Alias of setTool */
  setActiveTool: (t: ToolType) => void;
  nudgeElement: (id: string, dx: number, dy: number) => void;
  duplicateElement: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  clearElements: () => void;
  setElements: (els: EditorElement[]) => void;
  /** Repair legacy coordinate/bounds formats already sitting in the store */
  normalizeAll: () => void;
  elementsOnPage: (pageIndex: number) => EditorElement[];
  addExportTestRect: (pageIndex: number) => void;
};

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorStore>((set, get) => ({
  activeTool: "select",
  elements: [],
  selectedElementId: null,
  toolOptions: { ...DEFAULT_TOOL_OPTIONS },
  past: [],
  future: [],
  historySeq: 0,
  pendingPlace: null,
  pendingLink: null,
  layoutOpen: false,
  signatureOpen: false,

  setTool: (t) =>
    set({
      activeTool: t,
      selectedElementId: t === "select" ? get().selectedElementId : null,
    }),

  setToolOptions: (patch) =>
    set({ toolOptions: { ...get().toolOptions, ...patch } }),

  selectElement: (id) => set({ selectedElementId: id }),

  setPendingPlace: (p) => set({ pendingPlace: p }),
  setPendingLink: (p) => set({ pendingLink: p }),
  setLayoutOpen: (v) => set({ layoutOpen: v }),
  setSignatureOpen: (v) => set({ signatureOpen: v }),

  pushHistory: () => {
    const { elements, past, historySeq } = get();
    set({
      past: [
        ...past.slice(-(MAX_HISTORY - 1)),
        { elements: structuredClone(elements), savedAt: Date.now() },
      ],
      future: [],
      historySeq: historySeq + 1,
    });
  },

  undo: () => {
    const { past, elements, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [
        { elements: structuredClone(elements), savedAt: Date.now() },
        ...future,
      ],
      elements: prev.elements,
      selectedElementId: null,
    });
  },

  redo: () => {
    const { past, elements, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      future: future.slice(1),
      past: [
        ...past,
        { elements: structuredClone(elements), savedAt: Date.now() },
      ],
      elements: next.elements,
      selectedElementId: null,
    });
  },

  addElement: (el) => {
    get().pushHistory();
    const id = el.id || uid();
    const normalized = ensureNormalized({
      id,
      type: el.type,
      pageIndex: el.pageIndex,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation ?? 0,
      opacity: el.opacity ?? 1,
      data: el.data ?? {},
    });
    set({
      elements: [...get().elements, normalized],
      // Every new element is immediately live: selected and ready to be
      // moved/resized with the Select tool, like Figma/Canva.
      selectedElementId: id,
      activeTool: "select",
      pendingPlace: null,
    });
    return id;
  },

  updateElement: (id, patch) => {
    set({
      elements: get().elements.map((e) => {
        if (e.id !== id) return e;
        const geometry = remapElementGeometry(e, patch);
        const next: EditorElement = { ...e, ...patch };
        if (geometry || patch.data) {
          next.data = { ...e.data, ...geometry, ...patch.data };
        }
        return next;
      }),
    });
  },

  updateElementData: (id, data) => {
    set({
      elements: get().elements.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...data } } : e
      ),
    });
  },

  removeElement: (id) => {
    get().pushHistory();
    set({
      elements: get().elements.filter((e) => e.id !== id),
      selectedElementId:
        get().selectedElementId === id ? null : get().selectedElementId,
    });
  },

  deleteElement: (id) => get().removeElement(id),

  setActiveTool: (t) => get().setTool(t),

  nudgeElement: (id, dx, dy) => {
    const el = get().elements.find((e) => e.id === id);
    if (!el) return;
    get().updateElement(id, {
      x: Math.max(0, Math.min(1 - el.width, el.x + dx)),
      y: Math.max(0, Math.min(1 - el.height, el.y + dy)),
    });
  },

  duplicateElement: (id) => {
    const src = get().elements.find((e) => e.id === id);
    if (!src) return;
    get().pushHistory();
    const offset = {
      x: Math.min(1 - src.width, src.x + 0.02),
      y: Math.min(1 - src.height, src.y + 0.02),
    };
    const geometry = remapElementGeometry(src, offset);
    const copy: EditorElement = {
      ...structuredClone(src),
      id: uid(),
      ...offset,
    };
    if (geometry) copy.data = { ...copy.data, ...geometry };
    set({
      elements: [...get().elements, copy],
      selectedElementId: copy.id,
      activeTool: "select",
    });
  },

  bringForward: (id) => {
    const els = [...get().elements];
    const i = els.findIndex((e) => e.id === id);
    if (i < 0 || i >= els.length - 1) return;
    get().pushHistory();
    [els[i], els[i + 1]] = [els[i + 1], els[i]];
    set({ elements: els });
  },

  sendBackward: (id) => {
    const els = [...get().elements];
    const i = els.findIndex((e) => e.id === id);
    if (i <= 0) return;
    get().pushHistory();
    [els[i - 1], els[i]] = [els[i], els[i - 1]];
    set({ elements: els });
  },

  clearElements: () => set({ elements: [], selectedElementId: null, past: [], future: [] }),

  setElements: (els) =>
    set({ elements: els.map((el) => ensureNormalized(el)) }),

  normalizeAll: () => {
    const els = get().elements;
    const fixed = els.map((el) => ensureNormalized(el));
    if (fixed.some((el, i) => el !== els[i])) set({ elements: fixed });
  },

  elementsOnPage: (pageIndex) =>
    get().elements.filter((e) => e.pageIndex === pageIndex),

  addExportTestRect: (pageIndex) => {
    // Enable verbose export logging for this verification session
    try {
      localStorage.setItem("pdfforge-export-debug", "1");
    } catch {
      /* ignore */
    }

    const add = get().addElement;
    // 1) Red highlight — top-left
    add({
      type: "highlight",
      pageIndex,
      x: 0.05,
      y: 0.05,
      width: 0.2,
      height: 0.03,
      rotation: 0,
      opacity: 1,
      data: { color: "#FF0000", opacity: 0.45 },
    });
    // 2) Blue rectangle — center
    add({
      type: "rectangle",
      pageIndex,
      x: 0.4,
      y: 0.45,
      width: 0.2,
      height: 0.1,
      rotation: 0,
      opacity: 1,
      data: {
        strokeColor: "#0000FF",
        strokeWidth: 3,
        fillColor: "transparent",
      },
    });
    // 3) Green diagonal line
    add({
      type: "line",
      pageIndex,
      x: 0.1,
      y: 0.1,
      width: 0.8,
      height: 0.8,
      rotation: 0,
      opacity: 1,
      data: {
        x1: 0.1,
        y1: 0.1,
        x2: 0.9,
        y2: 0.9,
        strokeColor: "#00FF00",
        strokeWidth: 2,
      },
    });
    // 4) Magenta pencil scribble — middle
    const pencilPoints = [];
    for (let i = 0; i < 20; i++) {
      pencilPoints.push({
        x: 0.3 + (i / 20) * 0.4,
        y: 0.5 + Math.sin(i) * 0.02,
      });
    }
    add({
      type: "draw",
      pageIndex,
      x: 0.3,
      y: 0.48,
      width: 0.4,
      height: 0.04,
      rotation: 0,
      opacity: 1,
      data: {
        points: pencilPoints,
        strokeColor: "#FF00FF",
        strokeWidth: 3,
      },
    });
    // 5) Text near bottom
    add({
      type: "text",
      pageIndex,
      x: 0.1,
      y: 0.9,
      width: 0.5,
      height: 0.05,
      rotation: 0,
      opacity: 1,
      data: {
        text: "TEST BOTTOM",
        fontSize: 20,
        color: "#000000",
        fontFamily: "PDF-Inter",
      },
    });
  },
}));
