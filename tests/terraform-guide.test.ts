import { describe, it, expect } from "vitest";
import {
  FILE,
  LAST_STEP,
  STEPS,
  addrStep,
  fileAt,
  outputAt,
  resourcesAt,
} from "../src/data/terraform-guide";
import { RESOURCES } from "../src/data/terraform-apply";

/**
 * The guide claims to build, in front of the reader, exactly the stack Part
 * II then applies. A guide that ends somewhere else is a guide to nothing,
 * so that is the first thing checked here.
 *
 * The rest holds the two properties a reader can feel but not verify: the
 * file only ever grows, and the transcripts beside it agree with the file
 * — a plan that says "7 to add" beside a file holding six resources would
 * be a lie nobody could catch by reading.
 */

const text = (line: { text: string }) => line.text;

const every = (fn: (step: number) => void) =>
  STEPS.forEach(step => {
    try {
      fn(step.n);
    } catch (e) {
      throw new Error(`step ${step.n} (${step.title}): ${e}`, { cause: e });
    }
  });

/** the "Plan: a to add, b to change, c to destroy" line, as numbers */
const planLine = (step: number) => {
  const line = outputAt(step).find(out => out.text.startsWith("Plan: "));
  if (!line) return undefined;
  const m = line.text.match(
    /Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/,
  );
  if (!m) throw new Error(`unreadable plan line: ${line.text}`);
  return { add: +m[1], change: +m[2], destroy: +m[3] };
};

describe("the guide ends where the simulation begins", () => {
  it("introduces every object the simulation applies, and no others", () => {
    const introduced = RESOURCES.map(res => res.addr).filter(
      addr => addrStep(addr) <= LAST_STEP,
    );
    expect(introduced.sort()).toEqual(RESOURCES.map(r => r.addr).sort());
    expect(resourcesAt(LAST_STEP).length).toBe(RESOURCES.length);
  });

  it("writes a block for every resource type in the stack", () => {
    const file = fileAt(LAST_STEP).map(text).join("\n");
    for (const res of RESOURCES) {
      const [, name] = res.addr.replace(/\[.*$/, "").split(".");
      const head =
        res.kind === "data"
          ? `data "${res.type}" "${name.replace(/^aws_ami$/, "ubuntu")}"`
          : `resource "${res.type}" "${name}"`;
      expect(file, `no block for ${res.addr}`).toContain(
        res.kind === "data" ? `data "${res.type}"` : head,
      );
    }
  });

  it("refers to every dependency the graph claims, in the file itself", () => {
    const file = fileAt(LAST_STEP).map(text).join("\n");
    for (const res of RESOURCES) {
      for (const dep of res.deps) {
        /* `aws_subnet.public["a"]` is written `aws_subnet.public` plus a
           for_each, so the reference to check is the block, not the key */
        const block = dep.replace(/\[.*$/, "");
        expect(file, `${res.addr} never refers to ${block}`).toContain(block);
      }
    }
  });

  it("never introduces an object before the thing it refers to", () => {
    for (const res of RESOURCES) {
      for (const dep of res.deps) {
        expect(
          addrStep(res.addr),
          `${res.addr} arrives before ${dep}`,
        ).toBeGreaterThanOrEqual(addrStep(dep));
      }
    }
  });
});

describe("the file only ever grows", () => {
  it("never removes or reorders a line", () => {
    for (let step = 2; step <= LAST_STEP; step++) {
      const before = fileAt(step - 1).map(text);
      const after = fileAt(step).map(text);
      expect(after.length).toBeGreaterThanOrEqual(before.length);
      let at = 0;
      for (const line of before) {
        const found = after.indexOf(line, at);
        expect(found, `lost: ${JSON.stringify(line)}`).toBeGreaterThanOrEqual(
          at,
        );
        at = found + 1;
      }
    }
  });

  it("marks exactly the lines that arrived at this step", () => {
    every(step => {
      const fresh = fileAt(step).filter(line => line.fresh).length;
      const grown = fileAt(step).length - fileAt(step - 1).length;
      expect(fresh).toBe(grown);
    });
  });

  it("starts empty, because nothing has been written yet", () => {
    expect(fileAt(1)).toEqual([]);
    expect(fileAt(2).length).toBeGreaterThan(0);
  });

  it("keeps every line inside a step that exists", () => {
    for (const line of FILE) {
      expect(line.step).toBeGreaterThanOrEqual(1);
      expect(line.step).toBeLessThanOrEqual(LAST_STEP);
    }
  });
});

describe("the steps themselves", () => {
  it("are numbered from one, without gaps", () => {
    expect(STEPS.map(s => s.n)).toEqual(
      Array.from({ length: STEPS.length }, (_, i) => i + 1),
    );
  });

  it("each carry one idea and the sentence to leave with", () => {
    every(n => {
      const step = STEPS.find(s => s.n === n)!;
      expect(step.title.length).toBeGreaterThan(3);
      expect(step.lead.length).toBeGreaterThan(80);
      expect(step.takeaway.length).toBeGreaterThan(25);
    });
  });

  it("explains only keywords that are on screen at that step", () => {
    every(n => {
      const step = STEPS.find(s => s.n === n)!;
      const onScreen = [
        fileAt(n).map(text).join("\n"),
        (step.shell ?? []).map(s => s.text).join("\n"),
        (step.insets ?? [])
          .flatMap(i => [...i.hcl, ...(i.out ?? [])])
          .join("\n"),
        outputAt(n)
          .map(out => out.text)
          .join("\n"),
      ].join("\n");

      for (const kw of step.keywords ?? []) {
        /* only the ones that name something literal; the rest are glosses
           on an idea ("the graph", "drift") and have nothing to match */
        /* a bare plan symbol is a legend, not a literal to find on this
           screen; the test below holds all four to the whole guide */
        if (/^[-+~/]{1,3}$/.test(kw.word)) continue;
        if (!/^[-+~$]|[_.]|=|\{/.test(kw.word)) continue;
        if (/^(terraform|TF_LOG|TF_VAR_name)\b/.test(kw.word)) continue;
        const needle = kw.word
          .replace(/ \{ \}$/, "")
          .replace(/=.*$/, "")
          .trim();
        expect(onScreen, `missing: ${kw.word}`).toContain(needle);
      }
    });
  });
});

describe("the transcripts agree with the file beside them", () => {
  it("adds, in the first plan of each step, what that step introduced", () => {
    for (const step of [2, 6, 10]) {
      const introduced = RESOURCES.filter(
        res => res.kind === "managed" && addrStep(res.addr) === step,
      ).length;
      expect(planLine(step)?.add, `step ${step}`).toBe(introduced);
    }
  });

  it("counts step 8 as seven objects, the data source not among them", () => {
    const managed = RESOURCES.filter(
      res => res.kind === "managed" && addrStep(res.addr) === 8,
    ).length;
    const data = RESOURCES.filter(
      res => res.kind === "data" && addrStep(res.addr) === 8,
    ).length;
    expect(data).toBe(1);
    expect(planLine(8)?.add).toBe(managed);
  });

  it("ends with every managed object added, and nothing changed", () => {
    const managed = RESOURCES.filter(res => res.kind === "managed").length;
    const apply = outputAt(10).find(out =>
      out.text.startsWith("Apply complete"),
    );
    expect(apply?.text).toContain(`${managed} added`);
    expect(apply?.text).toContain("0 changed");
    expect(apply?.text).toContain("0 destroyed");
  });

  it("changes nothing on the second run, which is the whole of convergence", () => {
    expect(outputAt(4).some(out => out.text.includes("No changes."))).toBe(
      true,
    );
    expect(
      outputAt(4).some(
        out =>
          out.text.includes("will be created") ||
          out.text.includes("+ resource"),
      ),
    ).toBe(false);
  });

  it("shows a replacement with the comment that explains it", () => {
    const nine = outputAt(9).map(out => out.text);
    expect(nine.some(t => t.includes("must be replaced"))).toBe(true);
    expect(nine.some(t => t.includes("# forces replacement"))).toBe(true);
    expect(nine.some(t => t.includes("-/+"))).toBe(true);
    expect(nine.some(t => t.includes("~ instance_type"))).toBe(true);
  });

  it("prints each of the four plan symbols somewhere a reader will meet it", () => {
    const all = STEPS.flatMap(step => outputAt(step.n).map(out => out.text));
    const has = (needle: string) => all.some(line => line.includes(needle));
    expect(has("+ resource"), "no create").toBe(true);
    expect(has("~ resource"), "no update in place").toBe(true);
    expect(has("- resource"), "no destroy").toBe(true);
    expect(has("-/+ resource"), "no replacement").toBe(true);
  });

  it("shows a partial apply that is smaller than a whole one", () => {
    const managed = RESOURCES.filter(res => res.kind === "managed").length;
    const line = outputAt(14).find(out =>
      out.text.startsWith("Apply complete"),
    );
    const added = Number(line?.text.match(/(\d+) added/)?.[1]);
    expect(added).toBeLessThan(managed);
    expect(outputAt(14).some(out => out.text.startsWith("Error:"))).toBe(true);
  });
});
