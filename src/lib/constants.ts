import type { LucideIcon } from "lucide-react";
import {
  Combine,
  Scissors,
  Minimize2,
  ImageIcon,
  Images,
  FileType,
  RotateCw,
  Droplets,
  Hash,
  Eye,
  Pencil,
  Lock,
  Unlock,
  PenTool,
  FileText,
} from "lucide-react";

export const SITE_NAME = "PDFForge";
export const SITE_URL = "https://pdfforge.app";
export const SITE_DESCRIPTION =
  "Free online PDF editor with 15+ tools. Edit text, merge, split, compress, convert, sign, and watermark PDFs. No signup, no watermarks — files never leave your browser.";
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export type ToolSlug =
  | "merge"
  | "split"
  | "compress"
  | "pdf-to-image"
  | "image-to-pdf"
  | "word-to-pdf"
  | "text-to-pdf"
  | "rotate"
  | "watermark"
  | "page-numbers"
  | "viewer"
  | "edit"
  | "protect"
  | "unlock"
  | "sign"
  | "extract-text";

export interface ToolDef {
  slug: ToolSlug;
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accept: string[];
  keywords: string[];
}

export const TOOLS: ToolDef[] = [
  {
    slug: "merge",
    title: "Merge PDF",
    shortTitle: "Merge",
    description: "Combine multiple PDFs into one document",
    href: "/merge",
    icon: Combine,
    accept: ["application/pdf"],
    keywords: ["merge", "combine", "join pdf"],
  },
  {
    slug: "split",
    title: "Split PDF",
    shortTitle: "Split",
    description: "Extract pages from your PDF",
    href: "/split",
    icon: Scissors,
    accept: ["application/pdf"],
    keywords: ["split", "extract pages", "separate"],
  },
  {
    slug: "compress",
    title: "Compress PDF",
    shortTitle: "Compress",
    description: "Reduce PDF file size",
    href: "/compress",
    icon: Minimize2,
    accept: ["application/pdf"],
    keywords: ["compress", "reduce size", "optimize"],
  },
  {
    slug: "pdf-to-image",
    title: "PDF to Image",
    shortTitle: "PDF→Image",
    description: "Convert PDF pages to images",
    href: "/pdf-to-image",
    icon: ImageIcon,
    accept: ["application/pdf"],
    keywords: ["pdf to png", "pdf to jpg", "convert"],
  },
  {
    slug: "image-to-pdf",
    title: "Image to PDF",
    shortTitle: "Image→PDF",
    description: "Create PDF from images",
    href: "/image-to-pdf",
    icon: Images,
    accept: ["image/jpeg", "image/png", "image/webp"],
    keywords: ["jpg to pdf", "png to pdf", "images"],
  },
  {
    slug: "word-to-pdf",
    title: "Word to PDF",
    shortTitle: "Word→PDF",
    description: "Convert Word documents to PDF",
    href: "/word-to-pdf",
    icon: FileType,
    accept: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    keywords: ["docx", "word", "convert"],
  },
  {
    slug: "text-to-pdf",
    title: "Text to PDF",
    shortTitle: "Text→PDF",
    description: "Create a styled PDF from text or Markdown",
    href: "/text-to-pdf",
    icon: FileText,
    accept: ["text/plain", "text/markdown"],
    keywords: ["text to pdf", "markdown", "unicode", "document"],
  },
  {
    slug: "rotate",
    title: "Rotate PDF",
    shortTitle: "Rotate",
    description: "Rotate PDF pages",
    href: "/rotate",
    icon: RotateCw,
    accept: ["application/pdf"],
    keywords: ["rotate", "orientation", "turn"],
  },
  {
    slug: "watermark",
    title: "Watermark",
    shortTitle: "Watermark",
    description: "Add watermark to PDF",
    href: "/watermark",
    icon: Droplets,
    accept: ["application/pdf"],
    keywords: ["watermark", "brand", "stamp"],
  },
  {
    slug: "page-numbers",
    title: "Page Numbers",
    shortTitle: "Numbers",
    description: "Add page numbers to PDF",
    href: "/page-numbers",
    icon: Hash,
    accept: ["application/pdf"],
    keywords: ["page numbers", "pagination"],
  },
  {
    slug: "viewer",
    title: "PDF Viewer",
    shortTitle: "Viewer",
    description: "View and read PDFs online",
    href: "/viewer",
    icon: Eye,
    accept: ["application/pdf"],
    keywords: ["viewer", "reader", "read pdf"],
  },
  {
    slug: "edit",
    title: "Edit PDF",
    shortTitle: "Edit",
    description: "Add text, shapes & annotations",
    href: "/edit",
    icon: Pencil,
    accept: ["application/pdf"],
    keywords: ["edit", "annotate", "draw"],
  },
  {
    slug: "protect",
    title: "Protect PDF",
    shortTitle: "Protect",
    description: "Add password protection",
    href: "/protect",
    icon: Lock,
    accept: ["application/pdf"],
    keywords: ["password", "encrypt", "secure"],
  },
  {
    slug: "unlock",
    title: "Unlock PDF",
    shortTitle: "Unlock",
    description: "Remove PDF password",
    href: "/unlock",
    icon: Unlock,
    accept: ["application/pdf"],
    keywords: ["unlock", "remove password", "decrypt"],
  },
  {
    slug: "sign",
    title: "Sign PDF",
    shortTitle: "Sign",
    description: "Add signature to PDF",
    href: "/sign",
    icon: PenTool,
    accept: ["application/pdf"],
    keywords: ["sign", "signature", "esign"],
  },
  {
    slug: "extract-text",
    title: "Extract Text",
    shortTitle: "Extract",
    description: "Extract text from PDF",
    href: "/extract-text",
    icon: FileText,
    accept: ["application/pdf"],
    keywords: ["extract text", "ocr", "copy text"],
  },
];

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
