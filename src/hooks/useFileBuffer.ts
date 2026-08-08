"use client";

import { useCallback, useState } from "react";

export function useFileBuffer() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);

  const loadFile = useCallback(async (f: File) => {
    const buf = await f.arrayBuffer();
    setFile(f);
    setBuffer(buf);
    return buf;
  }, []);

  const clear = useCallback(() => {
    setFile(null);
    setBuffer(null);
  }, []);

  return { file, buffer, loadFile, clear, setFile, setBuffer };
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
