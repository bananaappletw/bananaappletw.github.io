/**
 * The flow behind `/network`: one HTTPS request, assembled as real frames.
 *
 * Every byte on that page comes from here, and every byte is built the way a
 * stack builds it — fields in order, lengths measured rather than quoted,
 * checksums computed over the bytes that precede them. Nothing is a string of
 * plausible-looking hex. That is the whole point of the page: a reader who
 * decides to check one of these against Wireshark should find it correct, and
 * `tests/network-flow.test.ts` checks the ones a machine can.
 *
 * ── the shape of it ──────────────────────────────────────────────────────
 *
 * A FRAME is a list of blocks, outermost first: Ethernet, then IPv4, then
 * TCP or UDP, then whatever the application put inside. A block is a list of
 * fields, and a field owns its own bytes. Offsets are therefore never
 * written down — the hex pane walks the frame and counts — so a field cannot
 * drift out of step with the bytes it claims to describe.
 *
 * A STEP is one thing that happens ("the DNS query goes out"). A step has
 * HOPS, one per link it crosses, and each hop carries its own frame. That
 * split is the lesson the page exists to teach: the same request is a
 * different frame on every wire it touches. The switch forwards one
 * unchanged, because a switch reads layer 2 and nothing above it; the router
 * writes new MAC addresses because the old ones were only ever meaningful on
 * the last cable; and the NAT rewrites the source address and port, which is
 * why the reply can find its way back to one laptop out of the dozens behind
 * that router.
 */

/* ── the wire ──────────────────────────────────────────────────────────── */

export type NodeId =
  | "laptop"
  | "phone"
  | "printer"
  | "switch"
  | "router"
  | "isp"
  | "resolver"
  | "server"
  | "neighbour"
  | "neighbour-router";

/** One port, socket or radio on a device — a device is its interfaces. */
export type Iface = {
  name: string;
  mac?: string;
  ip?: string;
  /** what this particular interface is for, where that is not obvious */
  note?: string;
};

export type Node = {
  id: NodeId;
  name: string;
  /** what it is, in one line, for the label under the drawing */
  role: string;
  /** which layer it actually reads — the reason it does what it does */
  reads: string;
  /** the paragraph the sidebar leads with when this device is selected */
  about: string;
  ifaces: Iface[];
  ip?: string;
  mac?: string;
  /** which of the switch's ports it hangs off, for the MAC table */
  port?: number;
  /** position on the canvas, 0..1 across and 0..1 down */
  x: number;
  y: number;
};

export const NODES: Node[] = [
  {
    id: "laptop",
    name: "Laptop",
    role: "where the request starts",
    reads: "all seven",
    about:
      "The only machine here that runs the whole stack for itself. It holds the socket, counts the bytes, checks the certificate and draws the page. Everything between here and the server only moves its bytes, and understands less of them the further out you go.",
    ifaces: [
      {
        name: "en0",
        mac: "a4:83:e7:1c:9d:40",
        ip: "192.168.1.42/24",
        note: "address given out by the router's DHCP; it only means anything inside the house",
      },
    ],
    ip: "192.168.1.42",
    mac: "a4:83:e7:1c:9d:40",
    port: 1,
    x: 0.09,
    y: 0.17,
  },
  {
    id: "phone",
    name: "Phone",
    role: "someone else's traffic, on the same wire",
    reads: "all seven",
    about:
      "It is not sending anything on this page, and it still matters. It already has a connection through the same router, which is why the NAT table has a row that has nothing to do with the laptop. One public address, several machines, and only the port number keeps them apart.",
    ifaces: [
      { name: "wlan0", mac: "6e:1a:bb:04:c7:93", ip: "192.168.1.57/24" },
    ],
    ip: "192.168.1.57",
    mac: "6e:1a:bb:04:c7:93",
    port: 2,
    x: 0.09,
    y: 0.42,
  },
  {
    id: "printer",
    name: "Printer",
    role: "silent, so the switch cannot see it",
    reads: "layers 1–4",
    about:
      "It has said nothing since the switch powered on, so the switch has never learned which port it is on. A frame sent to it would go out of every port. That is what a switch does when it does not know, and it stops as soon as the printer speaks once.",
    ifaces: [{ name: "eth0", mac: "00:17:c8:2d:41:08", ip: "192.168.1.90/24" }],
    ip: "192.168.1.90",
    mac: "00:17:c8:2d:41:08",
    port: 3,
    x: 0.09,
    y: 0.66,
  },
  {
    id: "switch",
    name: "Switch",
    role: "the cable the house shares",
    reads: "layer 2 only",
    about:
      "It reads a destination MAC address, looks up which port that address was last heard on, and forwards the frame. It never opens the IP header. That is why nothing it touches above layer 2 ever changes.",
    ifaces: [
      { name: "port 1", note: "Laptop" },
      { name: "port 2", note: "Phone" },
      { name: "port 3", note: "Printer" },
      { name: "port 4", note: "Router" },
    ],
    port: 4,
    x: 0.3,
    y: 0.42,
  },
  {
    id: "router",
    name: "Router",
    role: "the edge of the house, and the NAT",
    reads: "layers 2–4",
    about:
      "Two interfaces in two different worlds: a private address inside, one public address outside. Everything that leaves gets that public address and a port the router picks, and the router writes down the swap so it can undo it when the answer comes back.",
    ifaces: [
      {
        name: "br-lan",
        mac: "f0:9f:c2:11:aa:01",
        ip: "192.168.1.1/24",
        note: "the gateway every machine in the house points at",
      },
      {
        name: "eth-wan",
        mac: "f0:9f:c2:11:aa:02",
        ip: "203.0.113.7/30",
        note: "the one address the rest of the internet ever sees",
      },
    ],
    ip: "192.168.1.1 · 203.0.113.7",
    mac: "f0:9f:c2:11:aa:01",
    x: 0.51,
    y: 0.42,
  },
  {
    id: "isp",
    name: "ISP",
    role: "the first hop that is not yours",
    reads: "layers 2–3",
    about:
      "A router like the one in your hallway, but with a routing table instead of a NAT. It keeps no state about this connection at all, and could not put the stream back together if it wanted to. It reads a destination address and picks the next hop.",
    ifaces: [
      { name: "ge-0/0/1", mac: "00:1b:21:3c:77:02", ip: "203.0.113.1/30" },
      { name: "ae0", note: "upstream, toward everything else" },
    ],
    ip: "203.0.113.1",
    x: 0.71,
    y: 0.42,
  },
  {
    id: "neighbour-router",
    name: "Their router",
    role: "another customer on the same street",
    reads: "layers 2–4",
    about:
      "Someone else's edge, doing to their house what yours does to yours: one public address, a table of swaps, and no knowledge of anything past its own two interfaces. The ISP treats it exactly like yours. That is the whole idea — the internet works at this size because no device in the middle knows anything about the devices at the ends.",
    ifaces: [
      {
        name: "br-lan",
        ip: "192.168.0.1/24",
        note: "the same private range, used again; private addresses exist so they can be",
      },
      { name: "eth-wan", ip: "198.51.100.23/30" },
    ],
    ip: "198.51.100.23",
    x: 0.71,
    y: 0.84,
  },
  {
    id: "neighbour",
    name: "Their laptop",
    role: "somebody else, loading the same site",
    reads: "all seven",
    about:
      "Not yours, and here for two reasons. It shows that the cable to the street is shared, so your packets and theirs take turns on it. And it shows the far end holding two connections at once, told apart by nothing more than an address and a port.",
    ifaces: [
      {
        name: "wlan0",
        ip: "192.168.0.31/24",
        note: "the same address another house might hand out, and that is fine",
      },
    ],
    ip: "192.168.0.31",
    x: 0.5,
    y: 0.9,
  },
  {
    id: "resolver",
    name: "Resolver",
    role: "answers what an address is",
    reads: "all seven",
    about:
      "A public DNS resolver. It answers one question: what address is behind this name. It is the only machine here that the laptop talks to which is not the site it wants.",
    ifaces: [{ name: "anycast", ip: "1.1.1.1" }],
    ip: "1.1.1.1",
    x: 0.92,
    y: 0.11,
  },
  {
    id: "server",
    name: "Server",
    role: "example.com",
    reads: "all seven",
    about:
      "The far end of the socket. It has never heard of the laptop. Everything it knows about this connection is 203.0.113.7 and a port number the router invented.",
    ifaces: [{ name: "eth0", ip: "93.184.216.34" }],
    ip: "93.184.216.34",
    x: 0.92,
    y: 0.66,
  },
];

export type LinkId =
  | "lan"
  | "lan-phone"
  | "lan-printer"
  | "trunk"
  | "wan"
  | "core-dns"
  | "core-web"
  | "street"
  | "their-lan";

export type Link = {
  id: LinkId;
  from: NodeId;
  to: NodeId;
  /** what this cable is, since the frame's MACs only mean anything on it */
  medium: string;
  /** largest frame payload this link will carry */
  mtu: number;
  /** true for the cables this page's request never touches */
  idle?: boolean;
};

export const LINKS: Link[] = [
  {
    id: "lan",
    from: "laptop",
    to: "switch",
    medium: "Ethernet, your desk · port 1",
    mtu: 1500,
  },
  {
    id: "lan-phone",
    from: "phone",
    to: "switch",
    medium: "Wi-Fi, bridged to port 2",
    mtu: 1500,
    idle: true,
  },
  {
    id: "lan-printer",
    from: "printer",
    to: "switch",
    medium: "Ethernet, the shelf · port 3",
    mtu: 1500,
    idle: true,
  },
  {
    id: "trunk",
    from: "switch",
    to: "router",
    medium: "Ethernet, the hallway · port 4",
    mtu: 1500,
  },
  {
    id: "wan",
    from: "router",
    to: "isp",
    medium: "the line to the street",
    mtu: 1492,
  },
  {
    id: "street",
    from: "isp",
    to: "neighbour-router",
    medium: "the line to the house next door",
    mtu: 1492,
  },
  {
    id: "their-lan",
    from: "neighbour-router",
    to: "neighbour",
    medium: "their Wi-Fi",
    mtu: 1500,
  },
  {
    id: "core-dns",
    from: "isp",
    to: "resolver",
    medium: "the internet",
    mtu: 1500,
  },
  {
    id: "core-web",
    from: "isp",
    to: "server",
    medium: "the internet",
    mtu: 1500,
  },
];

/* ── bytes ─────────────────────────────────────────────────────────────── */

const u8 = (n: number) => [n & 0xff];
const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n: number) => [
  (n >>> 24) & 0xff,
  (n >>> 16) & 0xff,
  (n >>> 8) & 0xff,
  n & 0xff,
];
const mac = (s: string) => s.split(":").map(h => parseInt(h, 16));
const ip = (s: string) => s.split(".").map(d => parseInt(d, 10));
const ascii = (s: string) => [...s].map(c => c.charCodeAt(0));

/**
 * The internet checksum, RFC 1071: ones-complement sum of 16-bit words, then
 * complemented. The carry has to be folded back in — dropping it is the
 * classic way to produce a checksum that looks right and is not.
 */
const onesComplement = (bytes: number[]) => {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) {
    sum += (bytes[i] << 8) + (bytes[i + 1] ?? 0);
  }
  while (sum >> 16) sum = (sum & 0xffff) + (sum >>> 16);
  return ~sum & 0xffff;
};

export type Field = {
  name: string;
  /** what the value means to a reader, not a re-spelling of the hex */
  value: string;
  bytes: number[];
  /** the sentence worth knowing about this field, if there is one */
  note?: string;
};

export type LayerBlock = {
  /** OSI number, so the stack column and the hex pane agree on one scale */
  osi: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  /** one line: what this header is for */
  summary: string;
  fields: Field[];
  /**
   * True for what the application handed down but the wire never carried —
   * the plaintext inside a TLS record. It is shown, because it is the thing
   * the reader came for, and it is kept out of the hex pane and the byte
   * count, because putting it there would be a lie about what a tap sees.
   */
  offWire?: boolean;
};

export type Frame = {
  blocks: LayerBlock[];
  /** what a reader should notice about THIS copy of the frame */
  changed?: string;
};

export const frameBytes = (frame: Frame): number[] =>
  frame.blocks
    .filter(b => !b.offWire)
    .flatMap(b => b.fields.flatMap(f => f.bytes));

export const frameLength = (frame: Frame) => frameBytes(frame).length;

/* ── headers ───────────────────────────────────────────────────────────── */

const ethernet = (
  dst: { name: string; addr: string },
  src: { name: string; addr: string },
  type: "IPv4" | "ARP",
): LayerBlock => ({
  osi: 2,
  name: "Ethernet II",
  summary: "Addresses this one cable, and nothing beyond it.",
  fields: [
    {
      name: "Destination MAC",
      value: `${dst.addr} · ${dst.name}`,
      bytes: mac(dst.addr),
      note: "The next device on this wire — not the far end of the request.",
    },
    {
      name: "Source MAC",
      value: `${src.addr} · ${src.name}`,
      bytes: mac(src.addr),
    },
    {
      name: "EtherType",
      value: type === "IPv4" ? "0x0800 · IPv4" : "0x0806 · ARP",
      bytes: u16(type === "IPv4" ? 0x0800 : 0x0806),
      note: "What the next header is. Without it the rest is just bytes.",
    },
  ],
});

const BROADCAST = {
  name: "everyone on the segment",
  addr: "ff:ff:ff:ff:ff:ff",
};

/**
 * ARP: the question that has to be answered before an IP packet can be put
 * on a cable at all. The laptop knows the router's address and cannot use
 * it — Ethernet only carries MACs — so it shouts on the whole segment.
 */
const arp = (
  op: 1 | 2,
  senderMac: string,
  senderIp: string,
  targetMac: string,
  targetIp: string,
): LayerBlock => ({
  osi: 3,
  name: op === 1 ? "ARP request" : "ARP reply",
  summary:
    op === 1
      ? "Who holds this address? Asked of everyone, because nobody knows yet."
      : "I do, and here is the MAC to put on the cable.",
  fields: [
    { name: "Hardware type", value: "1 · Ethernet", bytes: u16(1) },
    { name: "Protocol type", value: "0x0800 · IPv4", bytes: u16(0x0800) },
    { name: "Hardware size", value: "6 bytes", bytes: u8(6) },
    { name: "Protocol size", value: "4 bytes", bytes: u8(4) },
    {
      name: "Operation",
      value: op === 1 ? "1 · request" : "2 · reply",
      bytes: u16(op),
    },
    { name: "Sender MAC", value: senderMac, bytes: mac(senderMac) },
    { name: "Sender IP", value: senderIp, bytes: ip(senderIp) },
    {
      name: "Target MAC",
      value: op === 1 ? "00:00:00:00:00:00 · the unknown" : targetMac,
      bytes: mac(op === 1 ? "00:00:00:00:00:00" : targetMac),
      note:
        op === 1
          ? "Empty. This field is the question."
          : "The answer, and the only reason the next packet can leave the laptop.",
    },
    { name: "Target IP", value: targetIp, bytes: ip(targetIp) },
  ],
});

/** IPv4, with the header checksum computed over the finished header. */
const ipv4 = (
  src: string,
  dst: string,
  proto: "TCP" | "UDP",
  payloadLength: number,
  id: number,
  ttl: number,
): LayerBlock => {
  const totalLength = 20 + payloadLength;
  const head = [
    ...u8(0x45),
    ...u8(0x00),
    ...u16(totalLength),
    ...u16(id),
    ...u16(0x4000),
    ...u8(ttl),
    ...u8(proto === "TCP" ? 6 : 17),
    ...u16(0),
    ...ip(src),
    ...ip(dst),
  ];
  const sum = onesComplement(head);

  return {
    osi: 3,
    name: "IPv4",
    summary: "Addresses the far end, across every cable between here and it.",
    fields: [
      {
        name: "Version · IHL",
        value: "4 · 5 words (20 bytes)",
        bytes: u8(0x45),
        note: "Both in one byte: four bits of version, four of header length.",
      },
      { name: "DSCP · ECN", value: "best effort", bytes: u8(0x00) },
      {
        name: "Total length",
        value: `${totalLength} bytes`,
        bytes: u16(totalLength),
        note: "Header and payload. Ethernet does not carry a length, so this is it.",
      },
      { name: "Identification", value: `0x${id.toString(16)}`, bytes: u16(id) },
      {
        name: "Flags · Fragment offset",
        value: "Don't fragment",
        bytes: u16(0x4000),
      },
      {
        name: "TTL",
        value: `${ttl}`,
        bytes: u8(ttl),
        note: "Every router subtracts one. At zero the packet is dropped, which is what stops a routing loop running forever.",
      },
      {
        name: "Protocol",
        value: proto === "TCP" ? "6 · TCP" : "17 · UDP",
        bytes: u8(proto === "TCP" ? 6 : 17),
      },
      {
        name: "Header checksum",
        value: `0x${sum.toString(16).padStart(4, "0")}`,
        bytes: u16(sum),
        note: "Covers this header only. It is recomputed at every hop, because the TTL just changed.",
      },
      { name: "Source address", value: src, bytes: ip(src) },
      { name: "Destination address", value: dst, bytes: ip(dst) },
    ],
  };
};

/**
 * The TCP and UDP checksums cover a PSEUDO-HEADER as well as the segment —
 * addresses out of the IP header that the transport header does not itself
 * carry. It is the one place in the stack where two layers are deliberately
 * not independent, and it is why a NAT has to rewrite the checksum when it
 * rewrites an address.
 */
const pseudoHeader = (
  src: string,
  dst: string,
  proto: 6 | 17,
  length: number,
) => [...ip(src), ...ip(dst), 0, proto, ...u16(length)];

const udp = (
  srcPort: number,
  dstPort: number,
  payload: number[],
  srcIp: string,
  dstIp: string,
): LayerBlock => {
  const length = 8 + payload.length;
  const body = [
    ...u16(srcPort),
    ...u16(dstPort),
    ...u16(length),
    ...u16(0),
    ...payload,
  ];
  const sum = onesComplement([
    ...pseudoHeader(srcIp, dstIp, 17, length),
    ...body,
  ]);

  return {
    osi: 4,
    name: "UDP",
    summary: "Two port numbers and a length. No handshake, no memory.",
    fields: [
      {
        name: "Source port",
        value: `${srcPort}`,
        bytes: u16(srcPort),
        note: "Chosen at random by the sender. It is the only thing that will match the answer to the question.",
      },
      {
        name: "Destination port",
        value: `${dstPort} · DNS`,
        bytes: u16(dstPort),
      },
      { name: "Length", value: `${length} bytes`, bytes: u16(length) },
      {
        name: "Checksum",
        value: `0x${sum.toString(16).padStart(4, "0")}`,
        bytes: u16(sum),
        note: "Covers the data as well as the header, and reaches into IPv4 for the two addresses.",
      },
    ],
  };
};

type TcpFlags = { syn?: boolean; ack?: boolean; psh?: boolean; fin?: boolean };

const flagWord = (f: TcpFlags) =>
  (f.fin ? 0x01 : 0) |
  (f.syn ? 0x02 : 0) |
  (f.psh ? 0x08 : 0) |
  (f.ack ? 0x10 : 0);

const flagNames = (f: TcpFlags) =>
  [f.syn && "SYN", f.ack && "ACK", f.psh && "PSH", f.fin && "FIN"]
    .filter(Boolean)
    .join(" · ") || "—";

const tcp = (
  srcPort: number,
  dstPort: number,
  seq: number,
  ack: number,
  flags: TcpFlags,
  window: number,
  payload: number[],
  srcIp: string,
  dstIp: string,
  opts: { mss?: number } = {},
): LayerBlock => {
  const options = opts.mss
    ? [0x02, 0x04, ...u16(opts.mss), 0x01, 0x01, 0x04, 0x02]
    : [];
  const offsetWords = (20 + options.length) / 4;
  const body = [
    ...u16(srcPort),
    ...u16(dstPort),
    ...u32(seq),
    ...u32(ack),
    ...u8(offsetWords << 4),
    ...u8(flagWord(flags)),
    ...u16(window),
    ...u16(0),
    ...u16(0),
    ...options,
    ...payload,
  ];
  const sum = onesComplement([
    ...pseudoHeader(srcIp, dstIp, 6, body.length),
    ...body,
  ]);

  const fields: Field[] = [
    {
      name: "Source port",
      value: `${srcPort}`,
      bytes: u16(srcPort),
      note: "The port the NAT will rewrite, and the only way the router remembers which laptop asked.",
    },
    {
      name: "Destination port",
      value: `${dstPort}${dstPort === 443 ? " · HTTPS" : ""}`,
      bytes: u16(dstPort),
    },
    {
      name: "Sequence number",
      value: `${seq}`,
      bytes: u32(seq),
      note: "Counts bytes, not packets. This is how the far end puts a broken-up stream back in order.",
    },
    {
      name: "Acknowledgement",
      value: flags.ack ? `${ack}` : "—",
      bytes: u32(ack),
    },
    {
      name: "Data offset",
      value: `${offsetWords} words (${offsetWords * 4} bytes)`,
      bytes: u8(offsetWords << 4),
    },
    {
      name: "Flags",
      value: flagNames(flags),
      bytes: u8(flagWord(flags)),
      note: "Six bits carry the whole state machine: open, acknowledge, push, close.",
    },
    {
      name: "Window",
      value: `${window} bytes`,
      bytes: u16(window),
      note: "How much the sender is willing to receive before hearing back. Flow control is one number.",
    },
    {
      name: "Checksum",
      value: `0x${sum.toString(16).padStart(4, "0")}`,
      bytes: u16(sum),
    },
    { name: "Urgent pointer", value: "—", bytes: u16(0) },
  ];

  if (options.length) {
    fields.push({
      name: "Options",
      value: `MSS ${opts.mss}, SACK permitted`,
      bytes: options,
      note: "Carried on the handshake only: the largest segment this side will accept.",
    });
  }

  return {
    osi: 4,
    name: "TCP",
    summary:
      "Turns a stream of separate packets into one ordered, acknowledged stream.",
    fields,
  };
};

/* ── what the application put inside ───────────────────────────────────── */

/** A DNS name on the wire is length-prefixed labels, not dots. */
const qname = (host: string) => [
  ...host.split(".").flatMap(label => [label.length, ...ascii(label)]),
  0,
];

const dnsQuery = (id: number, host: string): LayerBlock => ({
  osi: 7,
  name: "DNS query",
  summary: "What address is behind this name?",
  fields: [
    {
      name: "Transaction ID",
      value: `0x${id.toString(16)}`,
      bytes: u16(id),
      note: "UDP has no connection, so this number is the only thing linking an answer to its question.",
    },
    {
      name: "Flags",
      value: "standard query, recursion desired",
      bytes: u16(0x0100),
    },
    { name: "Questions", value: "1", bytes: u16(1) },
    { name: "Answer RRs", value: "0", bytes: u16(0) },
    { name: "Authority RRs", value: "0", bytes: u16(0) },
    { name: "Additional RRs", value: "0", bytes: u16(0) },
    {
      name: "Name",
      value: host,
      bytes: qname(host),
      note: "Each label carries its own length byte. The dots you type are never sent.",
    },
    { name: "Type", value: "A (1) · an IPv4 address", bytes: u16(1) },
    { name: "Class", value: "IN (1) · the internet", bytes: u16(1) },
  ],
});

const dnsAnswer = (id: number, host: string, addr: string): LayerBlock => ({
  osi: 7,
  name: "DNS response",
  summary: "The name, and the address behind it.",
  fields: [
    { name: "Transaction ID", value: `0x${id.toString(16)}`, bytes: u16(id) },
    {
      name: "Flags",
      value: "response, recursion available, no error",
      bytes: u16(0x8180),
    },
    { name: "Questions", value: "1", bytes: u16(1) },
    { name: "Answer RRs", value: "1", bytes: u16(1) },
    { name: "Authority RRs", value: "0", bytes: u16(0) },
    { name: "Additional RRs", value: "0", bytes: u16(0) },
    { name: "Name", value: host, bytes: qname(host) },
    { name: "Type", value: "A (1)", bytes: u16(1) },
    { name: "Class", value: "IN (1)", bytes: u16(1) },
    {
      name: "Answer: name",
      value: "pointer to the question's name",
      bytes: u16(0xc00c),
      note: "A pointer back to the name instead of repeating it. DNS was designed when every byte cost something.",
    },
    {
      name: "Answer: type · class",
      value: "A · IN",
      bytes: [...u16(1), ...u16(1)],
    },
    {
      name: "TTL",
      value: "300 seconds",
      bytes: u32(300),
      note: "How long everyone downstream may remember this answer.",
    },
    { name: "Data length", value: "4 bytes", bytes: u16(4) },
    { name: "Address", value: addr, bytes: ip(addr) },
  ],
});

const tlsClientHello = (host: string): LayerBlock => {
  /* A real ClientHello is long and mostly lists; what is worth seeing is the
     record header, the version, and the one extension that is sent in the
     clear and decides which certificate comes back. */
  const sni = [
    ...u8(0x00),
    ...u8(0x00),
    ...u16(host.length + 5),
    ...u16(host.length + 3),
    ...u8(0x00),
    ...u16(host.length),
    ...ascii(host),
  ];
  return {
    osi: 5,
    name: "TLS ClientHello",
    summary: "Proposes versions and ciphers, and names the host in the clear.",
    fields: [
      {
        name: "Record type",
        value: "22 · handshake",
        bytes: u8(22),
        note: "TLS frames its own messages inside the stream TCP delivers.",
      },
      {
        name: "Record version",
        value: "TLS 1.0 (compatibility)",
        bytes: u16(0x0301),
      },
      {
        name: "Record length",
        value: `${217 + sni.length} bytes`,
        bytes: u16(217 + sni.length),
      },
      { name: "Handshake type", value: "1 · ClientHello", bytes: u8(1) },
      {
        name: "Client random",
        value: "32 bytes of entropy",
        bytes: Array.from({ length: 8 }, (_, i) => (i * 37 + 11) & 0xff),
      },
      {
        name: "Cipher suites",
        value: "TLS_AES_128_GCM_SHA256, +4 more",
        bytes: [...u16(0x1301), ...u16(0x1302), ...u16(0xc02f)],
      },
      {
        name: "Extension: server_name",
        value: host,
        bytes: sni,
        note: "Sent before any key exchange, so anyone on the path can read it. It is how one address can serve a thousand sites, and how a network can tell which site you asked for.",
      },
      {
        name: "Extension: supported_versions",
        value: "TLS 1.3",
        bytes: [...u16(0x002b), ...u16(0x0003), ...u8(0x02), ...u16(0x0304)],
      },
    ],
  };
};

const httpGet = (host: string, path: string): LayerBlock => {
  const text =
    `GET ${path} HTTP/1.1\r\n` +
    `Host: ${host}\r\n` +
    `User-Agent: curl/8.7.1\r\n` +
    `Accept: */*\r\n\r\n`;
  return {
    osi: 7,
    offWire: true,
    name: "HTTP request",
    summary: "Text. The oldest and plainest thing in the stack.",
    fields: [
      {
        name: "Request line",
        value: `GET ${path} HTTP/1.1`,
        bytes: ascii(text.split("\r\n")[0] + "\r\n"),
        note: "A verb, a path and a version — the whole protocol in one line.",
      },
      {
        name: "Host",
        value: host,
        bytes: ascii(`Host: ${host}\r\n`),
        note: "The same name as the TLS extension, repeated inside the encryption. One address, many sites.",
      },
      {
        name: "User-Agent",
        value: "curl/8.7.1",
        bytes: ascii("User-Agent: curl/8.7.1\r\n"),
      },
      { name: "Accept", value: "*/*", bytes: ascii("Accept: */*\r\n") },
      {
        name: "End of headers",
        value: "a blank line",
        bytes: ascii("\r\n"),
        note: "Two line endings in a row. That is the entire framing.",
      },
    ],
  };
};

const httpResponse = (): LayerBlock => ({
  osi: 7,
  offWire: true,
  name: "HTTP response",
  summary: "A status line, headers, and the page.",
  fields: [
    {
      name: "Status line",
      value: "HTTP/1.1 200 OK",
      bytes: ascii("HTTP/1.1 200 OK\r\n"),
    },
    {
      name: "Content-Type",
      value: "text/html; charset=UTF-8",
      bytes: ascii("Content-Type: text/html; charset=UTF-8\r\n"),
    },
    {
      name: "Content-Length",
      value: "1256 bytes",
      bytes: ascii("Content-Length: 1256\r\n"),
    },
    { name: "End of headers", value: "a blank line", bytes: ascii("\r\n") },
    {
      name: "Body",
      value: "<!doctype html>…",
      bytes: ascii("<!doctype html>\n<html>\n"),
    },
  ],
});

/**
 * Once the handshake is done, everything above TCP is ciphertext on the wire.
 * The page shows both: what the application wrote, and what a tap would see.
 */
const tlsApplicationData = (bytes: number, seed: number): LayerBlock => ({
  osi: 6,
  name: "TLS application data",
  summary: "The record that carries encrypted bytes. This is all a tap sees.",
  fields: [
    { name: "Record type", value: "23 · application data", bytes: u8(23) },
    {
      name: "Record version",
      value: "TLS 1.2 (compatibility)",
      bytes: u16(0x0303),
    },
    { name: "Record length", value: `${bytes} bytes`, bytes: u16(bytes) },
    {
      name: "Ciphertext",
      value: `${bytes} bytes, unreadable without the key`,
      bytes: Array.from({ length: 16 }, (_, i) => (i * seed + 97) & 0xff),
      note: "The HTTP request is inside here. The addresses and ports outside it are not encrypted, and never can be, because the routers need them.",
    },
  ],
});

/* ── the scenario ──────────────────────────────────────────────────────── */

const LAPTOP = { name: "Laptop", addr: "a4:83:e7:1c:9d:40" };
const ROUTER_LAN = { name: "Router, LAN side", addr: "f0:9f:c2:11:aa:01" };
const ROUTER_WAN = { name: "Router, WAN side", addr: "f0:9f:c2:11:aa:02" };
const ISP_EDGE = { name: "ISP edge", addr: "00:1b:21:3c:77:02" };
const FAR = { name: "the far end's last hop", addr: "02:42:0a:00:00:01" };

const LAN_IP = "192.168.1.42";
const WAN_IP = "203.0.113.7";
const RESOLVER_IP = "1.1.1.1";
const SERVER_IP = "93.184.216.34";
const HOST = "example.com";

/** the laptop's port, and the one the NAT swaps it for */
const CLIENT_PORT = 54_312;
const NAT_PORT = 61_001;
const DNS_PORT = 49_876;
const DNS_NAT_PORT = 60_014;

export type Hop = {
  link: LinkId;
  from: NodeId;
  to: NodeId;
  frame: Frame;
};

export type Step = {
  id: string;
  label: string;
  phase: "name" | "connect" | "secure" | "fetch";
  /** what this step is for, in the reader's terms */
  summary: string;
  hops: Hop[];
};

const dnsPayload = (block: LayerBlock) => block.fields.flatMap(f => f.bytes);

/** The DNS query, which is the same message in three different frames. */
const dnsOut = (): Step => {
  const app = dnsQuery(0x3f21, HOST);
  const payload = dnsPayload(app);

  const insideFrame = (
    dst: typeof ROUTER_LAN,
    src: typeof LAPTOP,
    ttl: number,
    changed?: string,
  ): Frame => ({
    changed,
    blocks: [
      ethernet(dst, src, "IPv4"),
      ipv4(LAN_IP, RESOLVER_IP, "UDP", 8 + payload.length, 0x1c3a, ttl),
      udp(DNS_PORT, 53, payload, LAN_IP, RESOLVER_IP),
      app,
    ],
  });

  return {
    id: "dns-query",
    label: "DNS query",
    phase: "name",
    summary:
      "Nothing can be sent to example.com until it is a number. The laptop asks the resolver over UDP, because one question and one answer do not need a connection.",
    hops: [
      {
        link: "lan",
        from: "laptop",
        to: "switch",
        frame: insideFrame(ROUTER_LAN, LAPTOP, 64),
      },
      {
        link: "trunk",
        from: "switch",
        to: "router",
        frame: insideFrame(
          ROUTER_LAN,
          LAPTOP,
          64,
          "Nothing. A switch reads the destination MAC and forwards the frame as it stands — it never looks at an IP address, which is why it cannot change one.",
        ),
      },
      {
        link: "wan",
        from: "router",
        to: "isp",
        frame: {
          changed:
            "Everything that is an address. New MAC addresses, because the old pair only meant something on the hallway cable. A new source address and port, because 192.168.1.42 means nothing outside the house.",
          blocks: [
            ethernet(ISP_EDGE, ROUTER_WAN, "IPv4"),
            ipv4(WAN_IP, RESOLVER_IP, "UDP", 8 + payload.length, 0x1c3a, 63),
            udp(DNS_NAT_PORT, 53, payload, WAN_IP, RESOLVER_IP),
            app,
          ],
        },
      },
      {
        link: "core-dns",
        from: "isp",
        to: "resolver",
        frame: {
          changed:
            "New MAC addresses again, and one more off the TTL. The question itself has not changed since it left the laptop.",
          blocks: [
            ethernet(FAR, ISP_EDGE, "IPv4"),
            ipv4(WAN_IP, RESOLVER_IP, "UDP", 8 + payload.length, 0x1c3a, 62),
            udp(DNS_NAT_PORT, 53, payload, WAN_IP, RESOLVER_IP),
            app,
          ],
        },
      },
    ],
  };
};

const dnsBack = (): Step => {
  const app = dnsAnswer(0x3f21, HOST, SERVER_IP);
  const payload = dnsPayload(app);
  const frame = (
    dst: typeof LAPTOP,
    src: typeof LAPTOP,
    dstIp: string,
    dstPort: number,
    ttl: number,
    changed?: string,
  ): Frame => ({
    changed,
    blocks: [
      ethernet(dst, src, "IPv4"),
      ipv4(RESOLVER_IP, dstIp, "UDP", 8 + payload.length, 0x77b2, ttl),
      udp(53, dstPort, payload, RESOLVER_IP, dstIp),
      app,
    ],
  });

  return {
    id: "dns-answer",
    label: "DNS answer",
    phase: "name",
    summary:
      "93.184.216.34, and permission to remember it for five minutes. On the way back in, the NAT undoes its own swap. The port it invented is the only thing that says which machine in the house asked.",
    hops: [
      {
        link: "core-dns",
        from: "resolver",
        to: "isp",
        frame: frame(ISP_EDGE, FAR, WAN_IP, DNS_NAT_PORT, 57),
      },
      {
        link: "wan",
        from: "isp",
        to: "router",
        frame: frame(ROUTER_WAN, ISP_EDGE, WAN_IP, DNS_NAT_PORT, 56),
      },
      {
        link: "trunk",
        from: "router",
        to: "switch",
        frame: frame(
          LAPTOP,
          ROUTER_LAN,
          LAN_IP,
          DNS_PORT,
          55,
          "The NAT undone: destination address and port are the laptop's own again, looked up in the table the outbound packet created.",
        ),
      },
      {
        link: "lan",
        from: "switch",
        to: "laptop",
        frame: frame(LAPTOP, ROUTER_LAN, LAN_IP, DNS_PORT, 55),
      },
    ],
  };
};

/** One TCP control segment, which carries no data but changes state. */
const control = (
  id: string,
  label: string,
  summary: string,
  dir: "out" | "in",
  flags: TcpFlags,
  seq: number,
  ackNum: number,
  phase: Step["phase"],
): Step => {
  const outbound = dir === "out";
  const insideTcp = (
    srcIp: string,
    dstIp: string,
    srcPort: number,
    dstPort: number,
  ) =>
    tcp(
      srcPort,
      dstPort,
      seq,
      ackNum,
      flags,
      outbound ? 64_240 : 65_535,
      [],
      srcIp,
      dstIp,
      flags.syn ? { mss: 1460 } : {},
    );

  const inside = (ttl: number, changed?: string): Frame => ({
    changed,
    blocks: outbound
      ? [
          ethernet(ROUTER_LAN, LAPTOP, "IPv4"),
          ipv4(LAN_IP, SERVER_IP, "TCP", 20 + (flags.syn ? 8 : 0), 0x2b10, ttl),
          insideTcp(LAN_IP, SERVER_IP, CLIENT_PORT, 443),
        ]
      : [
          ethernet(LAPTOP, ROUTER_LAN, "IPv4"),
          ipv4(SERVER_IP, LAN_IP, "TCP", 20 + (flags.syn ? 8 : 0), 0x9c04, ttl),
          insideTcp(SERVER_IP, LAN_IP, 443, CLIENT_PORT),
        ],
  });

  const outside = (ttl: number, changed?: string): Frame => ({
    changed,
    blocks: outbound
      ? [
          ethernet(ISP_EDGE, ROUTER_WAN, "IPv4"),
          ipv4(WAN_IP, SERVER_IP, "TCP", 20 + (flags.syn ? 8 : 0), 0x2b10, ttl),
          insideTcp(WAN_IP, SERVER_IP, NAT_PORT, 443),
        ]
      : [
          ethernet(ROUTER_WAN, ISP_EDGE, "IPv4"),
          ipv4(SERVER_IP, WAN_IP, "TCP", 20 + (flags.syn ? 8 : 0), 0x9c04, ttl),
          insideTcp(SERVER_IP, WAN_IP, 443, NAT_PORT),
        ],
  });

  const hops: Hop[] = outbound
    ? [
        { link: "lan", from: "laptop", to: "switch", frame: inside(64) },
        { link: "trunk", from: "switch", to: "router", frame: inside(64) },
        {
          link: "wan",
          from: "router",
          to: "isp",
          frame: outside(
            63,
            "Source rewritten to the router's own address and a port it picked. Everything the server ever learns about this connection is that pair.",
          ),
        },
        { link: "core-web", from: "isp", to: "server", frame: outside(62) },
      ]
    : [
        { link: "core-web", from: "server", to: "isp", frame: outside(56) },
        { link: "wan", from: "isp", to: "router", frame: outside(55) },
        {
          link: "trunk",
          from: "router",
          to: "switch",
          frame: inside(
            54,
            "The rewrite reversed. The server addressed 203.0.113.7:61001; the laptop sees its own address and its own port.",
          ),
        },
        { link: "lan", from: "switch", to: "laptop", frame: inside(54) },
      ];

  return { id, label, phase, summary, hops };
};

const clientHello = (): Step => {
  const app = tlsClientHello(HOST);
  const payload = app.fields.flatMap(f => f.bytes);
  const build = (
    srcIp: string,
    dstIp: string,
    srcPort: number,
    dst: typeof ROUTER_LAN,
    src: typeof LAPTOP,
    ttl: number,
    changed?: string,
  ): Frame => ({
    changed,
    blocks: [
      ethernet(dst, src, "IPv4"),
      ipv4(srcIp, dstIp, "TCP", 20 + payload.length, 0x2b14, ttl),
      tcp(
        srcPort,
        443,
        1,
        1,
        { ack: true, psh: true },
        64_240,
        payload,
        srcIp,
        dstIp,
      ),
      app,
    ],
  });

  return {
    id: "client-hello",
    label: "TLS ClientHello",
    phase: "secure",
    summary:
      "The connection exists, but nothing is private yet. This message proposes ciphers and names the host, in the clear, because the server needs to know which certificate to send before it can encrypt anything.",
    hops: [
      {
        link: "lan",
        from: "laptop",
        to: "switch",
        frame: build(LAN_IP, SERVER_IP, CLIENT_PORT, ROUTER_LAN, LAPTOP, 64),
      },
      {
        link: "trunk",
        from: "switch",
        to: "router",
        frame: build(LAN_IP, SERVER_IP, CLIENT_PORT, ROUTER_LAN, LAPTOP, 64),
      },
      {
        link: "wan",
        from: "router",
        to: "isp",
        frame: build(
          WAN_IP,
          SERVER_IP,
          NAT_PORT,
          ISP_EDGE,
          ROUTER_WAN,
          63,
          "The NAT again — and note that the hostname inside is untouched and readable the whole way.",
        ),
      },
      {
        link: "core-web",
        from: "isp",
        to: "server",
        frame: build(WAN_IP, SERVER_IP, NAT_PORT, FAR, ISP_EDGE, 62),
      },
    ],
  };
};

const encrypted = (
  id: string,
  label: string,
  summary: string,
  dir: "out" | "in",
  plaintext: LayerBlock,
  phase: Step["phase"],
  seed: number,
): Step => {
  const record = tlsApplicationData(
    plaintext.fields.reduce((n, f) => n + f.bytes.length, 0) + 24,
    seed,
  );
  const payload = record.fields.flatMap(f => f.bytes);
  const outbound = dir === "out";

  const build = (
    srcIp: string,
    dstIp: string,
    srcPort: number,
    dstPort: number,
    dst: typeof ROUTER_LAN,
    src: typeof LAPTOP,
    ttl: number,
    changed?: string,
  ): Frame => ({
    changed,
    blocks: [
      ethernet(dst, src, "IPv4"),
      ipv4(srcIp, dstIp, "TCP", 20 + payload.length, 0x2b20, ttl),
      tcp(
        srcPort,
        dstPort,
        2,
        2,
        { ack: true, psh: true },
        64_240,
        payload,
        srcIp,
        dstIp,
      ),
      record,
      plaintext,
    ],
  });

  const hops: Hop[] = outbound
    ? [
        {
          link: "lan",
          from: "laptop",
          to: "switch",
          frame: build(
            LAN_IP,
            SERVER_IP,
            CLIENT_PORT,
            443,
            ROUTER_LAN,
            LAPTOP,
            64,
          ),
        },
        {
          link: "trunk",
          from: "switch",
          to: "router",
          frame: build(
            LAN_IP,
            SERVER_IP,
            CLIENT_PORT,
            443,
            ROUTER_LAN,
            LAPTOP,
            64,
          ),
        },
        {
          link: "wan",
          from: "router",
          to: "isp",
          frame: build(
            WAN_IP,
            SERVER_IP,
            NAT_PORT,
            443,
            ISP_EDGE,
            ROUTER_WAN,
            63,
            "Addresses and ports rewritten as before. The record inside is unreadable to the router, which is the point — it routes what it cannot read.",
          ),
        },
        {
          link: "core-web",
          from: "isp",
          to: "server",
          frame: build(WAN_IP, SERVER_IP, NAT_PORT, 443, FAR, ISP_EDGE, 62),
        },
      ]
    : [
        {
          link: "core-web",
          from: "server",
          to: "isp",
          frame: build(SERVER_IP, WAN_IP, 443, NAT_PORT, ROUTER_WAN, FAR, 56),
        },
        {
          link: "wan",
          from: "isp",
          to: "router",
          frame: build(
            SERVER_IP,
            WAN_IP,
            443,
            NAT_PORT,
            ROUTER_WAN,
            ISP_EDGE,
            55,
          ),
        },
        {
          link: "trunk",
          from: "router",
          to: "switch",
          frame: build(
            SERVER_IP,
            LAN_IP,
            443,
            CLIENT_PORT,
            LAPTOP,
            ROUTER_LAN,
            54,
            "Back inside the house, addressed to the laptop again.",
          ),
        },
        {
          link: "lan",
          from: "switch",
          to: "laptop",
          frame: build(
            SERVER_IP,
            LAN_IP,
            443,
            CLIENT_PORT,
            LAPTOP,
            ROUTER_LAN,
            54,
          ),
        },
      ];

  return { id, label, phase, summary, hops };
};

/** Before anything can be addressed on the cable, one question. */
const arpOut = (): Step => {
  const frame = (changed?: string): Frame => ({
    changed,
    blocks: [
      ethernet(BROADCAST, LAPTOP, "ARP"),
      arp(1, LAPTOP.addr, LAN_IP, ROUTER_LAN.addr, "192.168.1.1"),
    ],
  });
  return {
    id: "arp-request",
    label: "ARP · who has the router?",
    phase: "name",
    summary:
      "Nothing has left the house yet. The laptop knows the router's IP address, but it cannot put an IP address on a cable — Ethernet carries MAC addresses. So it shouts the question at the whole segment and waits.",
    hops: [
      { link: "lan", from: "laptop", to: "switch", frame: frame() },
      {
        link: "trunk",
        from: "switch",
        to: "router",
        frame: frame(
          "Nothing, and that is the point: the destination is the broadcast address, so the switch sends it out of every port it has rather than looking anything up.",
        ),
      },
    ],
  };
};

const arpBack = (): Step => {
  const frame = (changed?: string): Frame => ({
    changed,
    blocks: [
      ethernet(LAPTOP, ROUTER_LAN, "ARP"),
      arp(2, ROUTER_LAN.addr, "192.168.1.1", LAPTOP.addr, LAN_IP),
    ],
  });
  return {
    id: "arp-reply",
    label: "ARP · it is at f0:9f…",
    phase: "name",
    summary:
      "One machine recognises its own address and answers directly. The laptop writes the pair into its ARP table, and every frame on this page from here on uses it.",
    hops: [
      { link: "trunk", from: "router", to: "switch", frame: frame() },
      {
        link: "lan",
        from: "switch",
        to: "laptop",
        frame: frame(
          "Still nothing — but the switch has now seen both machines speak, so it knows which port each MAC is on and will never flood for them again.",
        ),
      },
    ],
  };
};

export const STEPS: Step[] = [
  arpOut(),
  arpBack(),
  dnsOut(),
  dnsBack(),
  control(
    "syn",
    "SYN",
    "The first of three. No data yet — this segment exists to agree where the stream's numbering starts, and to find out whether anyone is listening on 443.",
    "out",
    { syn: true },
    0,
    0,
    "connect",
  ),
  control(
    "syn-ack",
    "SYN · ACK",
    "Yes, and here is my own starting number. One packet does both halves, which is why the handshake is three and not four.",
    "in",
    { syn: true, ack: true },
    0,
    1,
    "connect",
  ),
  control(
    "ack",
    "ACK",
    "Agreed. The connection is open, both sides are counting, and nothing has been said yet.",
    "out",
    { ack: true },
    1,
    1,
    "connect",
  ),
  clientHello(),
  encrypted(
    "request",
    "GET /",
    "The request the browser actually makes. On the wire it is a TLS record full of ciphertext — the addresses and ports outside it stay readable, because the routers cannot deliver what they cannot read.",
    "out",
    httpGet(HOST, "/"),
    "fetch",
    13,
  ),
  encrypted(
    "response",
    "200 OK",
    "The page, in the same shape reversed. Everything above TCP is encrypted; everything TCP and below is the same plumbing as the very first DNS query.",
    "in",
    httpResponse(),
    "fetch",
    29,
  ),
];

/* ── time ──────────────────────────────────────────────────────────────
   The page runs a clock, not a slideshow, so every cable needs a length and
   every device needs a moment to think. These are the numbers that give the
   picture its rhythm — and the rhythm IS the lesson: two hops inside the
   house cost less than a tenth of a millisecond, and the single hop to the
   server costs two hundred times that. Nearly all of a page load is the
   speed of light and the queue at the far end; almost none of it is the
   machinery this page draws. */

/** one-way time on each cable, in milliseconds */
export const LINK_MS: Record<LinkId, number> = {
  lan: 0.08,
  street: 4.4,
  "their-lan": 0.5,
  "lan-phone": 0.4,
  "lan-printer": 0.08,
  trunk: 0.08,
  wan: 4,
  "core-dns": 11,
  "core-web": 19,
};

/**
 * How long a device holds a frame before passing it on. A switch forwards
 * almost as fast as it reads; a router has to open the IP header, rewrite
 * the addresses, fix two checksums and consult a table; a server has to do
 * actual work.
 */
export const THINK_MS: Record<NodeId, number> = {
  laptop: 0.15,
  neighbour: 0.15,
  "neighbour-router": 0.35,
  phone: 0.2,
  printer: 0.1,
  switch: 0.02,
  router: 0.35,
  isp: 0.2,
  resolver: 1.4,
  server: 2.2,
};

/** The hops, flattened — the page's timeline is one list of these. */
export type Tick = {
  step: Step;
  stepIndex: number;
  hop: Hop;
  hopIndex: number;
};

export const TICKS: Tick[] = STEPS.flatMap((step, stepIndex) =>
  step.hops.map((hop, hopIndex) => ({ step, stepIndex, hop, hopIndex })),
);

export const PHASES: { id: Step["phase"]; name: string; blurb: string }[] = [
  { id: "name", name: "Name", blurb: "turning a name into an address" },
  {
    id: "connect",
    name: "Connect",
    blurb: "three packets, and a stream exists",
  },
  { id: "secure", name: "Secure", blurb: "agreeing on a key in the open" },
  { id: "fetch", name: "Fetch", blurb: "the request, and the page" },
];

/** The OSI column, top to bottom, with what each layer is for. */
export const OSI = [
  { n: 7, name: "Application", blurb: "HTTP, DNS — what the program means" },
  { n: 6, name: "Presentation", blurb: "TLS — how it is encoded and sealed" },
  { n: 5, name: "Session", blurb: "the handshake that sets up the seal" },
  { n: 4, name: "Transport", blurb: "TCP, UDP — ports, order, delivery" },
  { n: 3, name: "Network", blurb: "IP — the address at the far end" },
  { n: 2, name: "Data link", blurb: "Ethernet — the address on this cable" },
  { n: 1, name: "Physical", blurb: "the bits, and the thing carrying them" },
] as const;
