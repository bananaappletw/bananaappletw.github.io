import type { FontData } from "astro:assets";

/**
 * Astro emits one FontData entry per (weight, style, format) combination
 * rather than one entry per face with every format in its `src` array.
 * Searching with `.find()` therefore matches the first entry for a weight —
 * usually woff2 — and then fails to locate truetype inside it.
 *
 * satori needs truetype, so this searches across every matching entry.
 */
export function getFontPathByWeight(
  fonts: FontData[],
  weight: number,
  options?: {
    style?: "normal" | "italic";
    format?: string;
  },
): string | undefined {
  const style = options?.style ?? "normal";
  const format = options?.format ?? "truetype";

  return fonts
    .filter(font => font.weight === String(weight) && font.style === style)
    .flatMap(font => font.src)
    .find(file => file.format === format)?.url;
}
