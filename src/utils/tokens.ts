import raw from "../../docs/theme/tokens.json";

export type World = "hollowed" | "kindled";

type Palette = Record<string, string>;

type Tokens = {
  name: string;
  version: string;
  hollowed: Palette;
  kindled: Palette;
  roles: Record<string, string>;
  syntax: Record<World, Record<string, string>>;
  diagram: Record<World, Record<string, string>>;
};

const stripMeta = (o: Record<string, unknown>): Palette =>
  Object.fromEntries(
    Object.entries(o).filter(([k]) => !k.startsWith("_")),
  ) as Palette;

export const tokens = {
  ...raw,
  hollowed: stripMeta(raw.hollowed),
  kindled: stripMeta(raw.kindled),
  syntax: {
    hollowed: stripMeta(raw.syntax.hollowed),
    kindled: stripMeta(raw.syntax.kindled),
  },
  diagram: {
    hollowed: stripMeta(raw.diagram.hollowed),
    kindled: stripMeta(raw.diagram.kindled),
  },
} as unknown as Tokens;

export const WORLDS: World[] = ["hollowed", "kindled"];

/** sRGB relative luminance, WCAG 2.1. Non-hex values return NaN. */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return Number.NaN;
  const int = parseInt(m[1], 16);
  const [r, g, b] = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Flatten a colour onto the surface behind it, and return it as hex.
 *
 * This exists because a token can hold a legal value and still not do its
 * job. Every contrast assertion here used to measure against `--ground`, and
 * two of the light world's marks do not land there — the code block's left
 * rule sits on `--panel`, which is itself translucent when hollowed. A mark
 * measured against the page behind its own surface is not measured at all.
 *
 * Accepts hex or `rgb()` / `rgba()`; the backdrop must be opaque hex.
 */
export function composite(colour: string, over: string): string {
  const c = colour.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(c);
  if (hex) return c;

  const fn =
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)$/i.exec(
      c,
    );
  if (!fn) return c;

  const alpha = fn[4] === undefined ? 1 : Number(fn[4]);
  const back = /^#([0-9a-f]{6})$/i.exec(over.trim());
  if (!back) return c;
  const int = parseInt(back[1], 16);
  const bg = [(int >> 16) & 255, (int >> 8) & 255, int & 255];

  const out = [1, 2, 3].map((i, k) =>
    Math.round(Number(fn[i]) * alpha + bg[k] * (1 - alpha)),
  );
  return `#${out.map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
