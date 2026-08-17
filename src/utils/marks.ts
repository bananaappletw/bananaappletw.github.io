/**
 * The theme's own marks — sigil, world control, edit rune, bonfire — drawn
 * with the pen in `nib.ts` rather than assembled from primitives.
 *
 * They live here and not inline in the components for one reason: a mark
 * cannot be judged from its source. Keeping the geometry in a plain module
 * means `scripts/render-marks.mjs` can render exactly what ships, at the size
 * it ships at, over the ground it sits on — which is the only way to tell
 * whether a 15px glyph reads. Every correction below came from looking at
 * that output next to the marks it replaces; none of it came from the source.
 *
 * Coordinates are 4× the rendered size (a 64 box for a 16px mark, 96 for 24),
 * which buys curve precision that survives the downscale as softness instead
 * of being quantised into facets. A half-width `w` here is a stroke-width of
 * `w / 2` in the old 16-unit space, and the widths below deliberately match
 * what they replace: taper now happens over a fixed distance at the ends
 * rather than across the whole stroke, so the body of a line carries its full
 * weight and the mark does not go quietly lighter.
 */

import { nib, loop, arc, seeded, type Pt } from "./nib.ts";

/* ── the sigil ───────────────────────────────────────────────────────────
 * The site's mark: stem, lozenge, foot. Centred and closed, where the edit
 * rune is asymmetric and open, so two marks on one page cannot be confused.
 *
 * The lozenge is drawn as TWO strokes that cross at the apexes rather than as
 * one closed path with mitred corners. That crossing is the whole tell — a
 * hand drawing a diamond pulls down one side, lifts, and pulls down the
 * other, and the small overshoot where the two meet is what a mitre can never
 * produce.
 */
export const sigil: string[] = [
  // stem, top to bottom, lifting off the foot
  nib(
    [
      [32.3, 5.4],
      [31.7, 19],
      [32.4, 34],
      [31.8, 44.5],
      [32.1, 58.6],
    ],
    { width: 3, entry: 0.45, exit: 0.35, taper: 6, wobble: 0.15, seed: 41 },
  ),
  // lozenge, right side: apex → shoulder → apex, overshooting both
  nib(
    [
      [31.7, 12.8],
      [38.6, 19.4],
      [44.7, 26.2],
      [38.9, 33.3],
      [32.6, 40.2],
    ],
    { width: 2.85, entry: 0.5, exit: 0.4, taper: 4.5, wobble: 0.12, seed: 17 },
  ),
  // lozenge, left side: drawn second, so it is the one that misses slightly
  nib(
    [
      [32.6, 13.5],
      [25.6, 20.1],
      [19.3, 26.8],
      [25.3, 33.6],
      [31.4, 39.7],
    ],
    { width: 2.8, entry: 0.52, exit: 0.42, taper: 4.5, wobble: 0.12, seed: 88 },
  ),
  // foot, one confident horizontal
  nib(
    [
      [20.3, 51.4],
      [26.1, 52.1],
      [32, 52.3],
      [38, 51.9],
      [43.7, 51],
    ],
    { width: 2.9, entry: 0.5, exit: 0.45, taper: 4.5, wobble: 0.1, seed: 63 },
  ),
];

/* ── the edit rune ───────────────────────────────────────────────────────
 * Same vocabulary as the sigil, deliberately unlike it: the branches leave
 * the stem at different heights and run off opposite sides, so the mark is
 * open where the sigil is closed.
 */
export const rune: string[] = [
  nib(
    [
      [32.2, 6.2],
      [31.6, 20],
      [32.3, 36],
      [31.9, 56.2],
    ],
    { width: 2.75, entry: 0.45, exit: 0.35, taper: 6, wobble: 0.14, seed: 5 },
  ),
  // branches start ON the stem, so they enter at nearly full pressure — a
  // short ramp in, a longer one out as the hand leaves the mark
  nib(
    [
      [33.1, 20.5],
      [24, 27.5],
      [13.1, 37.5],
    ],
    {
      width: 2.65,
      entry: 0.8,
      exit: 0.4,
      taperIn: 2,
      taperOut: 6,
      wobble: 0.12,
      seed: 29,
    },
  ),
  nib(
    [
      [30.9, 30.2],
      [40.1, 37.1],
      [51, 47.1],
    ],
    {
      width: 2.65,
      entry: 0.8,
      exit: 0.4,
      taperIn: 2,
      taperOut: 6,
      wobble: 0.12,
      seed: 73,
    },
  ),
  nib(
    [
      [22.2, 48.5],
      [32, 49.3],
      [41.8, 48.3],
    ],
    { width: 2.7, entry: 0.5, exit: 0.45, taper: 4, wobble: 0.1, seed: 52 },
  ),
];

/* ── the world control ───────────────────────────────────────────────────
 * Moon when hollowed, sun when kindled.
 *
 * The crescent is ONE nib stroke, not a circle with a circle subtracted. Its
 * spine is the crescent's midline and its pressure runs thin → full → thin,
 * which is the definition of a crescent and gets the horns tapering to real
 * points for free. A boolean subtraction gives two horns of identical
 * mathematical sharpness; a pen gives one slightly finer than the other,
 * which is what the skewed exponent below is for. This is the one mark whose
 * profile IS its whole length, so it overrides the ramps rather than using
 * them.
 */
export const moon: string = nib(
  arc(32, 32, 18.5, 20, 252, { points: 11, jitter: 0.9, seed: 91 }),
  {
    width: 7.2,
    wobble: 0.35,
    seed: 12,
    samples: 84,
    pressure: t => Math.sin(Math.PI * Math.pow(t, 0.93)) ** 1.05,
  },
);

/**
 * The sun's core: a filled disc, slightly out of round.
 *
 * Drawing it as a stroked ring was tried and is wrong — at 15px the hole is
 * about four pixels across and the sun reads as a doughnut. The original's
 * solidity was doing real work, so the disc stays a disc and the hand shows
 * in its outline instead of in its construction.
 */
export const sunCore: string = loop(
  arc(32, 32, 12.6, 0, 315, { points: 8, jitter: 1.7, seed: 34 }),
  { samples: 96 },
);

/**
 * Eight rays, no two alike — length, weight, angle and reach all vary. Eight
 * identical ticks at eight exact 45° steps was the single most mechanical
 * thing in the theme.
 *
 * Getting the taper right on something this short took three passes. Tapering
 * across the length gave petals; tapering symmetrically from both ends gave a
 * lens, which is also a petal — eight of those around a disc is a daisy, not a
 * sun. A ray has to stay blunt: short ramps, and the outer end left heavier
 * than a lens would leave it, so the mark reads as a tick that was drawn
 * outward rather than as a leaf placed there.
 */
export const sunRays: string[] = (() => {
  const rnd = seeded(2608);
  return Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 + (rnd() - 0.5) * 7) * Math.PI) / 180;
    const inner = 19.8 + (rnd() - 0.5) * 1.8;
    const outer = 28.2 + (rnd() - 0.5) * 3.4;
    const spine: Pt[] = [
      [32 + Math.cos(a) * inner, 32 + Math.sin(a) * inner],
      [32 + Math.cos(a) * outer, 32 + Math.sin(a) * outer],
    ];
    return nib(spine, {
      width: 2.3 + rnd() * 0.35,
      entry: 0.88,
      exit: 0.66,
      taper: 1.5,
      wobble: 0,
      seed: 300 + i * 7,
      samples: 16,
    });
  });
})();

/* ── the bonfire ─────────────────────────────────────────────────────────
 * 96-unit box, rendered at 24px. Flame in gold, sword and mound in the
 * ornament channel.
 *
 * The flame took the most tries, and the thing that decided it was NEGATIVE
 * SPACE. Every filled silhouette failed the same way: notched, it read as a
 * leaf; widened, as a shrub; closed into a curl, as a lightbulb. The mark it
 * replaces worked because its hook curled around a dark gap, and that gap —
 * not the gold — is what the eye reads as a tongue of fire.
 *
 * So the flame is three tapered tongues rising from a shared base and leaning
 * apart, and the fire is the two slivers of ground between them. Each tongue
 * is one stroke that starts at full pressure and lifts to nothing, which is
 * both how a pen leaves a point and how a flame ends.
 */
export const flame: string[] = [
  // the tall one, leaning right as it rises
  nib(
    [
      [46, 63],
      [42, 48],
      [46, 30],
      [50, 12],
    ],
    {
      width: 6,
      entry: 0.9,
      exit: 0.04,
      taperIn: 5,
      taperOut: 36,
      wobble: 0.28,
      seed: 8,
    },
  ),
  // the right-hand lick, shorter, kicking out before it turns back
  nib(
    [
      [52, 62],
      [58, 50],
      [56.5, 38],
      [60, 28],
    ],
    {
      width: 4.4,
      entry: 0.85,
      exit: 0.04,
      taperIn: 4,
      taperOut: 26,
      wobble: 0.22,
      seed: 21,
    },
  ),
  // the smallest, low on the left — it is what keeps the base from reading
  // as one mass with a split in it
  nib(
    [
      [43, 62],
      [36.5, 51],
      [38, 41],
    ],
    {
      width: 3.6,
      entry: 0.8,
      exit: 0.04,
      taperIn: 3,
      taperOut: 20,
      wobble: 0.2,
      seed: 33,
    },
  ),
];

/** the coiled sword, driven point-down into the ash, and the mound it stands in */
export const bonfireAsh: string[] = [
  // blade — full at the guard, then a long ramp to the point that went in
  nib(
    [
      [48, 51.5],
      [48.5, 64],
      [47.8, 74],
      [48.2, 83.5],
    ],
    {
      width: 2.75,
      entry: 0.85,
      exit: 0.12,
      taperIn: 2,
      taperOut: 16,
      wobble: 0.16,
      seed: 61,
    },
  ),
  // crossguard, sitting a degree or two off level
  nib(
    [
      [37.9, 62.6],
      [48, 61.6],
      [58.3, 62.7],
    ],
    { width: 2.75, entry: 0.5, exit: 0.45, taper: 4, wobble: 0.1, seed: 44 },
  ),
  // the mound
  nib(
    [
      [26, 83.2],
      [35.2, 79.5],
      [48, 78.1],
      [61, 79.7],
      [70.1, 83.4],
    ],
    { width: 2.7, entry: 0.4, exit: 0.4, taper: 7, wobble: 0.12, seed: 96 },
  ),
];
