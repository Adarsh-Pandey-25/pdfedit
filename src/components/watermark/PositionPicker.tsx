"use client";

import { cn } from "@/lib/utils";
import {
  WATERMARK_POSITIONS,
  type WatermarkPosition,
} from "@/lib/pdf/watermark-engine";

const ALIGN_X: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const ALIGN_Y: Record<string, string> = {
  top: "items-start",
  middle: "items-center",
  bottom: "items-end",
};

function axes(position: WatermarkPosition) {
  if (position === "center") return { row: "middle", col: "center" };
  const [row, col] = position.split("-");
  return { row, col };
}

type PositionPickerProps = {
  value: WatermarkPosition;
  onChange: (position: WatermarkPosition) => void;
};

export function PositionPicker({ value, onChange }: PositionPickerProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-primary">Position</p>
      <div className="inline-block rounded-2xl border-2 border-primary/15 bg-bg-secondary/60 p-3">
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Watermark position"
        >
          {WATERMARK_POSITIONS.map((position) => {
            const { row, col } = axes(position);
            const selected = value === position;
            return (
              <button
                key={position}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={position.replace("-", " ")}
                title={position.replace("-", " ")}
                onClick={() => onChange(position)}
                className={cn(
                  "flex h-12 w-12 rounded-lg border-2 p-2 transition-all",
                  ALIGN_X[col],
                  ALIGN_Y[row],
                  selected
                    ? "scale-105 border-primary bg-primary shadow-soft"
                    : "border-primary/20 bg-bg-card hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    selected ? "scale-125 bg-white" : "bg-primary/40"
                  )}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs capitalize text-text-secondary">
          {value.replace("-", " ")}
        </p>
      </div>
    </div>
  );
}
