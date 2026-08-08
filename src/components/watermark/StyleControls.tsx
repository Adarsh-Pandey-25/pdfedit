"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  WATERMARK_FONTS,
  clamp,
  supportsBold,
  supportsItalic,
  type WatermarkFontFamily,
  type WatermarkSettings,
} from "@/lib/pdf/watermark-engine";

const SWATCHES = [
  "#000000",
  "#DC2626",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#6B7280",
  "#EC4899",
];

const ANGLE_PRESETS = [-45, 0, 45, 90];

type StyleControlsProps = {
  settings: WatermarkSettings;
  onChange: (patch: Partial<WatermarkSettings>) => void;
  maxFontSize: number | null;
};

export function StyleControls({
  settings,
  onChange,
  maxFontSize,
}: StyleControlsProps) {
  const boldAvailable = supportsBold(settings.fontFamily);
  const italicAvailable = supportsItalic(settings.fontFamily);
  const showSizeWarning =
    maxFontSize !== null && settings.fontSize > maxFontSize;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="wm-font"
            className="mb-1.5 block text-sm font-semibold text-text-primary"
          >
            Font
          </label>
          <select
            id="wm-font"
            value={settings.fontFamily}
            onChange={(e) =>
              onChange({ fontFamily: e.target.value as WatermarkFontFamily })
            }
            className="h-11 w-full rounded-xl border border-primary/20 bg-bg-card px-3 text-sm text-text-primary"
          >
            {Object.entries(WATERMARK_FONTS).map(([key, def]) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-text-primary">
            Style
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ bold: !settings.bold })}
              disabled={!boldAvailable}
              aria-pressed={settings.bold}
              title={boldAvailable ? "Bold" : "Bold not available for this font"}
              className={cn(
                "h-11 flex-1 rounded-xl border-2 font-bold transition-all disabled:opacity-40",
                settings.bold && boldAvailable
                  ? "border-primary bg-primary text-white"
                  : "border-primary/20 text-text-primary hover:border-primary/50"
              )}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => onChange({ italic: !settings.italic })}
              disabled={!italicAvailable}
              aria-pressed={settings.italic}
              title={
                italicAvailable ? "Italic" : "Italic not available for this font"
              }
              className={cn(
                "h-11 flex-1 rounded-xl border-2 italic transition-all disabled:opacity-40",
                settings.italic && italicAvailable
                  ? "border-primary bg-primary text-white"
                  : "border-primary/20 text-text-primary hover:border-primary/50"
              )}
            >
              I
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="wm-size-range"
            className="text-sm font-semibold text-text-primary"
          >
            Font size
          </label>
          <span className="font-mono text-sm text-primary">
            {settings.fontSize}pt
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="wm-size-range"
            type="range"
            min={12}
            max={200}
            value={clamp(settings.fontSize, 12, 200)}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
          <input
            type="number"
            aria-label="Font size in points"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            value={settings.fontSize}
            onChange={(e) =>
              onChange({
                fontSize: clamp(
                  Number(e.target.value) || MIN_FONT_SIZE,
                  MIN_FONT_SIZE,
                  MAX_FONT_SIZE
                ),
              })
            }
            className="h-9 w-16 rounded-lg border border-primary/20 bg-bg-card px-2 text-center text-sm text-text-primary"
          />
        </div>
        {showSizeWarning && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Font size may cause the watermark to be clipped. Recommended max:{" "}
              {maxFontSize}pt.
            </span>
            <button
              type="button"
              onClick={() => onChange({ fontSize: maxFontSize! })}
              className="font-semibold underline underline-offset-2"
            >
              Auto-fit
            </button>
          </div>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-text-primary">
          Color
        </span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Custom watermark color"
            value={settings.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-11 w-12 cursor-pointer rounded-lg border-2 border-primary/20 bg-bg-card p-1"
          />
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => onChange({ color: swatch })}
                title={swatch}
                aria-label={`Use color ${swatch}`}
                aria-pressed={
                  settings.color.toLowerCase() === swatch.toLowerCase()
                }
                className={cn(
                  "h-8 w-8 rounded-lg border-2 transition-all",
                  settings.color.toLowerCase() === swatch.toLowerCase()
                    ? "scale-110 border-text-primary"
                    : "border-primary/15 hover:scale-105"
                )}
                style={{ background: swatch }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="wm-opacity"
            className="text-sm font-semibold text-text-primary"
          >
            Opacity
          </label>
          <span className="font-mono text-sm text-primary">
            {settings.opacity}%
          </span>
        </div>
        <div className="relative h-8 overflow-hidden rounded-lg bg-bg-secondary">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-light to-primary transition-all"
            style={{ width: `${settings.opacity}%` }}
          />
          <input
            id="wm-opacity"
            type="range"
            min={5}
            max={100}
            value={settings.opacity}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="wm-angle"
            className="text-sm font-semibold text-text-primary"
          >
            Rotation
          </label>
          <span className="font-mono text-sm text-primary">
            {settings.angle}°
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-primary/30 bg-primary/10 transition-transform"
            style={{ transform: `rotate(${-settings.angle}deg)` }}
          >
            <span className="text-xs font-bold text-primary">ABC</span>
          </div>
          <input
            id="wm-angle"
            type="range"
            min={-90}
            max={90}
            step={5}
            value={settings.angle}
            onChange={(e) => onChange({ angle: Number(e.target.value) })}
            className="flex-1 accent-primary"
          />
        </div>
        <div className="mt-2 flex gap-2">
          {ANGLE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ angle: preset })}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs transition-all",
                settings.angle === preset
                  ? "border-primary bg-primary text-white"
                  : "border-primary/25 text-text-secondary hover:border-primary/60"
              )}
            >
              {preset}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
