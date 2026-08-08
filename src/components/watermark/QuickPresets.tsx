"use client";

import { cn } from "@/lib/utils";
import type { WatermarkPreset } from "@/lib/pdf/watermark-engine";

export const WATERMARK_PRESETS: WatermarkPreset[] = [
  {
    name: "Confidential",
    icon: "🔒",
    text: "CONFIDENTIAL",
    color: "#DC2626",
    angle: -45,
    opacity: 25,
    fontSize: 80,
    position: "center",
  },
  {
    name: "Draft",
    icon: "📝",
    text: "DRAFT",
    color: "#F59E0B",
    angle: -30,
    opacity: 35,
    fontSize: 90,
    position: "center",
  },
  {
    name: "Copy",
    icon: "📋",
    text: "COPY",
    color: "#6B7280",
    angle: 0,
    opacity: 30,
    fontSize: 60,
    position: "top-right",
  },
  {
    name: "Sample",
    icon: "🎯",
    text: "SAMPLE",
    color: "#3B82F6",
    angle: -45,
    opacity: 20,
    fontSize: 100,
    position: "center",
  },
  {
    name: "Approved",
    icon: "✅",
    text: "APPROVED",
    color: "#10B981",
    angle: -15,
    opacity: 40,
    fontSize: 70,
    position: "center",
  },
  {
    name: "Original",
    icon: "⭐",
    text: "ORIGINAL",
    color: "#8B5CF6",
    angle: -45,
    opacity: 25,
    fontSize: 85,
    position: "center",
  },
];

type QuickPresetsProps = {
  onApply: (preset: WatermarkPreset) => void;
  activeName?: string | null;
};

export function QuickPresets({ onApply, activeName }: QuickPresetsProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-primary">
        Quick presets
      </p>
      <div className="grid grid-cols-3 gap-2">
        {WATERMARK_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onApply(preset)}
            aria-pressed={activeName === preset.name}
            className={cn(
              "rounded-xl border-2 p-3 text-center transition-all",
              activeName === preset.name
                ? "border-primary bg-primary/10 shadow-soft"
                : "border-primary/15 hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <span className="block text-2xl leading-none">{preset.icon}</span>
            <span className="mt-1.5 block text-xs font-medium text-text-secondary">
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
