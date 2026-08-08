"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { Upload } from "lucide-react";
import { stashPendingEditPdf } from "@/lib/editor-session";
import { Button } from "@/components/ui/button";
import { cn, formatBytes } from "@/lib/utils";

const HERO_MAX_BYTES = 100 * 1024 * 1024;

export function HeroSection() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file || (file.type && file.type !== "application/pdf")) {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > HERO_MAX_BYTES) {
        toast.error(`File must be under ${formatBytes(HERO_MAX_BYTES)}`);
        return;
      }

      setUploading(true);
      try {
        const buf = await file.arrayBuffer();
        await stashPendingEditPdf(buf, file.name, file.size);
        router.push("/edit");
      } catch (e) {
        console.error(e);
        toast.error("Could not prepare that PDF");
        setUploading(false);
      }
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: HERO_MAX_BYTES,
    multiple: false,
    disabled: uploading,
    noClick: false,
    onDrop: (accepted, rejected) => {
      if (rejected.length) {
        const err = rejected[0]?.errors?.[0];
        toast.error(
          err?.code === "file-too-large"
            ? `File must be under ${formatBytes(HERO_MAX_BYTES)}`
            : "Please upload a valid PDF file"
        );
        return;
      }
      if (accepted[0]) void handleFileUpload(accepted[0]);
    },
  });

  return (
    <section className="relative overflow-hidden bg-bg-primary">
      <div className="relative container-max section-pad pt-2 pb-8 sm:pt-3 sm:pb-10 md:pb-12 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-balance max-w-4xl mx-auto text-text-primary leading-tight anim-fade-up px-1">
          Edit, Convert &amp; Manage PDFs Free &amp; Online
        </h1>

        <div
          className="mt-5 sm:mt-6 md:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 anim-fade-up px-4 sm:px-0"
          style={{ animationDelay: "0.05s" }}
        >
          <Button asChild size="lg" className="w-full sm:w-auto text-sm sm:text-base">
            <a href="#tools">Explore tools</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
            <Link href="/merge">Merge PDFs</Link>
          </Button>
        </div>

        <div
          className="mt-5 sm:mt-6 md:mt-8 mx-auto max-w-md sm:max-w-lg md:max-w-xl anim-fade-up px-1"
          style={{ animationDelay: "0.1s" }}
        >
          <div
            {...getRootProps()}
            className={cn(
              "rounded-2xl border-2 border-dashed border-primary/35 bg-bg-card px-4 py-6 sm:px-6 sm:py-7 transition-all duration-200 cursor-pointer outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isDragActive
                ? "border-primary bg-primary-light/30"
                : "hover:border-primary/60 hover:bg-primary/[0.03]",
              uploading && "pointer-events-none opacity-90"
            )}
          >
            <input {...getInputProps()} aria-label="Upload PDF to edit" />

            {uploading ? (
              <div className="flex flex-col items-center justify-center text-center gap-2">
                <div
                  className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-text-primary">
                  Opening editor…
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2">
                <Upload
                  className="h-7 w-7 sm:h-8 sm:w-8 text-primary"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="text-base sm:text-lg font-bold text-text-primary">
                  {isDragActive
                    ? "Drop your PDF to edit"
                    : "Drop a PDF here to edit"}
                </p>
                <p className="text-xs sm:text-sm text-text-secondary px-2">
                  or click to browse · Max {formatBytes(HERO_MAX_BYTES)} · stays
                  on your device
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  className="mt-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-dark transition-colors"
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Upload PDF to Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
