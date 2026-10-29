/**
 * Reads the EXIF orientation tag (0x0112) of a JPEG without decoding it.
 *
 * PDF viewers ignore EXIF, so a phone photo stored sideways with an
 * orientation tag would otherwise appear rotated in the PDF while its
 * thumbnail (which the browser orients) looks right.
 */

export type JpegOrientation = {
  /** EXIF value 1–8 (1 = upright, 2–4 flipped/rotated, 5–8 also swap width and height). */
  value: number;
  /** Byte offset of the 2-byte value, so a copy can be reset to 1. */
  offset: number;
  littleEndian: boolean;
};

/** Returns the orientation tag, or null if there is none or the metadata is malformed. */
export function findJpegOrientation(bytes: Uint8Array): JpegOrientation | null {
  const b = bytes;
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    // Fill byte before a marker
    if (marker === 0xff) {
      i++;
      continue;
    }
    // End of image or start of scan: no metadata after this point
    if (marker === 0xd9 || marker === 0xda) return null;
    // Markers without a length field
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const length = (b[i + 2] << 8) | b[i + 3];
    if (length < 2 || i + 2 + length > b.length) return null;
    if (marker === 0xe1) {
      const found = readExifOrientation(b, i + 4, i + 2 + length);
      if (found) return found;
    }
    i += 2 + length;
  }
  return null;
}

function readExifOrientation(
  b: Uint8Array,
  start: number,
  end: number
): JpegOrientation | null {
  // "Exif\0\0" header, then a TIFF header
  const exif = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  if (end - start < 14 || exif.some((v, k) => b[start + k] !== v)) return null;
  const tiff = start + 6;
  const littleEndian = b[tiff] === 0x49 && b[tiff + 1] === 0x49;
  const bigEndian = b[tiff] === 0x4d && b[tiff + 1] === 0x4d;
  if (!littleEndian && !bigEndian) return null;
  const u16 = (o: number) =>
    littleEndian ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1];
  const u32 = (o: number) =>
    (littleEndian
      ? b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)
      : (b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  if (u16(tiff + 2) !== 42) return null;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return null;
  const count = u16(ifd);
  for (let k = 0; k < count; k++) {
    const entry = ifd + 2 + k * 12;
    if (entry + 12 > end) return null;
    if (u16(entry) !== 0x0112) continue;
    // Must be a SHORT (type 3) with at least one value
    if (u16(entry + 2) !== 3 || u32(entry + 4) < 1) return null;
    return { value: u16(entry + 8), offset: entry + 8, littleEndian };
  }
  return null;
}

/**
 * The orientation to apply (1–8) and the bytes to embed. For a rotated or
 * flipped photo the bytes are a copy with the tag reset to 1, so a viewer
 * that does read EXIF can't rotate it a second time. The image data itself
 * is never re-encoded. Missing, malformed, or out-of-range tags mean 1.
 */
export function prepareJpegForPdf(bytes: ArrayBuffer): {
  bytes: ArrayBuffer;
  orientation: number;
} {
  const found = findJpegOrientation(new Uint8Array(bytes));
  if (!found || found.value < 2 || found.value > 8) {
    return { bytes, orientation: 1 };
  }
  const copy = bytes.slice(0);
  new DataView(copy).setUint16(found.offset, 1, found.littleEndian);
  return { bytes: copy, orientation: found.value };
}
