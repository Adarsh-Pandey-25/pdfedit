"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/editor-store";
import toast from "react-hot-toast";

const SIG_KEY = "pdfforge-signatures-v1";
const CURSIVE = [
  "Dancing Script",
  "Great Vibes",
  "Pacifico",
  "Caveat",
] as const;

function loadSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SIG_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSig(dataUrl: string) {
  const list = loadSaved().filter((s) => s !== dataUrl);
  list.unshift(dataUrl);
  localStorage.setItem(SIG_KEY, JSON.stringify(list.slice(0, 8)));
}

export function SignatureModal() {
  const open = useEditorStore((s) => s.signatureOpen);
  const setOpen = useEditorStore((s) => s.setSignatureOpen);
  const setPending = useEditorStore((s) => s.setPendingPlace);
  const setTool = useEditorStore((s) => s.setTool);

  const [tab, setTab] = useState<"draw" | "type" | "upload">("draw");
  const [pen, setPen] = useState("#111827");
  const [typed, setTyped] = useState("Your Name");
  const [font, setFont] = useState<string>(CURSIVE[0]);
  const [saved, setSaved] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const points = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (open) setSaved(loadSaved());
  }, [open]);

  useEffect(() => {
    // Load Google Fonts for typed signatures
    if (typeof document === "undefined") return;
    if (document.getElementById("pdf-cursive-fonts")) return;
    const link = document.createElement("link");
    link.id = "pdf-cursive-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Pacifico&display=swap";
    document.head.appendChild(link);
  }, []);

  if (!open) return null;

  const clearPad = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    points.current = [];
  };

  const commitDataUrl = async (dataUrl: string) => {
    saveSig(dataUrl);
    const ar = await new Promise<number>((res) => {
      const img = new Image();
      img.onload = () => res(img.width / Math.max(1, img.height));
      img.onerror = () => res(3);
      img.src = dataUrl;
    });
    setPending({ type: "signature", imageData: dataUrl, aspectRatio: ar });
    setOpen(false);
    setTool("sign");
    toast.success("Click on the page to place your signature");
  };

  const saveDrawn = () => {
    const c = canvasRef.current;
    if (!c) return;
    commitDataUrl(c.toDataURL("image/png"));
  };

  const saveTyped = () => {
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 160;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#111";
    ctx.font = `64px "${font}", cursive`;
    ctx.textBaseline = "middle";
    ctx.fillText(typed || "Signature", 20, 80);
    commitDataUrl(c.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-bg-card rounded-2xl w-full max-w-lg shadow-soft p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Signature</h2>
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
        <div className="flex gap-2 mb-3">
          {(["draw", "type", "upload"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "default" : "outline"}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        {tab === "draw" && (
          <div>
            <canvas
              ref={canvasRef}
              width={500}
              height={180}
              className="w-full touch-none cursor-crosshair rounded-xl border border-primary/20 bg-white shadow-sm"
              onPointerDown={(e) => {
                drawing.current = true;
                const c = canvasRef.current!;
                const ctx = c.getContext("2d")!;
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * c.width;
                const y = ((e.clientY - r.top) / r.height) * c.height;
                points.current = [{ x, y }];
                ctx.strokeStyle = pen;
                ctx.fillStyle = pen;
                ctx.lineWidth = 2.5;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                // Dot for a tap
                ctx.beginPath();
                ctx.arc(x, y, 1.25, 0, Math.PI * 2);
                ctx.fill();
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!drawing.current) return;
                const c = canvasRef.current!;
                const ctx = c.getContext("2d")!;
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * c.width;
                const y = ((e.clientY - r.top) / r.height) * c.height;
                const pts = points.current;
                const prev = pts[pts.length - 1];
                if (!prev) return;
                // Continuous solid stroke (old quadraticCurveTo drew broken dashes)
                ctx.strokeStyle = pen;
                ctx.lineWidth = 2.5;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(x, y);
                ctx.stroke();
                pts.push({ x, y });
              }}
              onPointerUp={() => {
                drawing.current = false;
              }}
              onPointerCancel={() => {
                drawing.current = false;
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              {["#111827", "#1d4ed8", "#dc2626"].map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-7 w-7 rounded-full border-2"
                  style={{
                    background: c,
                    borderColor: pen === c ? "#000" : "transparent",
                  }}
                  onClick={() => setPen(c)}
                />
              ))}
              <Button size="sm" variant="outline" onClick={clearPad}>
                Clear
              </Button>
              <Button size="sm" onClick={saveDrawn}>
                Save signature
              </Button>
            </div>
          </div>
        )}

        {tab === "type" && (
          <div className="space-y-3">
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              {CURSIVE.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`rounded-lg border p-3 text-left ${font === f ? "border-primary" : ""}`}
                  style={{ fontFamily: `"${f}", cursive`, fontSize: 28 }}
                  onClick={() => setFont(f)}
                >
                  {typed || "Signature"}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={saveTyped}>
              Use this signature
            </Button>
          </div>
        )}

        {tab === "upload" && (
          <div>
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const raw = await file.arrayBuffer();
                const blob = new Blob([raw], { type: file.type });
                const url = URL.createObjectURL(blob);
                // Optional near-white removal for PNG canvas
                const img = new Image();
                img.onload = () => {
                  const c = document.createElement("canvas");
                  c.width = img.width;
                  c.height = img.height;
                  const ctx = c.getContext("2d")!;
                  ctx.drawImage(img, 0, 0);
                  try {
                    const id = ctx.getImageData(0, 0, c.width, c.height);
                    for (let i = 0; i < id.data.length; i += 4) {
                      if (
                        id.data[i] > 245 &&
                        id.data[i + 1] > 245 &&
                        id.data[i + 2] > 245
                      ) {
                        id.data[i + 3] = 0;
                      }
                    }
                    ctx.putImageData(id, 0, 0);
                  } catch {
                    /* tainted */
                  }
                  commitDataUrl(c.toDataURL("image/png"));
                  URL.revokeObjectURL(url);
                };
                img.src = url;
              }}
            />
          </div>
        )}

        {saved.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium mb-2">Recent</p>
            <div className="flex gap-2 overflow-x-auto">
              {saved.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={s}
                  alt=""
                  className="h-12 bg-white border rounded cursor-pointer"
                  onClick={() => commitDataUrl(s)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
