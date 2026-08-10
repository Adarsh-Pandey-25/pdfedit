/**
 * Sample the dominant ink color of glyphs from a rendered page canvas.
 * Used when the PDF operator list yields pure black (or wrong) fill colors.
 *
 * `rect` is in CSS pixels when cssToBitmap > 1, or already in bitmap pixels
 * when cssToBitmap === 1 (offscreen canvases with no clientWidth).
 */
export function sampleTextColorFromCanvas(
  canvas: HTMLCanvasElement,
  rect: { left: number; top: number; width: number; height: number },
  /** CSS px → bitmap px (HiDPI). Defaults from canvas width vs CSS width. */
  cssToBitmap = 1
): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const scale =
    cssToBitmap > 0
      ? cssToBitmap
      : canvas.clientWidth > 0
        ? canvas.width / canvas.clientWidth
        : 1;

  const startX = Math.max(0, Math.floor(rect.left * scale));
  const startY = Math.max(0, Math.floor(rect.top * scale));
  const width = Math.min(
    canvas.width - startX,
    Math.max(1, Math.ceil(rect.width * scale))
  );
  const height = Math.min(
    canvas.height - startY,
    Math.max(1, Math.ceil(rect.height * scale))
  );

  if (width <= 0 || height <= 0) return null;

  try {
    const { data } = ctx.getImageData(startX, startY, width, height);
    // Quantized buckets: count + min luminance (glyph cores are darker than AA fringes)
    const buckets = new Map<string, { count: number; lum: number; r: number; g: number; b: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 180) continue;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // Skip near-white page background and very light AA fringe
      if (lum > 225) continue;
      const key = `${Math.round(r / 8) * 8},${Math.round(g / 8) * 8},${Math.round(b / 8) * 8}`;
      const prev = buckets.get(key);
      if (!prev) {
        buckets.set(key, { count: 1, lum, r, g, b });
      } else {
        prev.count++;
        if (lum < prev.lum) {
          prev.lum = lum;
          prev.r = r;
          prev.g = g;
          prev.b = b;
        }
      }
    }

    if (!buckets.size) return null;

    // Prefer frequent + dark clusters (true ink over anti-alias midtones)
    let best: { count: number; lum: number; r: number; g: number; b: number } | null =
      null;
    let bestScore = -Infinity;
    buckets.forEach((v) => {
      const score = v.count * (1.35 - v.lum / 255);
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    });
    if (!best) return null;
    return `#${toHex(best.r)}${toHex(best.g)}${toHex(best.b)}`;
  } catch {
    return null;
  }
}

/**
 * True if a thin strip under the glyph baseline has non-background ink
 * (typical PDF underline drawn as a separate stroke).
 */
export function sampleHasUnderlineFromCanvas(
  canvas: HTMLCanvasElement,
  rect: { left: number; top: number; width: number; height: number },
  cssToBitmap = 1
): boolean {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  const scale =
    cssToBitmap > 0
      ? cssToBitmap
      : canvas.clientWidth > 0
        ? canvas.width / canvas.clientWidth
        : 1;

  const startX = Math.max(0, Math.floor(rect.left * scale));
  const underlineTop = Math.max(
    0,
    Math.floor((rect.top + rect.height * 0.85) * scale)
  );
  const width = Math.min(
    canvas.width - startX,
    Math.max(1, Math.ceil(rect.width * scale))
  );
  const height = Math.min(
    canvas.height - underlineTop,
    Math.max(1, Math.ceil(rect.height * 0.25 * scale))
  );
  if (width <= 2 || height <= 0) return false;

  try {
    const { data } = ctx.getImageData(startX, underlineTop, width, height);
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 180) continue;
      if (r > 235 && g > 235 && b > 235) continue;
      ink++;
    }
    // Underline is a thin run of ink across most of the width
    const dens = ink / (width * height);
    return dens > 0.04 && dens < 0.55;
  } catch {
    return false;
  }
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");
}

export function isNearBlackHex(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return r < 28 && g < 28 && b < 28;
}
