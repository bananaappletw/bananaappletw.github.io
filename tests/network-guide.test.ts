import { describe, it, expect } from "vitest";
import {
  LAST_STEP,
  RAIL,
  REQUEST,
  STEPS,
  WIRE_BYTES,
  bytesAt,
  outputAt,
  railAt,
} from "../src/data/network-guide";
import { frameBytes, frameLength } from "../src/data/network-flow";

/**
 * The guide's claim is that the pane growing beside it is not a drawing of
 * a frame but THE frame — the one Part II then sends across eight devices.
 * A guide that ends on an invented header would teach the shape of
 * something that does not exist, so that is the first thing checked here.
 *
 * The rest holds the two properties a reader can feel but not verify: the
 * rail only ever grows, and the transcripts beside it agree with it. A
 * `dig` that answered a different address from the one in the IP header
 * would be a lie no reader could catch.
 */

const every = (fn: (step: number) => void) =>
  STEPS.forEach(step => {
    try {
      fn(step.n);
    } catch (e) {
      throw new Error(`step ${step.n} (${step.title}): ${e}`, { cause: e });
    }
  });

/** the value the real frame carries for one field, for continuity checks */
const fieldValue = (block: string, field: string) => {
  const found = REQUEST.blocks
    .find(b => b.name === block)
    ?.fields.find(f => f.name === field);
  if (!found) throw new Error(`no such field: ${block} · ${field}`);
  return found.value;
};

describe("the rail is the simulation's own frame", () => {
  it("lays out every field of the request, once, in wire order", () => {
    const expected = REQUEST.blocks.flatMap(block => [
      block.name,
      ...block.fields.map(f => f.name),
    ]);
    expect(RAIL.map(line => line.text)).toEqual(expected);
  });

  it("carries the frame's own values, not a retelling of them", () => {
    for (const block of REQUEST.blocks) {
      for (const field of block.fields) {
        const line = RAIL.find(
          l => l.kind === "field" && l.text === field.name,
        );
        expect(line?.value, `${block.name} · ${field.name}`).toBe(field.value);
      }
    }
  });

  it("accounts for exactly the bytes that go on the wire", () => {
    expect(WIRE_BYTES).toBe(frameLength(REQUEST));
    expect(bytesAt(LAST_STEP)).toBe(WIRE_BYTES);
  });

  it("counts the plaintext as nothing, because the cable never carried it", () => {
    const http = RAIL.filter(line => line.offWire);
    expect(http.length).toBeGreaterThan(0);
    expect(http.every(line => line.bytes === 0)).toBe(true);
  });

  it("opens each layer with its heading, never a field first", () => {
    let seen = "";
    for (const line of RAIL) {
      if (line.kind === "layer") {
        seen = line.text;
        continue;
      }
      expect(seen, `${line.text} arrived before any heading`).not.toBe("");
    }
  });

  it("never shows a heading before the first field it covers", () => {
    for (let i = 0; i < RAIL.length; i++) {
      if (RAIL[i].kind !== "layer") continue;
      const fields = [];
      for (let j = i + 1; j < RAIL.length && RAIL[j].kind === "field"; j++) {
        fields.push(RAIL[j]);
      }
      expect(RAIL[i].step, `${RAIL[i].text} has no fields`).toBe(
        Math.min(...fields.map(f => f.step)),
      );
    }
  });
});

describe("the rail only ever grows", () => {
  it("never removes or reorders a line", () => {
    /* The rail fills in by INSERTION, not by appending: the header has a
       fixed layout, and a reader meets its fields in a different order
       from the one they sit in. So the invariant is a subsequence — every
       line already shown is still shown, in the same relative order — and
       not a prefix. */
    for (let step = 2; step <= LAST_STEP; step++) {
      const before = railAt(step - 1).map(line => line.text);
      const after = railAt(step).map(line => line.text);
      expect(after.length).toBeGreaterThanOrEqual(before.length);
      let at = 0;
      for (const line of before) {
        const found = after.indexOf(line, at);
        expect(found, `lost: ${line}`).toBeGreaterThanOrEqual(at);
        at = found + 1;
      }
    }
  });

  it("marks exactly the lines that arrived at this step", () => {
    every(step => {
      const fresh = railAt(step).filter(line => line.fresh).length;
      const grown = railAt(step).length - railAt(step - 1).length;
      expect(fresh).toBe(grown);
    });
  });

  it("starts with nothing on the wire, because nothing has been sent", () => {
    expect(railAt(1)).toEqual([]);
    expect(railAt(2)).toEqual([]);
    expect(railAt(3).length).toBeGreaterThan(0);
  });

  it("keeps every line inside a step that exists", () => {
    for (const line of RAIL) {
      expect(line.step).toBeGreaterThanOrEqual(1);
      expect(line.step).toBeLessThanOrEqual(LAST_STEP);
    }
  });

  it("finishes the addressing before the payload it addresses", () => {
    const at = (name: string) => RAIL.find(line => line.text === name)!.step;
    expect(at("Ethernet II")).toBeLessThan(at("IPv4"));
    expect(at("IPv4")).toBeLessThan(at("TCP"));
    expect(at("TCP")).toBeLessThan(at("TLS application data"));
    expect(at("TLS application data")).toBeLessThan(at("HTTP request"));
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

  it("explains only what is on screen at that step", () => {
    every(n => {
      const step = STEPS.find(s => s.n === n)!;
      /* what the reader can see, EXCLUDING the gloss itself — a keyword
         that only appears in its own definition is a word, not a thing */
      const onScreen = [
        railAt(n)
          .map(line => `${line.text} ${line.value ?? ""}`)
          .join("\n"),
        (step.shell ?? []).map(s => `${s.text} ${s.note ?? ""}`).join("\n"),
        (step.insets ?? []).flatMap(i => i.body).join("\n"),
        outputAt(n)
          .map(out => out.text)
          .join("\n"),
      ].join("\n");

      for (const kw of step.keywords ?? []) {
        if (kw.idea) continue;
        expect(onScreen, `missing: ${kw.word}`).toContain(kw.word);
      }
    });
  });

  it("never explains the same word twice in one step", () => {
    every(n => {
      const words = (STEPS.find(s => s.n === n)!.keywords ?? []).map(
        k => k.word,
      );
      expect(new Set(words).size).toBe(words.length);
    });
  });

  it("holds an idea to being an idea, not a literal in disguise", () => {
    for (const step of STEPS) {
      for (const kw of step.keywords ?? []) {
        if (!kw.idea) continue;
        expect(
          /^[a-z][a-z -]+$/.test(kw.word),
          `${kw.word} looks like a literal, not an idea`,
        ).toBe(true);
      }
    }
  });
});

describe("the transcripts agree with the frame beside them", () => {
  it("resolves the name to the address the IP header then carries", () => {
    const answer = fieldValue("IPv4", "Destination address");
    const dig = outputAt(5).map(out => out.text);
    expect(dig.some(line => line.includes(answer))).toBe(true);
    expect(dig.some(line => line.includes("ANSWER SECTION"))).toBe(true);
  });

  it("shows the connection on the ports the TCP header carries", () => {
    const src = fieldValue("TCP", "Source port");
    const ss = outputAt(7).map(out => out.text);
    expect(ss.some(line => line.includes(`:${src}`))).toBe(true);
    expect(ss.some(line => line.includes(":443"))).toBe(true);
  });

  it("dumps the frame's own first bytes, not a plausible-looking hex", () => {
    const head = frameBytes(REQUEST)
      .slice(0, 6)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    /* tcpdump groups the bytes in twos: f09f c211 aa01 */
    const grouped = head.replace(/(.{4})(?=.)/g, "$1 ");
    expect(outputAt(12).some(out => out.text.includes(grouped))).toBe(true);
  });

  it("translates the port the NAT table says it translates", () => {
    const src = fieldValue("TCP", "Source port");
    const nat = outputAt(11).map(out => out.text);
    expect(nat.some(line => line.includes(`sport=${src}`))).toBe(true);
    expect(nat.some(line => line.includes("dport=61001"))).toBe(true);
  });

  it("shows the handshake as three packets carrying no data", () => {
    const dump = outputAt(8).map(out => out.text);
    expect(dump.filter(line => line.includes("length 0")).length).toBe(3);
    expect(dump.some(line => line.includes("Flags [S],"))).toBe(true);
    expect(dump.some(line => line.includes("Flags [S.],"))).toBe(true);
    expect(dump.some(line => line.includes("Flags [.],"))).toBe(true);
  });

  it("names a layer for each failure, and one that is not a failure", () => {
    const fails = outputAt(13);
    expect(fails.filter(out => out.kind === "bad").length).toBe(4);
    expect(fails.some(out => out.text.includes("502"))).toBe(true);
  });

  it("ends on the clock Part II then runs", () => {
    const timing = outputAt(14).map(out => out.text);
    expect(timing.some(line => line.includes("time_namelookup"))).toBe(true);
    expect(timing.some(line => line.includes("time_appconnect"))).toBe(true);
  });

  it("prints something at every step that claims to run a command", () => {
    every(n => {
      const step = STEPS.find(s => s.n === n)!;
      if (!step.shell?.length) return;
      expect(outputAt(n).length, "a command with no output").toBeGreaterThan(0);
    });
  });
});
