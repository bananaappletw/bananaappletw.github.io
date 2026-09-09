import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The gates have to actually run somewhere.
 *
 * `eslint.config.js` turns `no-undef` off and delegates undefined names to the
 * TypeScript compiler — which is the right call, since the rule cannot see
 * ambient declarations like `astro:content`. But the compiler it delegates to
 * was not run by anything for most of this project's life: the comment pointed
 * at a gate that did not exist, which is how two checks each end up assuming
 * the other covers it.
 *
 * So this file is the guard on the guard. It fails if a script the workflow
 * depends on is renamed away, or if a step is dropped from CI, rather than
 * letting either rot quietly until something reaches the live site.
 */

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};
const workflow = readFileSync(".github/workflows/deploy.yml", "utf8");

/** every script the deploy workflow invokes, and what it is there to catch */
const GATES = [
  ["lint", "eslint"],
  ["format:check", "prettier"],
  ["check", "astro check"],
  ["test", "vitest"],
] as const;

describe("the checks CI depends on exist", () => {
  for (const [script, tool] of GATES) {
    it(`package.json defines \`${script}\`, and it runs ${tool}`, () => {
      expect(pkg.scripts[script], `missing script: ${script}`).toBeTruthy();
      expect(pkg.scripts[script]).toContain(tool.split(" ")[0]);
    });
  }

  it("every script named in package.json points at a real command", () => {
    // `test` and `test:dist` name files; a script that runs a file which does
    // not exist is a gate that cannot fail, which is worse than no gate.
    for (const [name, body] of Object.entries(pkg.scripts)) {
      const files = body.match(/tests\/[\w.-]+\.ts/g) ?? [];
      for (const file of files) {
        expect(
          () => readFileSync(file, "utf8"),
          `${name} → ${file}`,
        ).not.toThrow();
      }
    }
  });
});

describe("the deploy workflow runs them", () => {
  for (const [script] of GATES) {
    it(`runs \`npm run ${script}\` before building`, () => {
      const step =
        script === "test"
          ? /run:\s*npm test\b/
          : new RegExp(`run:\\s*npm run ${script.replace(":", ":")}\\b`);
      expect(step.test(workflow), `no step running ${script}`).toBe(true);

      const at = workflow.search(step);
      const build = workflow.search(/run:\s*npm run build\b/);
      expect(at, "gate must come before the build").toBeLessThan(build);
    });
  }

  it("pins a timezone, so the archive is a function of the content", () => {
    // src/pages/archives/index.astro groups with getFullYear()/getMonth() on a
    // bare Date. Without TZ the grouping follows the runner's clock.
    expect(workflow).toMatch(/TZ:\s*\S+/);
  });
});
