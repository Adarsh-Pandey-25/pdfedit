/**
 * Viewers apply a page's /Rotate entry; pdf-lib does not. Anything positioned
 * from what the user sees has to be mapped back onto raw page coordinates.
 */

export type PageRotation = 0 | 90 | 180 | 270;

export function normalizeRotation(angle: number): PageRotation {
  return ((((Math.round(angle / 90) * 90) % 360) + 360) % 360) as PageRotation;
}

/** Page size as displayed, with rotation applied. */
export function viewSize(
  rawWidth: number,
  rawHeight: number,
  rotation: PageRotation
): { width: number; height: number } {
  const quarterTurn = rotation === 90 || rotation === 270;
  return {
    width: quarterTurn ? rawHeight : rawWidth,
    height: quarterTurn ? rawWidth : rawHeight,
  };
}

/**
 * Maps a y-up anchor from view space to raw page space. pdf-lib rotates drawn
 * content about that same anchor, so the returned angle keeps the content
 * upright once the viewer applies the page rotation.
 */
export function toRawPageSpace(
  vx: number,
  vy: number,
  angle: number,
  rotation: PageRotation,
  rawWidth: number,
  rawHeight: number
): { x: number; y: number; angle: number } {
  switch (rotation) {
    case 90:
      return { x: rawWidth - vy, y: vx, angle: angle + 90 };
    case 180:
      return { x: rawWidth - vx, y: rawHeight - vy, angle: angle + 180 };
    case 270:
      return { x: vy, y: rawHeight - vx, angle: angle + 270 };
    default:
      return { x: vx, y: vy, angle };
  }
}
