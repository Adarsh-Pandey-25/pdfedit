"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAD_WIDTH = 640;
const PAD_HEIGHT = 220;

type Stroke = { color: string; width: number; points: { x: number; y: number }[] };

type SignaturePadProps = {
  color: string;
  penWidth: number;
  /** Fired with the trimmed pad canvas; null when nothing has been drawn. */
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
};

export function SignaturePad({
  color,
  penWidth,
  onCanvasReady,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef<Stroke | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Cleared to transparent, never filled — a white fill would stamp an
    // opaque box over the page.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes.current) {
      const points = stroke.points;
      if (!points.length) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();

      if (points.length === 1) {
        ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        continue;
      }

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i++) {
        const mid = {
          x: (points[i].x + points[i + 1].x) / 2,
          y: (points[i].y + points[i + 1].y) / 2,
        };
        ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    }
  }, []);

  const publish = useCallback(() => {
    const ink = strokes.current.some((s) => s.points.length > 0);
    setHasInk(ink);
    onCanvasReady(ink ? canvasRef.current : null);
  }, [onCanvasReady]);

  useEffect(() => {
    redraw();
    publish();
  }, [redraw, publish]);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    active.current = { color, width: penWidth, points: [pointFrom(e)] };
    strokes.current.push(active.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active.current) return;
    active.current.points.push(pointFrom(e));
    redraw();
  };

  const endStroke = () => {
    if (!active.current) return;
    active.current = null;
    publish();
  };

  const undo = () => {
    strokes.current.pop();
    redraw();
    publish();
  };

  const clear = () => {
    strokes.current = [];
    redraw();
    publish();
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          width={PAD_WIDTH}
          height={PAD_HEIGHT}
          className="w-full cursor-crosshair touch-none bg-white"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
        {!hasInk && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Draw your signature here
          </p>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!hasInk}
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={clear}
          disabled={!hasInk}
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </Button>
        <span
          className={cn(
            "ml-auto self-center text-xs",
            hasInk ? "text-emerald-600" : "text-text-secondary"
          )}
        >
          {hasInk ? "Signature ready" : "Pad empty"}
        </span>
      </div>
    </div>
  );
}
