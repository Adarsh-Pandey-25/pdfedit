"use client";

import { useCallback } from "react";

export function useConfetti() {
  return useCallback(async () => {
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#F97316", "#EF4444", "#FBBF24", "#FED7AA"],
    });
  }, []);
}
