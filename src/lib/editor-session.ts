"use client";

import { get, set, del } from "idb-keyval";
import type { EditableTextItem } from "@/lib/pdf/text-extraction";
import type { AnnotationStroke } from "@/lib/pdf/pdf-export";

const SESSION_KEY = "pdfedit-edit-session-v1";
const PDF_KEY = "pdfedit-edit-pdf-v1";
const PENDING_PDF_KEY = "pdfedit-pending-edit-pdf-v1";
const PENDING_META_KEY = "pdfedit-pending-edit-meta-v1";

/**
 * Pre-rebrand key names. Carried over once on first read so an edit that was
 * in progress across the PdfEdit+ rename is not silently dropped.
 */
const LEGACY_KEYS: ReadonlyArray<readonly [string, string]> = [
  [SESSION_KEY, "pdfforge-edit-session-v1"],
  [PDF_KEY, "pdfforge-edit-pdf-v1"],
  [PENDING_PDF_KEY, "pdfforge-pending-edit-pdf-v1"],
  [PENDING_META_KEY, "pdfforge-pending-edit-meta-v1"],
];

let legacyMigration: Promise<void> | null = null;

function migrateLegacyKeys(): Promise<void> {
  legacyMigration ??= Promise.all(
    LEGACY_KEYS.map(async ([current, legacy]) => {
      const value = await get(legacy);
      if (value === undefined) return;
      if ((await get(current)) === undefined) await set(current, value);
      await del(legacy);
    })
  ).then(() => undefined);
  return legacyMigration;
}

export type EditorSession = {
  filename: string;
  page: number;
  scale: number;
  textItems: EditableTextItem[];
  strokes: Record<number, AnnotationStroke[]>;
  savedAt: number;
};

export type PendingEditPdf = {
  filename: string;
  size: number;
  pdfBytes: ArrayBuffer;
};

/** Stash a PDF from the homepage hero for /edit to open on arrival. */
export async function stashPendingEditPdf(
  pdfBytes: ArrayBuffer,
  filename: string,
  size: number
): Promise<void> {
  await set(PENDING_PDF_KEY, pdfBytes);
  await set(PENDING_META_KEY, { filename, size, savedAt: Date.now() });
}

/** Read and clear a homepage-stashed PDF. Returns null if none. */
export async function consumePendingEditPdf(): Promise<PendingEditPdf | null> {
  await migrateLegacyKeys();
  const meta = await get<{ filename: string; size: number }>(PENDING_META_KEY);
  const raw = await get<ArrayBuffer | Uint8Array>(PENDING_PDF_KEY);
  await del(PENDING_PDF_KEY);
  await del(PENDING_META_KEY);
  if (!meta?.filename || !raw) return null;

  let pdfBytes: ArrayBuffer;
  if (raw instanceof ArrayBuffer) {
    pdfBytes = raw.slice(0);
  } else if (ArrayBuffer.isView(raw)) {
    pdfBytes = Uint8Array.from(raw as Uint8Array).buffer as ArrayBuffer;
  } else {
    return null;
  }
  if (!pdfBytes.byteLength) return null;

  return { filename: meta.filename, size: meta.size ?? pdfBytes.byteLength, pdfBytes };
}

export async function saveEditorSession(
  session: EditorSession,
  pdfBytes: ArrayBuffer
): Promise<void> {
  await set(SESSION_KEY, session);
  await set(PDF_KEY, pdfBytes);
}

export async function loadEditorSession(): Promise<{
  session: EditorSession;
  pdfBytes: ArrayBuffer;
} | null> {
  await migrateLegacyKeys();
  const session = await get<EditorSession>(SESSION_KEY);
  const pdfBytes = await get<ArrayBuffer>(PDF_KEY);
  if (!session || !pdfBytes) return null;
  return { session, pdfBytes };
}

export async function clearEditorSession(): Promise<void> {
  await del(SESSION_KEY);
  await del(PDF_KEY);
}

export async function hasEditorSession(): Promise<boolean> {
  await migrateLegacyKeys();
  const session = await get<EditorSession>(SESSION_KEY);
  return Boolean(session);
}
