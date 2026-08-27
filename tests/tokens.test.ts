import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import {
  tokens,
  contrastRatio,
  composite,
  withAlpha,
  WORLDS,
} from "../src/utils/tokens";

/** The scene's line as it is actually delivered: ink at --scene-opacity,
 *  flattened onto the world's own ground. */
const sceneLine = (world: (typeof WORLDS)[number]) =>
  contrastRatio(
    composite(
      withAlpha(tokens[world]["--scene-ink"], tokens[world]["--scene-opacity"]),
      tokens[world]["--ground"],
    ),
    tokens[world]["--ground"],
  );

describe("token completeness", () => {
  it("defines the same token names in both worlds", () => {
    expect(Object.keys(tokens.kindled).sort()).toEqual(
      Object.keys(tokens.hollowed).sort(),
    );
  });

  it("documents a role for every token", () => {
    for (const name of Object.keys(tokens.hollowed)) {
      expect(tokens.roles[name], `missing role for ${name}`).toBeTruthy();
    }
  });

  it("defines the same syntax slots in both worlds", () => {
    expect(Object.keys(tokens.syntax.kindled).sort()).toEqual(
      Object.keys(tokens.syntax.hollowed).sort(),
    );
  });
});

describe("contrast floors (design.md section 11)", () => {
  for (const world of WORLDS) {
    const ground = tokens[world]["--ground"];

    it(`${world}: --text meets 7:1 on --ground`, () => {
      expect(
        contrastRatio(tokens[world]["--text"], ground),
      ).toBeGreaterThanOrEqual(7);
    });

    it(`${world}: --text stays under the 14:1 ceiling`, () => {
      expect(contrastRatio(tokens[world]["--text"], ground)).toBeLessThan(14);
    });

    for (const name of ["--text-2", "--text-3", "--torch", "--arcane"]) {
      it(`${world}: ${name} meets 4.5:1 on --ground`, () => {
        expect(
          contrastRatio(tokens[world][name], ground),
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    it(`${world}: --blood meets 4.5:1 on --blood-tint`, () => {
      expect(
        contrastRatio(tokens[world]["--blood"], tokens[world]["--blood-tint"]),
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("ornament channel", () => {
  it("equals --text-4 in both worlds, and is never --torch", () => {
    for (const world of WORLDS) {
      expect(tokens[world]["--ornament"]).toBe(tokens[world]["--text-4"]);
      expect(tokens[world]["--ornament"]).not.toBe(tokens[world]["--torch"]);
    }
  });
});

describe("marks measured over the surface they land on", () => {
  for (const world of WORLDS) {
    const ground = tokens[world]["--ground"];
    // hollowed's panel is translucent black over the lit ground, so the
    // surface the rule lands on has to be flattened before it is measured
    const panel = composite(tokens[world]["--panel"], ground);

    it(`${world}: --panel stays a recess, not a slab`, () => {
      expect(contrastRatio(panel, ground)).toBeLessThan(1.3);
    });

    it(`${world}: the code block's left rule reads on --panel`, () => {
      expect(
        contrastRatio(tokens[world]["--border-recess"], panel),
      ).toBeGreaterThanOrEqual(1.45);
    });

    it(`${world}: the blockquote rule reads on --ground`, () => {
      expect(contrastRatio(tokens[world]["--border"], ground)).toBeGreaterThan(
        1.25,
      );
    });
  }
});

describe("the scene layer reads at the same weight in both worlds", () => {
  // The scene is one drawing recoloured by the world, so the only thing that
  // may differ between them is the ink — the picture sits equally far back in
  // both. Comparing the two ink hexes says nothing: kindled's used to be the
  // LIGHTER value and the WEAKER drawing, with --scene-opacity papering over
  // the gap. Only the composite against each world's own ground means anything.
  for (const world of WORLDS) {
    it(`${world}: the scene line reads against its own ground`, () => {
      expect(sceneLine(world)).toBeGreaterThanOrEqual(2.4);
    });
  }

  it("holds the same opacity in both worlds", () => {
    expect(tokens.kindled["--scene-opacity"]).toBe(
      tokens.hollowed["--scene-opacity"],
    );
  });

  it("puts the two worlds within a tenth of a ratio of each other", () => {
    expect(Math.abs(sceneLine("hollowed") - sceneLine("kindled"))).toBeLessThan(
      0.1,
    );
  });
});

describe("generated stylesheet", () => {
  it("is up to date with tokens.json", () => {
    const before = readFileSync("src/styles/tokens.css", "utf8");
    execSync("node scripts/build-tokens.mjs");
    expect(readFileSync("src/styles/tokens.css", "utf8")).toBe(before);
  });
});

describe("no hardcoded color", () => {
  it("finds no hex literal in src, outside the generated stylesheet", () => {
    const hits = execSync(
      // (?<!&) so HTML entities such as &#9670; are not mistaken for colours
      "grep -rInPo '(?<![&\\w])#[0-9a-fA-F]{3,8}\\b' src --include=*.astro --include=*.css --include=*.ts " +
        "| grep -v 'src/styles/tokens.css' || true",
    )
      .toString()
      .trim();
    expect(hits, `hardcoded colors found:\n${hits}`).toBe("");
  });
});
