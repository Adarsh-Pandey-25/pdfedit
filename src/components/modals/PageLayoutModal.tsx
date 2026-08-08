"use client";

import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/editor-store";
import toast from "react-hot-toast";

type Props = {
  onApply?: (opts: {
    size: string;
    orientation: "portrait" | "landscape";
    margins: { top: number; right: number; bottom: number; left: number };
    bg: string;
    scope: "all" | "current";
  }) => void;
  onAddBlank?: () => void;
};

export function PageLayoutModal({ onApply, onAddBlank }: Props) {
  const open = useEditorStore((s) => s.layoutOpen);
  const setOpen = useEditorStore((s) => s.setLayoutOpen);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-bg-card rounded-2xl w-full max-w-md shadow-soft p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Page layout</h2>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
        <label className="block text-sm">
          Page size
          <select id="layout-size" className="mt-1 w-full h-9 rounded border px-2" defaultValue="A4">
            <option>A4</option>
            <option>Letter</option>
            <option>Legal</option>
            <option>Custom</option>
          </select>
        </label>
        <label className="block text-sm">
          Orientation
          <select id="layout-orient" className="mt-1 w-full h-9 rounded border px-2" defaultValue="portrait">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <label key={side}>
              Margin {side} (pt)
              <input
                id={`margin-${side}`}
                type="number"
                defaultValue={36}
                className="mt-1 w-full h-9 rounded border px-2"
              />
            </label>
          ))}
        </div>
        <label className="block text-sm">
          Background
          <input id="layout-bg" type="color" defaultValue="#ffffff" className="mt-1 block h-9 w-full" />
        </label>
        <label className="block text-sm">
          Apply to
          <select id="layout-scope" className="mt-1 w-full h-9 rounded border px-2" defaultValue="current">
            <option value="current">Current page only</option>
            <option value="all">All pages</option>
          </select>
        </label>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              const size = (document.getElementById("layout-size") as HTMLSelectElement).value;
              const orientation = (document.getElementById("layout-orient") as HTMLSelectElement)
                .value as "portrait" | "landscape";
              const scope = (document.getElementById("layout-scope") as HTMLSelectElement)
                .value as "all" | "current";
              const bg = (document.getElementById("layout-bg") as HTMLInputElement).value;
              const margins = {
                top: Number((document.getElementById("margin-top") as HTMLInputElement).value),
                right: Number((document.getElementById("margin-right") as HTMLInputElement).value),
                bottom: Number((document.getElementById("margin-bottom") as HTMLInputElement).value),
                left: Number((document.getElementById("margin-left") as HTMLInputElement).value),
              };
              onApply?.({ size, orientation, margins, bg, scope });
              toast.success("Layout preferences saved for export");
              setOpen(false);
            }}
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onAddBlank?.();
              toast.success("Blank page will be added on export");
              setOpen(false);
            }}
          >
            Add blank page
          </Button>
        </div>
      </div>
    </div>
  );
}
