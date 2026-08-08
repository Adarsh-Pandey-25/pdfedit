"use client";

import { useEditorStore } from "@/lib/editor-store";
import { resolveFontSizePt } from "@/lib/coords";
import { HIGHLIGHT_SWATCHES } from "@/lib/editor-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FONTS = [
  { id: "PDF-Inter", label: "Inter" },
  { id: "PDF-Nunito", label: "Nunito" },
  { id: "PDF-Helvetica", label: "Helvetica" },
  { id: "PDF-SourceSerif", label: "Serif" },
];

export function ContextualToolbar() {
  const tool = useEditorStore((s) => s.activeTool);
  const opts = useEditorStore((s) => s.toolOptions);
  const setOpts = useEditorStore((s) => s.setToolOptions);
  const selectedId = useEditorStore((s) => s.selectedElementId);
  const elements = useEditorStore((s) => s.elements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const updateElementData = useEditorStore((s) => s.updateElementData);
  const removeElement = useEditorStore((s) => s.removeElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const bringForward = useEditorStore((s) => s.bringForward);
  const sendBackward = useEditorStore((s) => s.sendBackward);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const selected = elements.find((e) => e.id === selectedId);

  if (tool === "edit-text" || tool === "hand") return null;

  return (
    <div
      data-ctx-toolbar
      className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-orange-200/50 bg-bg-card text-xs"
    >
      {(tool === "add-text" || selected?.type === "text") && (
        <>
          <select
            className="h-8 rounded border px-2 bg-white"
            value={
              (selected?.data.fontFamily as string) || opts.fontFamily
            }
            onChange={(e) => {
              setOpts({ fontFamily: e.target.value });
              if (selected) {
                pushHistory();
                updateElementData(selected.id, { fontFamily: e.target.value });
              }
            }}
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={8}
            max={72}
            className="h-8 w-14 rounded border px-1"
            value={
              selected
                ? resolveFontSizePt(selected.data)
                : opts.fontSize
            }
            onChange={(e) => {
              const fontSize = Number(e.target.value) || 14;
              setOpts({ fontSize });
              if (selected) {
                pushHistory();
                updateElementData(selected.id, { fontSize });
              }
            }}
          />
          <Toggle
            label="B"
            active={Boolean(selected?.data.bold)}
            onClick={() => {
              if (!selected) return;
              pushHistory();
              updateElementData(selected.id, { bold: !selected.data.bold });
            }}
          />
          <Toggle
            label="I"
            active={Boolean(selected?.data.italic)}
            onClick={() => {
              if (!selected) return;
              pushHistory();
              updateElementData(selected.id, { italic: !selected.data.italic });
            }}
          />
          <Color
            value={(selected?.data.color as string) || opts.strokeColor}
            onChange={(color) => {
              setOpts({ strokeColor: color });
              if (selected) {
                pushHistory();
                updateElementData(selected.id, { color });
              }
            }}
          />
          <div className="flex items-center gap-1">
            <span className="text-text-secondary font-medium">BG</span>
            <Color
              value={
                ((selected?.data.backgroundColor as string) ||
                  opts.textBackgroundColor) === "transparent"
                  ? "#FDE047"
                  : ((selected?.data.backgroundColor as string) ||
                      opts.textBackgroundColor)
              }
              onChange={(backgroundColor) => {
                setOpts({ textBackgroundColor: backgroundColor });
                if (selected?.type === "text") {
                  pushHistory();
                  updateElementData(selected.id, {
                    backgroundColor,
                    padding: Number(selected.data.padding ?? 4),
                    borderRadius: Number(selected.data.borderRadius ?? 4),
                  });
                }
              }}
              label="BG"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => {
                const current =
                  (selected?.data.backgroundColor as string) ||
                  opts.textBackgroundColor ||
                  "transparent";
                const next =
                  current === "transparent" || !current
                    ? "#FDE047"
                    : "transparent";
                setOpts({ textBackgroundColor: next });
                if (selected?.type === "text") {
                  pushHistory();
                  updateElementData(selected.id, {
                    backgroundColor: next,
                    padding: 4,
                    borderRadius: 4,
                  });
                }
              }}
            >
              {(
                (selected?.data.backgroundColor as string) ||
                opts.textBackgroundColor
              ) === "transparent" ||
              !(
                (selected?.data.backgroundColor as string) ||
                opts.textBackgroundColor
              )
                ? "Add BG"
                : "Clear BG"}
            </Button>
          </div>
        </>
      )}

      {tool === "highlight" && (
        <div className="flex items-center gap-1">
          <span className="text-text-secondary">Highlight</span>
          {HIGHLIGHT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "h-6 w-6 rounded-full border-2",
                opts.highlightColor === c ? "border-slate-800" : "border-transparent"
              )}
              style={{ background: c }}
              onClick={() => setOpts({ highlightColor: c })}
            />
          ))}
        </div>
      )}

      {(tool === "pencil" ||
        tool === "line" ||
        tool === "arrow" ||
        tool === "rectangle" ||
        tool === "ellipse") && (
        <>
          <Color
            value={opts.strokeColor}
            onChange={(strokeColor) => setOpts({ strokeColor })}
          />
          <label className="flex items-center gap-1">
            Width
            <input
              type="range"
              min={1}
              max={10}
              value={opts.strokeWidth}
              onChange={(e) =>
                setOpts({ strokeWidth: Number(e.target.value) })
              }
            />
          </label>
          {(tool === "rectangle" || tool === "ellipse") && (
            <Color
              value={
                opts.fillColor === "transparent" ? "#ffffff" : opts.fillColor
              }
              onChange={(fillColor) => setOpts({ fillColor })}
              label="Fill"
            />
          )}
        </>
      )}

      {selected && tool === "select" && (
        <>
          <label className="flex items-center gap-1">
            Opacity
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selected.opacity}
              onChange={(e) => {
                pushHistory();
                updateElement(selected.id, {
                  opacity: Number(e.target.value),
                });
              }}
            />
          </label>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => duplicateElement(selected.id)}
          >
            Duplicate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => bringForward(selected.id)}
          >
            Forward
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => sendBackward(selected.id)}
          >
            Back
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7"
            onClick={() => removeElement(selected.id)}
          >
            Delete
          </Button>
        </>
      )}
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "h-8 w-8 rounded border font-bold",
        active ? "bg-primary text-white" : "bg-white"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Color({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-1">
      {label}
      <input
        type="color"
        className="h-8 w-8 cursor-pointer rounded border p-0"
        value={value.startsWith("#") ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
