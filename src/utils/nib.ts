/**
 * nib — a pen, for the theme's own marks.
 *
 * The marks were geometric primitives: a mathematically exact circle, eight
 * identical rays, four straight segments meeting at exact angles. Next to the
 * Approach drawing that is what read as cheap — not the shapes, the *evenness
 * of the line*. Every stroke was one width from end to end, which no drawn
 * line has ever been.
 *
 * A drawn line has pressure. It enters light, deepens as the hand pulls
 * through it, and lifts as the hand leaves. None of that is expressible by a
 * stroked path, which has exactly one width, so the marks here are FILLED
 * OUTLINES instead: give this module a spine and a pressure profile and it
 * returns the outline of the ink that a nib would have left.
 *
 * The character is spent on taper and asymmetry, not on wobble. These marks
 * render at 14–24px, where a wobble either falls below the rasteriser or
 * destroys the glyph; taper survives, because it changes the *mass* of the
 * stroke rather than its position. `wobble` is therefore a fraction of a unit
 * by default, and exists to keep long strokes off the ruler rather than to be
 * seen.
 *
 * Everything is deterministic — same seed, same path data, so a build is
 * reproducible and a diff is meaningful.
 */

export type Pt = [number, number];

const TAU = Math.PI * 2;

/** two decimals is below a rendered pixel at every size these marks are used */
const n2 = (v: number) => Math.round(v * 100) / 100;

/** the same LCG the Approach drawing uses, so both hands match */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Catmull-Rom through every control point, so a spine can be written as the
 * four or five places the hand actually went and still come out curved.
 * Endpoints are duplicated, which makes the spline pass through the first and
 * last points instead of easing away from them.
 */
function spline(pts: Pt[], samples: number): Pt[] {
  if (pts.length < 2) return pts.slice();

  if (pts.length === 2) {
    const [a, b] = pts;
    return Array.from({ length: samples + 1 }, (_, i): Pt => {
      const t = i / samples;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    });
  }

  const p: Pt[] = [pts[0], ...pts, pts[pts.length - 1]];
  const segs = p.length - 3;
  const per = Math.max(2, Math.ceil(samples / segs));
  const out: Pt[] = [];

  for (let i = 0; i < segs; i++) {
    const [p0, p1, p2, p3] = [p[i], p[i + 1], p[i + 2], p[i + 3]];
    // only the final segment emits its endpoint, or every joint doubles
    const steps = per + (i === segs - 1 ? 1 : 0);
    for (let k = 0; k < steps; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

/**
 * Midpoint quadratic smoothing. Emitting the offset samples as `L` segments
 * leaves a faceted edge that is visible on the outside of a tight curve at
 * 2× device pixel ratio; passing the curve *through* the midpoints and using
 * each sample as the control point costs nothing and removes it.
 */
function quads(pts: Pt[]): string {
  let d = "";
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${n2(pts[i][0])} ${n2(pts[i][1])} ${n2(mx)} ${n2(my)}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${n2(last[0])} ${n2(last[1])}`;
}

export interface NibOptions {
  /** half-width of the stroke through its body, in user units */
  width?: number;
  /** half-width where the stroke starts, as a fraction of `width` */
  entry?: number;
  /** half-width where the hand lifts, as a fraction of `width` */
  exit?: number;
  /**
   * The DISTANCE, in user units, over which the entry and exit ramps happen.
   *
   * This is the parameter the first version got wrong, and it was wrong in an
   * instructive way. Tapering over a fraction of the stroke's length means a
   * short stroke is *all* taper: the sun's rays came out as petals and the
   * rune's branches as swept wings, because an 8-unit tick tapering across its
   * whole length is a dart, not a line. A real pen ramps up over a fixed
   * millimetre or so regardless of how far the stroke then travels, so a short
   * mark is very nearly uniform and only a long one shows its ends. Fixed
   * distance, clamped to half the length so a very short stroke still closes.
   */
  taper?: number;
  /** overrides `taper` for the entry ramp alone */
  taperIn?: number;
  /** overrides `taper` for the exit ramp alone */
  taperOut?: number;
  /** replaces the ramps outright — takes 0–1 along the stroke, returns a
   * fraction of `width`. For shapes whose whole length is the profile, like
   * the crescent. */
  pressure?: (t: number) => number;
  /** perpendicular wander of the spine, in user units. Keep it under 1 */
  wobble?: number;
  seed?: number;
  samples?: number;
  /** round the two ends. Off gives a cut nib — right for a chisel edge */
  caps?: boolean;
}

/**
 * The outline of one pen stroke, as filled path data.
 *
 * The spine is the centreline; the returned path is its two offset edges
 * joined end to end. Because it is a fill and not a stroke, overlapping
 * strokes union cleanly and the mark stays one colour — which is what lets a
 * corner be drawn as two strokes that *cross*, the way a hand draws one,
 * rather than as a mitred join.
 */
export function nib(spine: Pt[], o: NibOptions = {}): string {
  const width = o.width ?? 3;
  const entry = o.entry ?? 0.35;
  const exit = o.exit ?? 0.2;
  const taper = o.taper ?? 4;
  const wobble = o.wobble ?? 0.35;
  const samples = o.samples ?? 60;
  const caps = o.caps ?? true;

  const rnd = seeded(o.seed ?? 7);
  const ph1 = rnd() * TAU;
  const ph2 = rnd() * TAU;
  const f1 = 0.7 + rnd() * 0.5;
  const f2 = 1.9 + rnd() * 1.2;

  const pts = spline(spine, samples);
  const n = pts.length;

  // arc length, so the ramps below are measured in the drawing's own units
  const at: number[] = [0];
  for (let i = 1; i < n; i++) {
    at[i] =
      at[i - 1] +
      Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  const total = at[n - 1] || 1;
  const half = total / 2;
  const tIn = Math.min(o.taperIn ?? taper, half);
  const tOut = Math.min(o.taperOut ?? taper, half);

  const ramp = (dist: number, end: number, over: number) =>
    over <= 0 ? 1 : end + (1 - end) * smoothstep(Math.min(1, dist / over));

  const profile = (i: number) => {
    if (o.pressure) return o.pressure(n === 1 ? 0 : i / (n - 1));
    return Math.min(ramp(at[i], entry, tIn), ramp(total - at[i], exit, tOut));
  };

  const left: Pt[] = [];
  const right: Pt[] = [];

  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const nx = -ty;
    const ny = tx;

    const t = n === 1 ? 0 : i / (n - 1);
    const w = Math.max(0, width * profile(i));

    // the hand wanders, and it wanders *smoothly* — per-sample randomness is
    // a furry edge, not a drawn line
    const drift =
      wobble *
      (Math.sin(t * TAU * f1 + ph1) * 0.6 + Math.sin(t * TAU * f2 + ph2) * 0.4);
    const cx = pts[i][0] + nx * drift;
    const cy = pts[i][1] + ny * drift;

    left.push([cx + nx * w, cy + ny * w]);
    right.push([cx - nx * w, cy - ny * w]);
  }

  const wStart = Math.max(0, width * profile(0));
  const wEnd = Math.max(0, width * profile(n - 1));
  const tip = right[n - 1];
  const heel = left[0];

  let d = `M${n2(heel[0])} ${n2(heel[1])}`;
  d += quads(left);
  d +=
    caps && wEnd > 0.05
      ? `A${n2(wEnd)} ${n2(wEnd)} 0 0 0 ${n2(tip[0])} ${n2(tip[1])}`
      : `L${n2(tip[0])} ${n2(tip[1])}`;
  d += quads(right.slice().reverse());
  d +=
    caps && wStart > 0.05
      ? `A${n2(wStart)} ${n2(wStart)} 0 0 0 ${n2(heel[0])} ${n2(heel[1])}`
      : "";

  return d + "Z";
}

/**
 * A closed organic silhouette through the given points.
 *
 * Not everything is a stroke. A flame has no centreline — it is an outline,
 * and building it out of tapered strokes produces a slug, which is exactly
 * what the first attempt produced. What makes fire read as fire at 24px is
 * that its silhouette disagrees with itself: a concave notch on one side at
 * one height and on the other at another, so the eye never resolves it into a
 * leaf. Those notches are control points here, and Catmull-Rom keeps the
 * curve passing through every one of them.
 */
export function loop(pts: Pt[], o: { samples?: number } = {}): string {
  const per = Math.max(3, Math.round((o.samples ?? 90) / pts.length));
  const n = pts.length;
  const out: Pt[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }

  let d = `M${n2(out[0][0])} ${n2(out[0][1])}`;
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    const b = out[(i + 1) % out.length];
    d += `Q${n2(a[0])} ${n2(a[1])} ${n2((a[0] + b[0]) / 2)} ${n2((a[1] + b[1]) / 2)}`;
  }
  return d + "Z";
}

/**
 * An arc spine, in screen angles (0 is due right, 90 is *down*).
 *
 * Radius jitter is applied per control point rather than per sample, so an
 * arc comes out slightly out of round the way a hand's does, instead of
 * merely rough.
 */
export function arc(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
  o: { points?: number; jitter?: number; seed?: number } = {},
): Pt[] {
  const points = o.points ?? 9;
  const jitter = o.jitter ?? 0;
  const rnd = seeded(o.seed ?? 3);
  const from = (fromDeg * Math.PI) / 180;
  const to = (toDeg * Math.PI) / 180;

  return Array.from({ length: points }, (_, i): Pt => {
    const t = i / (points - 1);
    const a = from + (to - from) * t;
    const rr = r + (rnd() - 0.5) * jitter;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
}
