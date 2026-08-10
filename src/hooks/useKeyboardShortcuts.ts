"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/editor-store";
import type { ToolType } from "@/lib/editor-types";

type Opts = {
  enabled: boolean;
  onUndoText?: () => void;
  onRedoText?: () => void;
  setScale?: (fn: (s: number) => number) => void;
};

export function useKeyboardShortcuts({
  enabled,
  onUndoText,
  onRedoText,
  setScale,
}: Opts) {
  const setTool = useEditorStore((s) => s.setTool);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const removeElement = useEditorStore((s) => s.removeElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const selectElement = useEditorStore((s) => s.selectElement);
  const nudgeElement = useEditorStore((s) => s.nudgeElement);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const activeTool = useEditorStore((s) => s.activeTool);
  const prevTool = useRef<ToolType>("select");

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing =
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable;

      if (e.code === "Space" && !typing) {
        if (!e.repeat) {
          prevTool.current = activeTool;
          setTool("hand");
        }
        e.preventDefault();
        return;
      }

      if (typing) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        // Prefer host-provided undo (unified text + elements); else store-only.
        if (onUndoText) onUndoText();
        else undo();
        return;
      }
      if (
        mod &&
        (e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        if (onRedoText) onRedoText();
        else redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d" && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
        return;
      }
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setScale?.((s) => Math.min(2.5, s + 0.15));
        return;
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        setScale?.((s) => Math.max(0.5, s - 0.15));
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeElement(selectedId);
        return;
      }
      if (e.key === "Escape") {
        selectElement(null);
        setTool("select");
        return;
      }

      if (selectedId && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 0.05 : 0.005;
        pushHistory();
        if (e.key === "ArrowLeft") nudgeElement(selectedId, -step, 0);
        if (e.key === "ArrowRight") nudgeElement(selectedId, step, 0);
        if (e.key === "ArrowUp") nudgeElement(selectedId, 0, -step);
        if (e.key === "ArrowDown") nudgeElement(selectedId, 0, step);
        return;
      }

      const map: Record<string, ToolType> = {
        h: "hand",
        t: "add-text",
        e: "edit-text",
        l: "highlight",
        p: "pencil",
        r: "rectangle",
        o: "ellipse",
        s: "sign",
        v: "select",
      };
      const k = e.key.toLowerCase();
      if (!mod && map[k]) {
        e.preventDefault();
        setTool(map[k]);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setTool(prevTool.current || "select");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    enabled,
    activeTool,
    selectedId,
    setTool,
    undo,
    redo,
    removeElement,
    duplicateElement,
    selectElement,
    nudgeElement,
    pushHistory,
    onUndoText,
    onRedoText,
    setScale,
  ]);
}
