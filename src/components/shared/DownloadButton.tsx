"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";

type DownloadButtonProps = {
  onClick: () => void;
  filename?: string;
  size?: number;
  disabled?: boolean;
  label?: string;
};

export function DownloadButton({
  onClick,
  filename,
  size,
  disabled,
  label = "Download",
}: DownloadButtonProps) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="min-w-[180px]"
      aria-label={filename ? `Download ${filename}` : label}
    >
      <Download className="h-5 w-5" />
      <span className="flex flex-col items-start leading-tight">
        <span>{label}</span>
        {(filename || size !== undefined) && (
          <span className="text-[10px] font-normal opacity-90">
            {[filename, size !== undefined ? formatBytes(size) : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </span>
    </Button>
  );
}
