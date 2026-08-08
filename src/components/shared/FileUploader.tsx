"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, FileWarning } from "lucide-react";
import toast from "react-hot-toast";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";

type FileUploaderProps = {
  accept: Record<string, string[]>;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
};

export function FileUploader({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here or click to browse",
  hint,
  className,
  disabled,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length) {
        const err = rejected[0].errors[0];
        if (err?.code === "file-too-large") {
          toast.error(`File too large. Max ${formatBytes(MAX_FILE_SIZE)}.`);
        } else if (err?.code === "file-invalid-type") {
          toast.error("Unsupported file type.");
        } else {
          toast.error("Could not accept that file.");
        }
      }
      if (accepted.length) onFiles(accepted);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize: MAX_FILE_SIZE,
    disabled,
  });

  const acceptHint =
    hint ||
    Object.values(accept)
      .flat()
      .join(", ")
      .toUpperCase()
      .replace(/\./g, "");

  return (
    <div
      {...getRootProps()}
      role="button"
      tabIndex={0}
      aria-label={label}
      className={cn(
        "group relative cursor-pointer rounded-3xl border-2 border-dashed border-primary/35 bg-bg-card/70 p-8 sm:p-12 text-center transition-all duration-300 hover:border-primary hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isDragActive && "dropzone-active scale-[1.01]",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary shadow-soft transition-transform group-hover:scale-105">
        {isDragActive ? (
          <UploadCloud className="h-8 w-8 animate-bounce" />
        ) : (
          <UploadCloud className="h-8 w-8" />
        )}
      </div>
      <p className="text-base sm:text-lg font-semibold text-text-primary">
        {isDragActive ? "Drop to upload" : label}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {acceptHint} · Max {formatBytes(MAX_FILE_SIZE)} per file
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
        <FileWarning className="h-3.5 w-3.5" />
        Processed locally — never uploaded
      </p>
    </div>
  );
}
