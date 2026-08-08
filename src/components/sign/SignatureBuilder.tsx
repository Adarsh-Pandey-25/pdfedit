"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, PenLine, Type } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/sign/SignaturePad";
import { cn } from "@/lib/utils";
import {
  SIGNATURE_FONTS,
  SIGNATURE_INK,
  canvasToAsset,
  createTypedSignature,
  imageFileToAsset,
  injectSignatureFonts,
  trimTransparent,
  type SignatureAsset,
  type SignatureFont,
} from "@/lib/pdf/signature-engine";

const RECENTS_KEY = "pdfforge-sign-recents-v1";
const MAX_RECENTS = 6;

type Tab = "draw" | "type" | "upload";

function loadRecents(): SignatureAsset[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function storeRecent(asset: SignatureAsset): SignatureAsset[] {
  const next = [
    asset,
    ...loadRecents().filter((a) => a.dataUrl !== asset.dataUrl),
  ].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* quota — recents are a convenience only */
  }
  return next;
}

type SignatureBuilderProps = {
  active: SignatureAsset | null;
  onCreate: (asset: SignatureAsset) => void;
};

export function SignatureBuilder({ active, onCreate }: SignatureBuilderProps) {
  const [tab, setTab] = useState<Tab>("draw");
  const [ink, setInk] = useState(SIGNATURE_INK[0]);
  const [penWidth, setPenWidth] = useState(3);
  const [typed, setTyped] = useState("");
  const [font, setFont] = useState<SignatureFont>(SIGNATURE_FONTS[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [uploadAsset, setUploadAsset] = useState<SignatureAsset | null>(null);
  const [recents, setRecents] = useState<SignatureAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const drawCanvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    injectSignatureFonts();
    setRecents(loadRecents());
  }, []);

  const commit = useCallback(
    (asset: SignatureAsset) => {
      setRecents(storeRecent(asset));
      onCreate(asset);
    },
    [onCreate]
  );

  const onPadChange = useCallback((canvas: HTMLCanvasElement | null) => {
    drawCanvas.current = canvas;
  }, []);

  // Re-run the background removal whenever the toggle or the file changes.
  useEffect(() => {
    let cancelled = false;
    if (!uploadFile) {
      setUploadAsset(null);
      return undefined;
    }
    imageFileToAsset(uploadFile, { removeBackground })
      .then((asset) => {
        if (!cancelled) setUploadAsset(asset);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not read that image");
      });
    return () => {
      cancelled = true;
    };
  }, [uploadFile, removeBackground]);

  const useSignature = async () => {
    setBusy(true);
    try {
      if (tab === "draw") {
        if (!drawCanvas.current) {
          toast.error("Draw your signature first");
          return;
        }
        const trimmed = trimTransparent(drawCanvas.current);
        if (!trimmed) {
          toast.error("Draw your signature first");
          return;
        }
        commit(canvasToAsset(trimmed));
      } else if (tab === "type") {
        const asset = await createTypedSignature(typed, font, ink);
        if (!asset) {
          toast.error("Type your name first");
          return;
        }
        commit(asset);
      } else {
        if (!uploadAsset) {
          toast.error("Upload a signature image first");
          return;
        }
        commit(uploadAsset);
      }
      toast.success("Signature ready — click the page to place it");
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof PenLine }[] = [
    { id: "draw", label: "Draw", icon: PenLine },
    { id: "type", label: "Type", icon: Type },
    { id: "upload", label: "Upload", icon: ImagePlus },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-primary/10 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              tab === id
                ? "bg-primary text-white shadow-soft"
                : "text-text-primary hover:bg-primary/10"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab !== "upload" && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text-primary">Ink</span>
          <div className="flex gap-1.5">
            {SIGNATURE_INK.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setInk(color)}
                aria-label={`Ink colour ${color}`}
                aria-pressed={ink === color}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-transform",
                  ink === color
                    ? "scale-110 border-text-primary"
                    : "border-transparent hover:scale-105"
                )}
                style={{ background: color }}
              />
            ))}
          </div>
          {tab === "draw" && (
            <label className="ml-auto flex items-center gap-2 text-xs text-text-secondary">
              Thickness
              <input
                type="range"
                min={1}
                max={8}
                value={penWidth}
                onChange={(e) => setPenWidth(Number(e.target.value))}
                className="w-20 accent-primary"
              />
            </label>
          )}
        </div>
      )}

      {tab === "draw" && (
        <SignaturePad
          color={ink}
          penWidth={penWidth}
          onCanvasReady={onPadChange}
        />
      )}

      {tab === "type" && (
        <div className="space-y-3">
          <Input
            value={typed}
            placeholder="Type your name"
            onChange={(e) => setTyped(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            {SIGNATURE_FONTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFont(option)}
                className={cn(
                  "overflow-hidden rounded-xl border-2 px-3 py-2 text-left transition-all",
                  font.id === option.id
                    ? "border-primary bg-primary/10"
                    : "border-primary/15 hover:border-primary/40"
                )}
              >
                <span className="block text-[10px] uppercase tracking-wide text-text-secondary">
                  {option.label}
                </span>
                <span
                  className="block truncate text-2xl leading-tight"
                  style={{ fontFamily: option.cssFamily, color: ink }}
                >
                  {typed.trim() || "Signature"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "upload" && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="sig-upload">Signature image</Label>
            <Input
              id="sig-upload"
              type="file"
              accept="image/*"
              className="mt-1.5"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-text-secondary">
              PNG, JPG, WEBP, or a photo of a signature on paper.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={removeBackground}
              onChange={(e) => setRemoveBackground(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Remove white background
          </label>
          {uploadAsset && (
            <div className="rounded-xl border border-primary/15 bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-[length:16px_16px] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadAsset.dataUrl}
                alt="Signature preview"
                className="mx-auto max-h-24 object-contain"
              />
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={useSignature}
        disabled={busy}
      >
        <Check className="h-4 w-4" />
        Use this signature
      </Button>

      {recents.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-text-secondary">
            Recent signatures
          </p>
          <div className="flex flex-wrap gap-2">
            {recents.map((asset) => (
              <button
                key={asset.dataUrl}
                type="button"
                onClick={() => onCreate(asset)}
                className={cn(
                  "rounded-lg border-2 bg-white p-1 transition-all",
                  active?.dataUrl === asset.dataUrl
                    ? "border-primary"
                    : "border-primary/15 hover:border-primary/40"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.dataUrl}
                  alt="Saved signature"
                  className="h-10 w-24 object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
