import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { tokens, contrastRatio, WORLDS } from "../src/utils/tokens";

describe("token completeness", () => {
  it("defines the same token names in both worlds", () => {
    expect(Object.keys(tokens.kindled).sort()).toEqual(
      Object.keys(tokens.hollowed).sort()
    );
  });

  it("documents a role for every token", () => {
    for (const name of Object.keys(tokens.hollowed)) {
      expect(tokens.roles[name], `missing role for ${name}`).toBeTruthy();
    }
  });

  it("defines the same syntax slots in both worlds", () => {
    expect(Object.keys(tokens.syntax.kindled).sort()).toEqual(
      Object.keys(tokens.syntax.hollowed).sort()
    );
  });
});

describe("contrast floors (design.md section 11)", () => {
  for (const world of WORLDS) {
    const ground = tokens[world]["--ground"];

    it(`${world}: --text meets 7:1 on --ground`, () => {
      expect(
        contrastRatio(tokens[world]["--text"], ground)
      ).toBeGreaterThanOrEqual(7);
    });

    it(`${world}: --text stays under the 14:1 ceiling`, () => {
      expect(contrastRatio(tokens[world]["--text"], ground)).toBeLessThan(14);
    });

    for (const name of ["--text-2", "--text-3", "--torch", "--arcane"]) {
      it(`${world}: ${name} meets 4.5:1 on --ground`, () => {
        expect(
          contrastRatio(tokens[world][name], ground)
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    it(`${world}: --blood meets 4.5:1 on --blood-tint`, () => {
      expect(
        contrastRatio(tokens[world]["--blood"], tokens[world]["--blood-tint"])
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("ornament channel", () => {
  it("equals --torch when kindled and --text-4 when hollowed", () => {
    expect(tokens.kindled["--ornament"]).toBe(tokens.kindled["--torch"]);
    expect(tokens.hollowed["--ornament"]).toBe(tokens.hollowed["--text-4"]);
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
        "| grep -v 'src/styles/tokens.css' || true"
    )
      .toString()
      .trim();
    expect(hits, `hardcoded colors found:\n${hits}`).toBe("");
  });
});
