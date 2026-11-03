import { describe, it, expect } from "vitest";
import { TICKS, frameBytes, type LayerBlock } from "../src/data/network-flow";

/**
 * The /network page's whole claim is that its hex is real. These are the
 * parts of that claim a machine can check: a header whose checksum verifies,
 * a length field that matches the bytes actually present, an offset that
 * points where it says it does. If one of these fails, the page is teaching
 * something false and that is worse than teaching nothing.
 */

/** RFC 1071 over a correct header sums to zero once the carry is folded. */
const verify = (bytes: number[]) => {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    sum += (bytes[i] << 8) + (bytes[i + 1] ?? 0);
  }
  while (sum >> 16) sum = (sum & 0xffff) + (sum >>> 16);
  return (~sum & 0xffff) === 0;
};

const blockBytes = (b: LayerBlock) => b.fields.flatMap(f => f.bytes);
const find = (blocks: LayerBlock[], name: string) =>
  blocks.find(b => b.name === name);

const every = (fn: (t: (typeof TICKS)[number]) => void) =>
  TICKS.forEach((tick, i) => {
    try {
      fn(tick);
    } catch (e) {
      throw new Error(
        `hop ${i} (${tick.step.label}, ${tick.hop.from} → ${tick.hop.to}): ${e}`,
        { cause: e },
      );
    }
  });

describe("every frame on the wire", () => {
  it("opens with a 14-byte Ethernet header", () => {
    every(({ hop }) => {
      const eth = hop.frame.blocks[0];
      expect(eth.name).toBe("Ethernet II");
      expect(blockBytes(eth).length).toBe(14);
    });
  });

  it("is either IPv4 or ARP, and nothing else", () => {
    every(({ hop }) => {
      const second = hop.frame.blocks[1];
      expect(["IPv4", "ARP request", "ARP reply"]).toContain(second.name);
    });
  });

  it("carries an IPv4 header whose checksum verifies", () => {
    every(({ hop }) => {
      const ip = find(hop.frame.blocks, "IPv4");
      if (!ip) return;
      const bytes = blockBytes(ip);
      expect(bytes.length).toBe(20);
      expect(verify(bytes), `checksum does not verify`).toBe(true);
    });
  });

  it("states a total length that matches the bytes after Ethernet", () => {
    every(({ hop }) => {
      const ip = find(hop.frame.blocks, "IPv4");
      if (!ip) return;
      const stated = (blockBytes(ip)[2] << 8) + blockBytes(ip)[3];
      expect(stated).toBe(frameBytes(hop.frame).length - 14);
    });
  });

  it("writes a 28-byte ARP body when it is an ARP frame", () => {
    every(({ hop }) => {
      const a =
        find(hop.frame.blocks, "ARP request") ??
        find(hop.frame.blocks, "ARP reply");
      if (!a) return;
      expect(blockBytes(a).length).toBe(28);
      expect(frameBytes(hop.frame).length).toBe(42);
    });
  });

  it("states a UDP length that matches its own header plus payload", () => {
    every(({ hop }) => {
      const udp = find(hop.frame.blocks, "UDP");
      if (!udp) return;
      const bytes = blockBytes(udp);
      const stated = (bytes[4] << 8) + bytes[5];
      const after = hop.frame.blocks
        .slice(hop.frame.blocks.indexOf(udp) + 1)
        .filter(b => !b.offWire)
        .flatMap(blockBytes).length;
      expect(stated).toBe(8 + after);
    });
  });

  it("points its TCP data offset at the end of the TCP header", () => {
    every(({ hop }) => {
      const tcp = find(hop.frame.blocks, "TCP");
      if (!tcp) return;
      const bytes = blockBytes(tcp);
      expect((bytes[12] >> 4) * 4).toBe(bytes.length);
    });
  });

  it("keeps the plaintext out of the bytes a tap would see", () => {
    every(({ hop }) => {
      const sealed = hop.frame.blocks.filter(b => b.offWire);
      if (!sealed.length) return;
      const wire = frameBytes(hop.frame);
      const hidden = sealed.flatMap(blockBytes);
      expect(wire.length).toBe(
        hop.frame.blocks.flatMap(blockBytes).length - hidden.length,
      );
    });
  });
});

describe("the path", () => {
  it("loses a hop of TTL at every router and none at the switch", () => {
    /** null for ARP, which has no TTL — there is no hop to count down. */
    const ttlOf = (blocks: LayerBlock[]) => {
      const ip = find(blocks, "IPv4");
      return ip ? blockBytes(ip)[8] : null;
    };

    for (const step of new Set(TICKS.map(t => t.step))) {
      const hops = step.hops;
      hops.forEach((hop, i) => {
        if (i === 0) return;
        const before = ttlOf(hops[i - 1].frame.blocks);
        const now = ttlOf(hop.frame.blocks);
        if (before === null || now === null) return;
        const crossedSwitch =
          hops[i - 1].to === "switch" || hop.from === "switch";
        const drop = before - now;
        expect(
          drop,
          `${step.label}: ${hops[i - 1].to} → ${hop.to} dropped ${drop}`,
        ).toBe(crossedSwitch ? 0 : 1);
      });
    }
  });

  it("rewrites the source address exactly once on the way out", () => {
    const outbound = TICKS.filter(
      t =>
        t.hop.from === "laptop" ||
        t.hop.to === "server" ||
        t.hop.to === "resolver",
    );
    expect(outbound.length).toBeGreaterThan(0);

    for (const step of new Set(TICKS.map(t => t.step))) {
      const sources = step.hops.flatMap(h => {
        const ip = find(h.frame.blocks, "IPv4");
        return ip
          ? [ip.fields.find(f => f.name === "Source address")!.value]
          : [];
      });
      expect(new Set(sources).size).toBeLessThanOrEqual(2);
    }
  });
});
