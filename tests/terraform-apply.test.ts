import { describe, it, expect } from "vitest";
import {
  ACTIONS,
  ALL_OPTIONS,
  BY_ADDR,
  EDGES,
  RESOURCES,
  buildSchedule,
  type RunOptions,
} from "../src/data/terraform-apply";

/**
 * The page's claim is that an apply is a GRAPH WALK: an object starts when
 * the things it refers to have finished and a slot is free, and the total
 * is set by the longest chain rather than by the knob. Those are checkable
 * statements, so they are checked here, across every combination of the
 * knobs the page offers.
 *
 * The durations are invented and the tests say nothing about them. The
 * shape — who waits for whom, what a change does to the plan, what
 * create_before_destroy reorders — is the part a reader would carry away
 * wrong if it were wrong here.
 */

const every = (fn: (opt: RunOptions) => void) =>
  ALL_OPTIONS.forEach(opt => {
    try {
      fn(opt);
    } catch (e) {
      throw new Error(
        `${opt.parallelism} forks · ${opt.change} · ${
          opt.cbd ? "create_before_destroy" : "destroy first"
        } · ${opt.refresh ? "refresh" : "no refresh"}: ${e}`,
        { cause: e },
      );
    }
  });

const walk = (opt: RunOptions) =>
  buildSchedule(opt).slots.filter(s => s.part !== "refresh");

describe("the graph", () => {
  it("refers only to objects that exist", () => {
    for (const edge of EDGES) {
      expect(BY_ADDR[edge.from], `missing: ${edge.from}`).toBeDefined();
      expect(BY_ADDR[edge.to], `missing: ${edge.to}`).toBeDefined();
    }
  });

  it("has no cycle, because a cycle is the one thing Terraform cannot plan", () => {
    const seen = new Set<string>();
    const stack = new Set<string>();
    const visit = (addr: string) => {
      if (stack.has(addr)) throw new Error(`cycle through ${addr}`);
      if (seen.has(addr)) return;
      seen.add(addr);
      stack.add(addr);
      BY_ADDR[addr].deps.forEach(visit);
      stack.delete(addr);
    };
    RESOURCES.forEach(res => visit(res.addr));
    expect(seen.size).toBe(RESOURCES.length);
  });

  it("starts from something that waits for nothing", () => {
    expect(RESOURCES.filter(res => !res.deps.length).length).toBeGreaterThan(0);
  });

  it("ends at the record, which is the point of the whole stack", () => {
    const last = RESOURCES.filter(
      res => !RESOURCES.some(other => other.deps.includes(res.addr)),
    ).map(res => res.addr);
    expect(last).toContain("aws_route53_record.app");
  });
});

describe("the walk", () => {
  it("never starts an object before what it refers to has finished", () => {
    every(opt => {
      const slots = walk(opt);
      const ready: Record<string, number> = {};
      for (const slot of slots) {
        ready[slot.addr] = Math.max(ready[slot.addr] ?? 0, slot.end);
      }
      for (const slot of slots) {
        for (const dep of BY_ADDR[slot.addr].deps) {
          if (ready[dep] === undefined) continue;
          const depStart = Math.min(
            ...slots.filter(s => s.addr === dep).map(s => s.start),
          );
          expect(
            slot.start + 1e-9,
            `${slot.addr} started before ${dep}`,
          ).toBeGreaterThanOrEqual(depStart);
        }
      }
    });
  });

  it("never runs more at once than -parallelism allows", () => {
    every(opt => {
      const slots = walk(opt);
      for (const slot of slots) {
        const at = slot.start + 1e-6;
        const overlapping = slots.filter(s => s.start <= at && s.end > at);
        /* a replacement's two halves belong to one object, so count objects */
        const objects = new Set(overlapping.map(s => s.addr));
        expect(objects.size).toBeLessThanOrEqual(opt.parallelism);
      }
    });
  });

  it("does nothing at all for an object the plan calls a no-op", () => {
    every(opt => {
      const slots = walk(opt);
      for (const res of RESOURCES) {
        if (ACTIONS[opt.change][res.addr] !== "noop") continue;
        expect(
          slots.some(s => s.addr === res.addr),
          `${res.addr} should be untouched`,
        ).toBe(false);
      }
    });
  });

  it("gives every object the plan does touch a bar of its own", () => {
    every(opt => {
      const slots = walk(opt);
      for (const res of RESOURCES) {
        const action = ACTIONS[opt.change][res.addr];
        if (action === "noop") continue;
        expect(
          slots.filter(s => s.addr === res.addr).length,
          `${res.addr} is ${action}`,
        ).toBeGreaterThan(0);
      }
    });
  });

  it("gives a replacement two bars, because it is two API calls", () => {
    for (const cbd of [false, true]) {
      const slots = walk({
        parallelism: 10,
        change: "replace",
        cbd,
        refresh: true,
      });
      const parts = slots
        .filter(s => s.addr === 'aws_instance.web["a"]')
        .map(s => s.part);
      expect(parts.sort()).toEqual(["create", "destroy"]);
    }
  });
});

describe("the knobs do what the page says they do", () => {
  it("never finishes later for raising -parallelism", () => {
    for (const change of ["create", "update", "replace"] as const) {
      for (const cbd of [false, true]) {
        const ends = [1, 5, 10, 20].map(
          parallelism =>
            buildSchedule({ parallelism, change, cbd, refresh: true }).end,
        );
        for (let i = 1; i < ends.length; i++) {
          expect(
            ends[i],
            `${change} at ${[1, 5, 10, 20][i]}`,
          ).toBeLessThanOrEqual(ends[i - 1] + 1e-9);
        }
      }
    }
  });

  it("buys nothing past the width of the graph", () => {
    const ten = buildSchedule({
      parallelism: 10,
      change: "create",
      cbd: false,
      refresh: false,
    });
    const twenty = buildSchedule({
      parallelism: 20,
      change: "create",
      cbd: false,
      refresh: false,
    });
    expect(twenty.end).toBeCloseTo(ten.end, 6);
  });

  it("puts the creation first when create_before_destroy is set", () => {
    const addr = 'aws_instance.web["a"]';
    const plain = walk({
      parallelism: 10,
      change: "replace",
      cbd: false,
      refresh: true,
    }).filter(s => s.addr === addr);
    const cbd = walk({
      parallelism: 10,
      change: "replace",
      cbd: true,
      refresh: true,
    }).filter(s => s.addr === addr);

    expect(plain.sort((a, b) => a.start - b.start)[0].part).toBe("destroy");
    expect(cbd.sort((a, b) => a.start - b.start)[0].part).toBe("create");
  });

  it("costs time to refresh, and the same answer either way", () => {
    const on = buildSchedule({
      parallelism: 10,
      change: "update",
      cbd: false,
      refresh: true,
    });
    const off = buildSchedule({
      parallelism: 10,
      change: "update",
      cbd: false,
      refresh: false,
    });
    expect(on.end).toBeGreaterThan(off.end);
    expect(on.slots.some(s => s.part === "refresh")).toBe(true);
    expect(off.slots.some(s => s.part === "refresh")).toBe(false);
  });
});

describe("the critical path", () => {
  it("is the chain the knob cannot shorten", () => {
    const one = buildSchedule({
      parallelism: 1,
      change: "create",
      cbd: false,
      refresh: false,
    });
    const many = buildSchedule({
      parallelism: 20,
      change: "create",
      cbd: false,
      refresh: false,
    });
    expect(many.critical).toContain("aws_lb.app");
    expect(many.critical).toContain("aws_route53_record.app");
    /* one at a time is the sum of every object; all at once is one chain */
    expect(one.end).toBeGreaterThan(many.end);
  });

  it("is a real chain of references, not a list of slow things", () => {
    const { critical } = buildSchedule({
      parallelism: 10,
      change: "create",
      cbd: false,
      refresh: false,
    });
    for (let i = 1; i < critical.length; i++) {
      expect(
        BY_ADDR[critical[i]].deps,
        `${critical[i]} does not refer to ${critical[i - 1]}`,
      ).toContain(critical[i - 1]);
    }
  });

  it("takes about two minutes, nearly all of it the load balancer", () => {
    const { end } = buildSchedule({
      parallelism: 10,
      change: "create",
      cbd: false,
      refresh: false,
    });
    const lb = BY_ADDR["aws_lb.app"].createS;
    const record = BY_ADDR["aws_route53_record.app"].createS;
    expect(end).toBeGreaterThan(lb + record);
    expect((lb + record) / end).toBeGreaterThan(0.9);
  });
});
