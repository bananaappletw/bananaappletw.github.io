/**
 * render-marks — look at the thing.
 *
 * A 15px glyph cannot be judged from its path data, and it cannot be judged
 * from a screenshot of a browser at 400% either, because the whole question is
 * what survives the rasteriser at the size it actually ships. So this renders
 * each mark from `src/utils/marks.ts` twice: once at its delivered size over
 * its real ground colour, and once blown up, so the shape and the shipping
 * pixels can be compared side by side.
 *
 *   node --experimental-strip-types scripts/render-marks.mjs
 *
 * Writes PNGs to .marks/ (git-ignored). Not part of the build.
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import sharp from "sharp";
import {
  sigil,
  rune,
  moon,
  sunCore,
  sunRays,
  flame,
  bonfireAsh,
} from "../src/utils/marks.ts";

const t = JSON.parse(readFileSync("docs/theme/tokens.json", "utf8"));
const OUT = ".marks";
mkdirSync(OUT, { recursive: true });

const fill = (paths, colour) =>
  [paths]
    .flat()
    .map(d => `<path d="${d}" fill="${colour}"/>`)
    .join("");

/** the marks, as they are configured in the components that ship them */
const marks = world => {
  const c = t[world];
  return [
    { name: "sigil", box: 64, size: 17, body: fill(sigil, c["--torch"]) },
    { name: "rune", box: 64, size: 14, body: fill(rune, c["--text-4"]) },
    { name: "moon", box: 64, size: 15, body: fill(moon, c["--text-4"]) },
    {
      name: "sun",
      box: 64,
      size: 15,
      body: fill([sunCore, ...sunRays], c["--torch"]),
    },
    {
      name: "bonfire",
      box: 96,
      size: 24,
      body:
        fill(bonfireAsh, c["--ornament"] ?? c["--text-4"]) +
        fill(flame, c["--torch"]),
    },
  ];
};

for (const world of ["hollowed", "kindled"]) {
  const ground = t[world]["--ground"];
  for (const m of marks(world)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.box} ${m.box}" width="${m.box}" height="${m.box}">${m.body}</svg>`;
    writeFileSync(`${OUT}/${world}-${m.name}.svg`, svg);

    for (const [tag, px, pad] of [
      ["ship", m.size, 6],
      ["zoom", m.size * 14, 24],
    ]) {
      const glyph = await sharp(Buffer.from(svg))
        .resize(Math.round(px), Math.round(px))
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: Math.round(px) + pad * 2,
          height: Math.round(px) + pad * 2,
          channels: 4,
          background: ground,
        },
      })
        .composite([{ input: glyph, top: pad, left: pad }])
        .png()
        .toFile(`${OUT}/${world}-${m.name}-${tag}.png`);
    }
  }
}

/** one contact sheet per world, so the family can be judged as a family */
for (const world of ["hollowed", "kindled"]) {
  const ms = marks(world);
  const cell = 128;
  const sheet = [];
  let x = 16;
  for (const m of ms) {
    const px = Math.round(m.size * 5);
    sheet.push({
      input: await sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.box} ${m.box}" width="${m.box}" height="${m.box}">${m.body}</svg>`,
        ),
      )
        .resize(px, px)
        .png()
        .toBuffer(),
      top: Math.round((cell - px) / 2),
      left: x,
    });
    x += cell;
  }
  await sharp({
    create: {
      width: x,
      height: cell,
      channels: 4,
      background: t[world]["--ground"],
    },
  })
    .composite(sheet)
    .png()
    .toFile(`${OUT}/${world}-sheet.png`);
}

console.log(`rendered to ${OUT}/`);
