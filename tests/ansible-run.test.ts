import { describe, it, expect } from "vitest";
import {
  EVENTS,
  FORKS,
  HOSTS,
  LINK_MS,
  MANAGED,
  PLAYBOOK,
  PLAYS,
  PRECEDENCE,
  RECAP,
  RUN_END,
  SCHEDULE,
  TASKS,
} from "../src/data/ansible-run";

/**
 * The /ansible page's whole claim is that its schedule is the real one:
 * that the gaps a reader sees come from the fork ceiling and the linear
 * strategy's barrier, and not from numbers chosen to look busy. These are
 * the parts of that claim a machine can check.
 *
 * The verdicts are checked too, because the page's second claim is that a
 * verdict is a statement about the HOST — so the same task has to come back
 * differently on hosts in different states, and `notify` has to follow
 * `changed` rather than "the task ran".
 */

const eventOf = (slot: (typeof SCHEDULE)[number]) => EVENTS[slot.event];
const taskOf = (n: number) => TASKS.find(t => t.n === n)!;

describe("the plays and the tasks line up", () => {
  it("gives every task a play that exists", () => {
    for (const task of TASKS) {
      expect(PLAYS.some(p => p.n === task.play)).toBe(true);
    }
  });

  it("targets only hosts the task's play targets", () => {
    for (const task of TASKS) {
      const play = PLAYS.find(p => p.n === task.play)!;
      for (const host of task.hosts) {
        expect(play.hosts).toContain(host);
      }
    }
  });

  it("gives every managed host a place in the inventory", () => {
    for (const host of MANAGED) {
      const h = HOSTS.find(x => x.id === host)!;
      expect(h.groups.length).toBeGreaterThan(0);
      expect(LINK_MS[host]).toBeGreaterThan(0);
    }
  });

  it("maps every playbook line to a task that exists, or to none", () => {
    for (const line of PLAYBOOK) {
      if (line.task === null) continue;
      expect(TASKS.some(t => t.n === line.task)).toBe(true);
    }
  });

  it("gives every non-handler task at least one line of its own", () => {
    for (const task of TASKS.filter(t => !t.handler)) {
      expect(PLAYBOOK.filter(l => l.task === task.n).length).toBeGreaterThan(0);
    }
  });
});

describe("every task-and-host pair is scheduled exactly once", () => {
  it("has one event per pair the play targets", () => {
    const want = TASKS.flatMap(t => t.hosts.map(h => `${t.n}:${h}`)).sort();
    const got = EVENTS.map(e => `${e.task}:${e.host}`).sort();
    expect(got).toEqual(want);
  });

  it("schedules each event once", () => {
    expect(SCHEDULE.length).toBe(EVENTS.length);
    expect(new Set(SCHEDULE.map(s => s.event)).size).toBe(EVENTS.length);
  });

  it("keeps the slot's task and host agreeing with its event", () => {
    for (const slot of SCHEDULE) {
      const e = eventOf(slot);
      expect(slot.task).toBe(e.task);
      expect(slot.host).toBe(e.host);
    }
  });
});

describe("the linear strategy's barrier", () => {
  /**
   * The default strategy is `linear`, and the word means this and only this:
   * a host may not begin task n+1 until EVERY host in the play has finished
   * task n. It is the reason one slow host costs the whole play, and the
   * reason `strategy: free` exists.
   */
  it("starts no task before every host finished the one before it", () => {
    for (const play of PLAYS) {
      const tasks = TASKS.filter(t => t.play === play.n);
      for (let i = 1; i < tasks.length; i++) {
        const prev = SCHEDULE.filter(s => s.task === tasks[i - 1].n);
        const here = SCHEDULE.filter(s => s.task === tasks[i].n);
        const lastEnd = Math.max(...prev.map(s => s.t1));
        for (const slot of here) {
          expect(slot.t0).toBeGreaterThanOrEqual(lastEnd - 1e-9);
        }
      }
    }
  });

  it("runs the second play only after the first one has finished", () => {
    const first = SCHEDULE.filter(s => taskOf(s.task).play === 0);
    const second = SCHEDULE.filter(s => taskOf(s.task).play === 1);
    const firstEnd = Math.max(...first.map(s => s.t1));
    expect(Math.min(...second.map(s => s.t0))).toBeGreaterThanOrEqual(
      firstEnd - 1e-9,
    );
  });

  it("flushes the handler after the last task of its play", () => {
    const handler = TASKS.find(t => t.handler)!;
    const others = TASKS.filter(t => t.play === handler.play && !t.handler);
    const lastTask = Math.max(
      ...SCHEDULE.filter(s => others.some(t => t.n === s.task)).map(s => s.t1),
    );
    for (const slot of SCHEDULE.filter(s => s.task === handler.n)) {
      expect(slot.t0).toBeGreaterThanOrEqual(lastTask - 1e-9);
    }
  });
});

describe("the fork ceiling", () => {
  /**
   * `forks` is the hard limit on how many hosts are worked at once, and with
   * three web servers and two forks one of them always waits. Overlap is
   * counted at every boundary in the schedule, which is enough: an interval
   * overlap set can only change where one begins or ends.
   */
  it("never works more hosts at once than there are forks", () => {
    const real = SCHEDULE.filter(s => s.fork >= 0);
    const marks = real.flatMap(s => [s.t0, s.t1]);
    for (const at of marks) {
      const live = real.filter(s => s.t0 <= at && at < s.t1).length;
      expect(live).toBeLessThanOrEqual(FORKS);
    }
  });

  it("gives a real event a fork, and a skipped one none", () => {
    for (const slot of SCHEDULE) {
      const skipped = eventOf(slot).verdict === "skipped";
      expect(slot.fork >= 0).toBe(!skipped);
      if (slot.fork >= 0) expect(slot.fork).toBeLessThan(FORKS);
    }
  });

  it("never puts two events on one fork at the same time", () => {
    for (let fork = 0; fork < FORKS; fork++) {
      const mine = SCHEDULE.filter(s => s.fork === fork).sort(
        (a, b) => a.t0 - b.t0,
      );
      for (let i = 1; i < mine.length; i++) {
        expect(mine[i].t0).toBeGreaterThanOrEqual(mine[i - 1].t1 - 1e-9);
      }
    }
  });

  it("makes web3 wait at the first real task, which is the whole lesson", () => {
    const install = SCHEDULE.filter(s => s.task === 1);
    const web3 = install.find(s => s.host === "web3")!;
    const others = install.filter(s => s.host !== "web3");
    expect(web3.t0).toBeGreaterThan(Math.min(...others.map(s => s.t0)));
  });
});

describe("the clock", () => {
  it("orders every slot's own four moments", () => {
    for (const slot of SCHEDULE) {
      expect(slot.out).toBeGreaterThanOrEqual(slot.t0);
      expect(slot.back).toBeGreaterThanOrEqual(slot.out);
      expect(slot.t1).toBeGreaterThanOrEqual(slot.back);
    }
  });

  it("charges a real event the link both ways and the module in between", () => {
    for (const slot of SCHEDULE.filter(s => s.fork >= 0)) {
      const e = eventOf(slot);
      expect(slot.out - slot.t0).toBeCloseTo(LINK_MS[slot.host], 6);
      expect(slot.t1 - slot.back).toBeCloseTo(LINK_MS[slot.host], 6);
      expect(slot.back - slot.out).toBeCloseTo(e.runMs, 6);
    }
  });

  it("charges a skipped event no transport at all", () => {
    const skipped = SCHEDULE.filter(s => eventOf(s).verdict === "skipped");
    expect(skipped.length).toBeGreaterThan(0);
    for (const slot of skipped) {
      expect(slot.out).toBe(slot.t0);
      expect(slot.back).toBe(slot.t0);
      expect(eventOf(slot).runMs).toBe(0);
    }
  });

  it("ends after everything it scheduled", () => {
    expect(RUN_END).toBeGreaterThan(Math.max(...SCHEDULE.map(s => s.t1)));
  });
});

describe("a verdict is a statement about the host", () => {
  it("gives one task three different verdicts across three hosts", () => {
    const template = EVENTS.filter(e => e.task === 2);
    expect(new Set(template.map(e => e.verdict)).size).toBeGreaterThan(1);
  });

  it("builds a different module for the same task on a different family", () => {
    const install = EVENTS.filter(e => e.task === 1);
    expect(new Set(install.map(e => e.module)).size).toBe(2);
    for (const e of install) {
      expect(e.module).not.toBe(taskOf(1).module);
    }
  });

  it("notifies a handler only from a changed event", () => {
    for (const e of EVENTS) {
      if (e.notified) expect(e.verdict).toBe("changed");
    }
  });

  it("runs the handler on exactly the hosts that notified it", () => {
    const handler = TASKS.find(t => t.handler)!;
    const notified = EVENTS.filter(e => e.notified).map(e => e.host);
    expect([...handler.hosts].sort()).toEqual([...new Set(notified)].sort());
    expect(handler.hosts).not.toContain("web3");
  });

  it("never reports a fact-gathering run as changed", () => {
    for (const e of EVENTS.filter(e => e.module.endsWith("setup"))) {
      expect(e.verdict).toBe("ok");
    }
  });

  it("opens no connection for a skipped event", () => {
    for (const e of EVENTS.filter(e => e.verdict === "skipped")) {
      expect(e.stages.every(s => s.where === "control")).toBe(true);
    }
  });

  it("gives every event a reply and a reason", () => {
    for (const e of EVENTS) {
      expect(e.ret.length).toBeGreaterThan(0);
      expect(e.why.length).toBeGreaterThan(10);
      expect(e.stages.length).toBeGreaterThan(1);
    }
  });

  it("resolves every Jinja argument it shows", () => {
    for (const e of EVENTS) {
      for (const arg of e.args) {
        if (arg.raw.includes("{{")) expect(arg.resolved).toBeTruthy();
      }
    }
  });
});

describe("the play recap", () => {
  it("has a row per managed host", () => {
    expect(RECAP.map(r => r.host).sort()).toEqual([...MANAGED].sort());
  });

  it("counts a changed task in both columns, as Ansible does", () => {
    for (const row of RECAP) {
      expect(row.ok).toBeGreaterThanOrEqual(row.changed);
    }
  });

  it("totals to one line per scheduled event", () => {
    const counted = RECAP.reduce((n, r) => n + r.ok + r.skipped, 0);
    expect(counted).toBe(SCHEDULE.length);
  });

  it("skips exactly one task, on the one host the `when` excludes", () => {
    const skipped = RECAP.filter(r => r.skipped > 0);
    expect(skipped.map(r => r.host)).toEqual(["web3"]);
    expect(skipped[0].skipped).toBe(1);
  });

  it("reaches every host and fails nothing", () => {
    for (const row of RECAP) {
      expect(row.unreachable).toBe(0);
      expect(row.failed).toBe(0);
    }
  });
});

describe("the precedence ladder", () => {
  it("is a total order of twenty-two rungs", () => {
    expect(PRECEDENCE.map(r => r.n)).toEqual(
      Array.from({ length: 22 }, (_, i) => i + 1),
    );
  });

  it("puts role defaults near the floor and extra vars on top", () => {
    expect(PRECEDENCE[1].what).toContain("role defaults");
    expect(PRECEDENCE[21].what).toContain("extra vars");
  });

  it("ranks role vars above play vars, which is the usual surprise", () => {
    const play = PRECEDENCE.find(r => r.what === "play vars")!;
    const role = PRECEDENCE.find(r => r.what === "role vars")!;
    expect(role.n).toBeGreaterThan(play.n);
  });
});
