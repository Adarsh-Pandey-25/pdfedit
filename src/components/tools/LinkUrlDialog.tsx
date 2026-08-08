"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidLinkUrl, normalizeLinkUrl } from "@/lib/pdf/link-utils";

type Props = {
  open: boolean;
  initialUrl?: string;
  title?: string;
  onConfirm: (url: string) => void;
  onCancel: () => void;
};

/**
 * URL entry dialog for the Links tool only.
 */
export function LinkUrlDialog({
  open,
  initialUrl = "https://",
  title = "Add link",
  onConfirm,
  onCancel,
}: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(initialUrl || "https://");
    setError("");
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => window.clearTimeout(t);
  }, [open, initialUrl]);

  if (!open) return null;

  const submit = () => {
    const normalized = normalizeLinkUrl(url);
    if (!isValidLinkUrl(normalized)) {
      setError("Enter a valid URL, email, or phone link");
      return;
    }
    onConfirm(normalized);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-xl border border-primary/15 bg-bg-card shadow-soft p-4 space-y-3"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Link2 className="h-4 w-4 text-primary" />
            {title}
          </div>
          <button
            type="button"
            className="p-1 rounded hover:bg-primary/10"
            onClick={onCancel}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-text-secondary">
          Draw a region on the page, then enter the destination URL. The
          downloaded PDF will open this link when clicked.
        </p>

        <Input
          ref={inputRef}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          placeholder="https://example.com"
          className="font-mono text-sm"
          spellCheck={false}
          autoComplete="off"
        />

        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          <p className="text-[11px] text-text-secondary truncate">
            Will save as: {normalizeLinkUrl(url) || "—"}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={submit}>
            <ExternalLink className="h-3.5 w-3.5" />
            Save link
          </Button>
        </div>
      </div>
    </div>
  );
}
