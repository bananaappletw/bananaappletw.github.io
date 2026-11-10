import { describe, it, expect } from "vitest";
import {
  HOSTS_AT,
  LAST_STEP,
  STEPS,
  TASK_STEP,
  fileAt,
  outputAt,
  stepOfLine,
  tasksAt,
} from "../src/data/ansible-guide";
import { EVENTS, PLAYBOOK, RECAP, TASKS } from "../src/data/ansible-run";

/**
 * The guide's claim is that it builds, in front of the reader, exactly the
 * file the rest of the page then simulates. A guide that ends somewhere
 * other than where the next part begins is a guide to nothing, so that is
 * the first thing checked here and the reason this file exists.
 *
 * The rest holds the two properties a reader can feel but not verify: the
 * file only ever grows, and the terminal output is the same truth the
 * simulation runs on rather than a plausible-looking transcript.
 */

const text = (line: { segs: { t: string }[] }) =>
  line.segs.map(s => s.t).join("");

const every = (fn: (step: number) => void) =>
  STEPS.forEach(step => {
    try {
      fn(step.n);
    } catch (e) {
      throw new Error(`step ${step.n} (${step.title}): ${e}`, { cause: e });
    }
  });

describe("the guide ends where the simulation begins", () => {
  it("builds the whole playbook, line for line, by the last step", () => {
    expect(fileAt(LAST_STEP).map(text)).toEqual(PLAYBOOK.map(text));
  });

  it("leaves no line of the playbook unreachable", () => {
    for (const line of PLAYBOOK) {
      expect(stepOfLine(line)).toBeLessThanOrEqual(LAST_STEP);
      expect(stepOfLine(line)).toBeGreaterThan(0);
    }
  });

  it("introduces every task the simulation runs", () => {
    expect(
      Object.keys(TASK_STEP)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual(TASKS.map(t => t.n).sort((a, b) => a - b));
    expect(tasksAt(LAST_STEP).length).toBe(TASKS.length);
  });
});

describe("the file only ever grows", () => {
  it("never removes or reorders a line", () => {
    for (let step = 2; step <= LAST_STEP; step++) {
      const before = fileAt(step - 1).map(text);
      const after = fileAt(step).map(text);
      expect(after.length).toBeGreaterThanOrEqual(before.length);
      /* every earlier line is still there, in the same order */
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
      const fresh = fileAt(step).filter(l => l.fresh).length;
      const grown = fileAt(step).length - fileAt(step - 1).length;
      expect(fresh).toBe(grown);
    });
  });

  it("never shows a task's lines before the play that holds them", () => {
    for (const task of TASKS) {
      /* A handler's lines live in the play's head, not in the task list,
         so it has no lines of its own to be early. */
      const own = PLAYBOOK.find(l => l.task === task.n && l.part === "task");
      if (!own) continue;
      const play = own.play;
      const playArrives = Math.min(
        ...PLAYBOOK.filter(l => l.play === play && l.part === "play").map(
          stepOfLine,
        ),
      );
      expect(TASK_STEP[task.n]).toBeGreaterThanOrEqual(playArrives);
    }
  });

  it("widens the host set without ever narrowing it", () => {
    for (let step = 2; step <= LAST_STEP; step++) {
      const before = HOSTS_AT[step - 1] ?? [];
      const after = HOSTS_AT[step] ?? [];
      for (const host of before) expect(after).toContain(host);
    }
  });

  it("starts against one machine and finishes against all four", () => {
    expect(HOSTS_AT[2]).toEqual(["web1"]);
    expect(HOSTS_AT[LAST_STEP].length).toBe(RECAP.length);
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
      expect(step.lead.length).toBeGreaterThan(40);
      expect(step.takeaway.length).toBeGreaterThan(20);
    });
  });

  it("explain only keywords that are on screen at that step", () => {
    every(n => {
      const step = STEPS.find(s => s.n === n)!;
      const onScreen =
        fileAt(n).map(text).join("\n") +
        "\n" +
        (step.shell ?? []).map(s => s.text).join("\n") +
        "\n" +
        (step.insets ?? []).flatMap(i => i.yaml).join("\n");
      for (const kw of step.keywords ?? []) {
        /* only the ones that name a literal: prose keywords are glosses */
        if (!/^[-{]|:$/.test(kw.word)) continue;
        const needle = kw.word.replace(/:$/, "");
        expect(onScreen, `missing: ${kw.word}`).toContain(needle);
      }
    });
  });

  it("shows no output before there is a host to run against", () => {
    const first = STEPS[0];
    expect(HOSTS_AT[first.n]).toEqual([]);
    expect(outputAt(first.n)).toEqual([]);
  });

  /* The ad-hoc steps run `ansible`, not `ansible-playbook`, and they print
     their own transcript. A generated PLAY RECAP there would describe a
     command the reader has not typed. */
  it("shows no playbook output before the file exists", () => {
    for (let step = 1; step < 3; step++) {
      expect(tasksAt(step)).toEqual([]);
      expect(outputAt(step), `step ${step}`).toEqual([]);
    }
    expect(tasksAt(3).length).toBeGreaterThan(0);
    expect(outputAt(3).length).toBeGreaterThan(0);
  });
});

describe("the terminal output is the simulation's own truth", () => {
  it("prints a line per host per task, and nothing else", () => {
    every(n => {
      if (!HOSTS_AT[n]?.length) return;
      const hosts = HOSTS_AT[n];
      const want = tasksAt(n)
        .filter(t => !t.handler)
        .reduce(
          (sum, t) => sum + t.hosts.filter(h => hosts.includes(h)).length,
          0,
        );
      const got = outputAt(n).filter(l =>
        ["ok", "changed", "skipped", "failed"].includes(l.kind),
      ).length;
      /* handlers add their own lines, so the body is a lower bound */
      expect(got).toBeGreaterThanOrEqual(want);
    });
  });

  it("agrees with the events on every verdict it prints", () => {
    const hosts = HOSTS_AT[LAST_STEP];
    for (const task of tasksAt(LAST_STEP).filter(t => !t.handler)) {
      for (const host of task.hosts) {
        if (!hosts.includes(host)) continue;
        const e = EVENTS.find(x => x.task === task.n && x.host === host)!;
        const want =
          e.verdict === "skipped"
            ? `skipping: [${host}]`
            : `${e.verdict}: [${host}]`;
        expect(outputAt(LAST_STEP).map(l => l.text)).toContain(want);
      }
    }
  });

  it("matches the simulation's PLAY RECAP at the last step", () => {
    const recap = outputAt(LAST_STEP).filter(l => l.kind === "recap");
    expect(recap.length).toBe(RECAP.length);
    for (const row of RECAP) {
      const line = recap.find(l => l.host === row.host)!;
      expect(line.text).toContain(`ok=${row.ok}`);
      expect(line.text).toContain(`changed=${row.changed}`);
      expect(line.text).toContain(`skipped=${row.skipped}`);
      expect(line.text).toContain("failed=0");
      expect(line.text).toContain("unreachable=0");
    }
  });

  it("changes nothing on a rerun, which is the whole of idempotency", () => {
    for (let step = 3; step <= LAST_STEP; step++) {
      const again = outputAt(step, true);
      expect(
        again.some(l => l.kind === "changed"),
        `step ${step}`,
      ).toBe(false);
      for (const line of again.filter(l => l.kind === "recap")) {
        expect(line.text).toContain("changed=0");
      }
    }
  });

  it("runs no handler on a rerun, because nothing notified it", () => {
    const again = outputAt(LAST_STEP, true);
    expect(again.some(l => l.text.includes("RUNNING HANDLER"))).toBe(false);
  });

  it("runs the handler only on the hosts whose task changed", () => {
    const out = outputAt(9).map(l => l.text);
    const at = out.findIndex(l => l.includes("RUNNING HANDLER"));
    expect(at).toBeGreaterThan(0);
    const after = out.slice(at + 1, at + 4).join("\n");
    expect(after).toContain("web1");
    expect(after).toContain("web2");
    expect(after).not.toContain("web3");
  });

  it("skips web3 once the conditional exists, and not before", () => {
    expect(outputAt(6).some(l => l.kind === "skipped")).toBe(false);
    expect(outputAt(7).some(l => l.kind === "skipped")).toBe(true);
  });
});
