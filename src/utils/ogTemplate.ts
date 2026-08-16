import satori from "satori";
import sharp from "sharp";
import { fontData, experimental_getFontFileURL } from "astro:assets";
import { getFontPathByWeight } from "@/utils/getFontPathByWeight";
import { tokens } from "@/utils/tokens";

/**
 * Social cards always render in the hollowed world. It is the site's true
 * state, and a dark card stands out in a timeline of light ones.
 *
 * satori supports no gradients here, so the atmosphere layers are omitted;
 * a flat ground is correct at 1200x630.
 */
const c = tokens.hollowed;

type Child = Record<string, unknown>;

const text = (
  content: string,
  style: Record<string, string | number>,
): Child => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children: content },
});

export async function renderOgImage(
  title: string,
  subtitle: string,
  hostname: string,
  url: URL,
): Promise<Response> {
  const displayPath = getFontPathByWeight(fontData["--font-display"], 600);
  const bodyPath = getFontPathByWeight(fontData["--font-body"], 400);

  if (displayPath === undefined || bodyPath === undefined) {
    throw new Error("Cannot find the font path for the OG template.");
  }

  const [displayData, bodyData] = await Promise.all(
    [displayPath, bodyPath].map(path =>
      fetch(experimental_getFontFileURL(path, url)).then(res =>
        res.arrayBuffer(),
      ),
    ),
  );

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: c["--ground"],
          padding: "72px 80px",
          fontFamily: "Spectral",
        },
        children: [
          // The carved rule, in the ornament channel — bone, not gold.
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                width: "56px",
                height: "3px",
                background: c["--ornament"],
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "26px",
                maxWidth: "900px",
              },
              children: [
                text(title, {
                  fontFamily: "Cinzel",
                  fontSize: 62,
                  lineHeight: 1.12,
                  letterSpacing: "0.015em",
                  color: c["--text"],
                }),
                text(subtitle, {
                  fontSize: 27,
                  lineHeight: 1.5,
                  color: c["--text-3"],
                }),
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              },
              children: [
                text(hostname, {
                  fontFamily: "Cinzel",
                  fontSize: 20,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: c["--text-4"],
                }),
                // The single gold moment on the card.
                text("◆", { fontSize: 22, color: c["--torch"] }),
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: [
        { name: "Cinzel", data: displayData, weight: 600, style: "normal" },
        { name: "Spectral", data: bodyData, weight: 400, style: "normal" },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
