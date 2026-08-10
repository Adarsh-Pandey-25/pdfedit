import type { PDFPageProxy } from "pdfjs-dist";

/**
 * Robust fill-color extraction for every text-showing operator.
 * Tracks graphics-state save/restore so nested colors are correct.
 */
export async function extractTextColors(
  page: PDFPageProxy
): Promise<Map<number, string>> {
  const pdfjs = await import("pdfjs-dist");
  const OPS = pdfjs.OPS as Record<string, number>;
  const ops = await page.getOperatorList();
  const colorMap = new Map<number, string>();

  type GState = { fill: [number, number, number] };
  const stack: GState[] = [];
  let current: GState = { fill: [0, 0, 0] };
  let textOpIndex = 0;

  const toHex = (r: number, g: number, b: number) => {
    const byte = (n: number) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, "0");
    return `#${byte(r)}${byte(g)}${byte(b)}`;
  };

  const setRgb01 = (r: number, g: number, b: number) => {
    current.fill = [r, g, b];
  };

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = (ops.argsArray[i] || []) as number[];

    if (fn === OPS.save) {
      stack.push({ fill: [...current.fill] as [number, number, number] });
      continue;
    }
    if (fn === OPS.restore) {
      const prev = stack.pop();
      if (prev) current = prev;
      continue;
    }

    if (fn === OPS.setFillRGBColor && args.length >= 3) {
      setRgb01(args[0], args[1], args[2]);
      continue;
    }
    if (fn === OPS.setFillGray && args.length >= 1) {
      setRgb01(args[0], args[0], args[0]);
      continue;
    }
    if (fn === OPS.setFillCMYKColor && args.length >= 4) {
      const [c, m, y, k] = args;
      setRgb01((1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k));
      continue;
    }
    // Generic / DeviceN style color ops (values typically 0–1)
    if (
      (fn === OPS.setFillColor || fn === OPS.setFillColorN) &&
      args.length >= 1
    ) {
      if (args.length >= 3) {
        setRgb01(args[0], args[1], args[2]);
      } else {
        setRgb01(args[0], args[0], args[0]);
      }
      continue;
    }

    const isTextShow =
      fn === OPS.showText ||
      fn === OPS.showSpacedText ||
      fn === OPS.nextLineShowText ||
      fn === OPS.nextLineSetSpacingShowText ||
      (typeof OPS.nextLineShowSpacedText === "number" &&
        fn === OPS.nextLineShowSpacedText);

    if (isTextShow) {
      const [r, g, b] = current.fill;
      colorMap.set(textOpIndex, toHex(r * 255, g * 255, b * 255));
      textOpIndex++;
    }
  }

  return colorMap;
}
