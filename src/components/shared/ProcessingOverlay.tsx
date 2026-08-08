"use client";

import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type ProcessingOverlayProps = {
  open: boolean;
  progress?: number;
  message?: string;
};

export function ProcessingOverlay({
  open,
  progress = 0,
  message = "Processing your file…",
}: ProcessingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={message}
    >
      <div className="w-full max-w-sm rounded-3xl card-surface p-8 text-center shadow-soft">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 font-semibold text-text-primary">{message}</p>
        <Progress value={progress} className="mt-5" />
        <p className="mt-2 text-xs text-text-secondary">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}
