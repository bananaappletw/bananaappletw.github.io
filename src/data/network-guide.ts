/**
 * /network Part I — one request, built in front of the reader.
 *
 * The same shape as the Terraform and Ansible guides, for the same reason:
 * a page that opens on a running simulation teaches the machinery to
 * someone who already knows it. So this one starts with a name typed into
 * a browser bar and nothing else, and adds one layer at a time until the
 * rail holds a whole frame.
 *
 * ── the rail is not a mock-up ────────────────────────────────────────────
 *
 * The growing pane on the left is THE SIMULATION'S OWN FRAME: the outbound
 * `GET /` as it leaves the laptop, taken straight out of `network-flow.ts`
 * and laid out field by field. Each field is tagged with the step that
 * earns it, so by step 10 the reader has watched the exact bytes Part II
 * then sends across eight devices. `tests/network-guide.test.ts` asserts
 * that — every field of the real frame appears once, in wire order, and
 * the byte count of the finished rail equals the frame's own length.
 *
 * Nothing here is invented hex. If the rail and the simulation ever
 * disagree, the tests fail rather than the reader being misled.
 *
 * ── wire order, not stack order ──────────────────────────────────────────
 *
 * A stack encapsulates inside-out: HTTP exists first, and each layer below
 * wraps it. The wire carries the result outside-in, and so does a capture,
 * and so does this rail — Ethernet at the top, the request at the bottom.
 * That is also the order in which the questions arise ("which cable?",
 * "which machine?", "which program?", "which conversation?"), which is why
 * the fourteen steps read down the frame rather than up it.
 */

import { STEPS as FLOW_STEPS, frameLength, type Frame } from "./network-flow";

/* ── the frame the rail builds ─────────────────────────────────────────── */

const requestStep = FLOW_STEPS.find(step => step.id === "request");
if (!requestStep) throw new Error("network-flow has no `request` step");

/** the outbound GET, as it leaves the laptop on the first cable */
export const REQUEST: Frame = requestStep.hops[0].frame;

export const LAST_STEP = 14;

/**
 * Which step earns each field, keyed `<layer> · <field>`.
 *
 * The split inside a layer is deliberate. A reader meets the two TCP ports
 * when the question is "which program gets this?", and the sequence and
 * window numbers only once there is a stream to count — so TCP arrives in
 * two instalments rather than as a ten-field wall nobody reads.
 */
const FIELD_STEP: Record<string, number> = {
  /* step 3 · there are two addresses, and this is the near one */
  "Ethernet II · Destination MAC": 3,
  "Ethernet II · Source MAC": 3,
  "Ethernet II · EtherType": 3,

  /* step 5 · the name has become an address, so the far one can be written */
  "IPv4 · Version · IHL": 5,
  "IPv4 · Source address": 5,
  "IPv4 · Destination address": 5,
  "IPv4 · Protocol": 5,

  /* step 6 · the fields that exist because there are hops in between */
  "IPv4 · DSCP · ECN": 6,
  "IPv4 · Total length": 6,
  "IPv4 · Identification": 6,
  "IPv4 · Flags · Fragment offset": 6,
  "IPv4 · TTL": 6,
  "IPv4 · Header checksum": 6,

  /* step 7 · which program */
  "TCP · Source port": 7,
  "TCP · Destination port": 7,

  /* step 8 · which conversation, and how much of it has arrived */
  "TCP · Sequence number": 8,
  "TCP · Acknowledgement": 8,
  "TCP · Data offset": 8,
  "TCP · Flags": 8,
  "TCP · Window": 8,
  "TCP · Checksum": 8,
  "TCP · Urgent pointer": 8,
  /* a GET carries no TCP options; the SYN that opened the stream did, and
     step 8 shows that one in an inset rather than pretending otherwise */

  /* step 9 · the seal */
  "TLS application data · Record type": 9,
  "TLS application data · Record version": 9,
  "TLS application data · Record length": 9,
  "TLS application data · Ciphertext": 9,

  /* step 10 · the thing the reader came for */
  "HTTP request · Request line": 10,
  "HTTP request · Host": 10,
  "HTTP request · User-Agent": 10,
  "HTTP request · Accept": 10,
  "HTTP request · End of headers": 10,
};

export type RailLine = {
  step: number;
  kind: "layer" | "field";
  /** the name in the left column */
  text: string;
  /** the meaning in the right column, for a field */
  value?: string;
  /** how many bytes it puts on the wire; zero for a layer heading */
  bytes: number;
  /** OSI number, for a layer heading */
  osi?: number;
  /** what this header is for, for a layer heading */
  summary?: string;
  /** the sentence worth knowing, where the frame carries one */
  note?: string;
  /** true for the plaintext the wire never carried */
  offWire?: boolean;
};

/**
 * The rail: the request frame, flattened to lines, each tagged with the step
 * at which it arrives. A layer heading arrives with the first of its fields,
 * because a heading over nothing is a promise rather than a fact.
 */
export const RAIL: RailLine[] = REQUEST.blocks.flatMap(block => {
  const fields = block.fields.map(field => {
    const key = `${block.name} · ${field.name}`;
    const step = FIELD_STEP[key];
    if (step === undefined) throw new Error(`no step for rail field: ${key}`);
    return {
      step,
      kind: "field" as const,
      text: field.name,
      value: field.value,
      bytes: block.offWire ? 0 : field.bytes.length,
      note: field.note,
      offWire: block.offWire,
    };
  });
  const head: RailLine = {
    step: Math.min(...fields.map(field => field.step)),
    kind: "layer",
    text: block.name,
    bytes: 0,
    osi: block.osi,
    summary: block.summary,
    offWire: block.offWire,
  };
  return [head, ...fields];
});

/** the rail as it stands at the end of a given step */
export const railAt = (step: number): (RailLine & { fresh: boolean })[] =>
  RAIL.filter(line => line.step <= step).map(line => ({
    ...line,
    fresh: line.step === step,
  }));

/** how many bytes of real wire the rail accounts for at a given step */
export const bytesAt = (step: number) =>
  railAt(step).reduce((n, line) => n + line.bytes, 0);

/** the finished frame's length on the wire, for the rail's own header */
export const WIRE_BYTES = frameLength(REQUEST);

/* ── what it prints ────────────────────────────────────────────────────── */

export type OutLine = {
  text: string;
  kind: "plain" | "head" | "note" | "ok" | "bad" | "sent" | "recv";
};

const o = (kind: OutLine["kind"], text: string): OutLine => ({ kind, text });

/**
 * The output pane, per step. Written out rather than generated, because the
 * thing being taught IS the shape of what these tools print — the column
 * nobody explains in `ip neigh`, the `;; ANSWER SECTION:` header, the dot
 * that means "no flags but ACK" in tcpdump. A generator would tidy exactly
 * those away.
 */
const TRANSCRIPT: Record<number, OutLine[]> = {
  3: [
    o("sent", "$ ip -br link show eth0"),
    o("plain", "eth0  UP  a4:83:e7:1c:9d:40 <BROADCAST,MULTICAST,UP,LOWER_UP>"),
    o("plain", ""),
    o("sent", "$ ip -br addr show eth0"),
    o("plain", "eth0  UP  192.168.1.42/24 fe80::a683:e7ff:fe1c:9d40/64"),
    o(
      "note",
      "one interface, two addresses, and neither can do the other's job",
    ),
  ],
  4: [
    o("sent", "$ ip neigh"),
    o("plain", "192.168.1.1 dev eth0 lladdr f0:9f:c2:11:aa:01 REACHABLE"),
    o("plain", "192.168.1.17 dev eth0 lladdr 3c:22:fb:0d:41:9e STALE"),
    o(
      "note",
      "REACHABLE was confirmed recently; STALE will be checked before it is trusted again",
    ),
    o("plain", ""),
    o("sent", "$ tcpdump -ni eth0 -e arp"),
    o(
      "plain",
      "a4:83:e7:1c:9d:40 > ff:ff:ff:ff:ff:ff, ARP, Request who-has 192.168.1.1 tell 192.168.1.42, length 28",
    ),
    o(
      "recv",
      "f0:9f:c2:11:aa:01 > a4:83:e7:1c:9d:40, ARP, Reply 192.168.1.1 is-at f0:9f:c2:11:aa:01, length 28",
    ),
    o(
      "note",
      "-e prints the Ethernet addresses. the question went to everyone; the answer came back to one machine",
    ),
  ],
  5: [
    o("sent", "$ cat /etc/resolv.conf"),
    o("plain", "nameserver 1.1.1.1"),
    o("note", "put there by DHCP, from the router, when the laptop joined"),
    o("plain", ""),
    o("sent", "$ dig +short example.com"),
    o("plain", "93.184.216.34"),
    o("plain", ""),
    o("sent", "$ dig example.com"),
    o("head", ";; QUESTION SECTION:"),
    o("plain", ";example.com.            IN      A"),
    o("plain", ""),
    o("head", ";; ANSWER SECTION:"),
    o("ok", "example.com.     86400   IN      A       93.184.216.34"),
    o("plain", ""),
    o("note", ";; Query time: 14 msec"),
    o("note", ";; SERVER: 1.1.1.1#53(1.1.1.1) (UDP)"),
  ],
  6: [
    o("sent", "$ ip route"),
    o("ok", "default via 192.168.1.1 dev eth0 proto dhcp metric 100"),
    o(
      "plain",
      "192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.42",
    ),
    o(
      "note",
      "two rules. 93.184.216.34 matches neither prefix, so it takes the default",
    ),
    o("plain", ""),
    o("sent", "$ traceroute -n example.com"),
    o("plain", " 1  192.168.1.1      0.9 ms"),
    o("plain", " 2  203.0.113.1      8.4 ms"),
    o("plain", " 3  62.115.49.165   11.2 ms"),
    o("plain", " 4  * * *"),
    o("plain", " 5  93.184.216.34   23.7 ms"),
    o(
      "note",
      "hop 4 answers nothing and forwards fine; a router may decline to speak for itself",
    ),
  ],
  7: [
    o("sent", "$ ss -tnp"),
    o(
      "head",
      "State   Recv-Q  Send-Q      Local Address:Port      Peer Address:Port",
    ),
    o(
      "ok",
      'ESTAB   0       0           192.168.1.42:54312      93.184.216.34:443   users:(("curl",pid=4412,fd=5))',
    ),
    o(
      "plain",
      'ESTAB   0       0           192.168.1.42:54318      93.184.216.34:443   users:(("curl",pid=4417,fd=5))',
    ),
    o(
      "note",
      "same machine, same server, same port 443 — only the source port tells them apart",
    ),
  ],
  8: [
    o("sent", "$ tcpdump -ni eth0 'tcp port 443'"),
    o(
      "plain",
      "192.168.1.42.54312 > 93.184.216.34.443: Flags [S], seq 1829301, win 64240, options [mss 1460,sackOK,TS val 91 ecr 0,nop,wscale 7], length 0",
    ),
    o(
      "recv",
      "93.184.216.34.443 > 192.168.1.42.54312: Flags [S.], seq 3901772, ack 1829302, win 65160, options [mss 1460,sackOK,TS val 55 ecr 91,nop,wscale 7], length 0",
    ),
    o(
      "sent",
      "192.168.1.42.54312 > 93.184.216.34.443: Flags [.], ack 3901773, win 502, length 0",
    ),
    o(
      "note",
      "three packets, zero bytes of data, and now both sides agree where the counting starts",
    ),
  ],
  9: [
    o(
      "sent",
      "$ openssl s_client -connect example.com:443 -servername example.com",
    ),
    o(
      "plain",
      "depth=2 C = US, O = DigiCert Inc, CN = DigiCert Global Root G2",
    ),
    o("plain", "verify return:1"),
    o("head", "SSL-Session:"),
    o("ok", "    Protocol  : TLSv1.3"),
    o("ok", "    Cipher    : TLS_AES_128_GCM_SHA256"),
    o("plain", "    ALPN protocol: h2"),
    o("plain", "    Verify return code: 0 (ok)"),
    o(
      "note",
      "the certificate proves the name. the key exchange keeps the bytes private. they are two different promises",
    ),
  ],
  10: [
    o("sent", "$ curl -v --http1.1 https://example.com/"),
    o("sent", "> GET / HTTP/1.1"),
    o("sent", "> Host: example.com"),
    o("sent", "> User-Agent: curl/8.7.1"),
    o("sent", "> Accept: */*"),
    o("sent", ">"),
    o("recv", "< HTTP/1.1 200 OK"),
    o("recv", "< Content-Type: text/html; charset=UTF-8"),
    o("recv", "< Content-Length: 1256"),
    o("recv", "<"),
    o("plain", "<!doctype html>"),
    o(
      "note",
      "a line, some headers, a blank line, a body. that is the whole protocol",
    ),
    o(
      "note",
      "drop --http1.1 and curl negotiates HTTP/2: same method, same headers, binary on the wire",
    ),
  ],
  11: [
    o("note", "# on the router, not the laptop"),
    o("sent", "$ conntrack -L -p tcp --dport 443"),
    o(
      "plain",
      "tcp 6 431999 ESTABLISHED src=192.168.1.42 dst=93.184.216.34 sport=54312 dport=443",
    ),
    o(
      "ok",
      "              [REPLY] src=93.184.216.34 dst=203.0.113.7 sport=443 dport=61001",
    ),
    o(
      "plain",
      "tcp 6 431988 ESTABLISHED src=192.168.1.31 dst=17.253.144.10 sport=51904 dport=443",
    ),
    o(
      "plain",
      "              [REPLY] src=17.253.144.10 dst=203.0.113.7 sport=443 dport=61004",
    ),
    o(
      "note",
      "two machines, one public address, two rows. the port number is the whole of the difference",
    ),
    o(
      "note",
      "with IPv6 there is no table at all: every machine has its own address and the reply finds it",
    ),
  ],
  12: [
    o("sent", "$ tcpdump -ni eth0 -X -c1 'tcp port 443'"),
    o("plain", "0x0000:  f09f c211 aa01 a483 e71c 9d40 0800 4500"),
    o("plain", "0x0010:  003d 2b20 4000 4006 17ee c0a8 012a 5db8"),
    o("plain", "0x0020:  d822 d428 01bb 0000 0002 0000 0002 5018"),
    o("plain", "0x0030:  faf0 1e4a 0000 1703 0300 62"),
    o(
      "note",
      "bytes 0-13 Ethernet, 14-33 IPv4, 34-53 TCP. fifty-four bytes of addressing, then the record",
    ),
    o("plain", ""),
    o("sent", "$ ip link show eth0 | head -1"),
    o(
      "plain",
      "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel",
    ),
  ],
  13: [
    o("sent", "$ curl https://nope.example.com/"),
    o("bad", "curl: (6) Could not resolve host: nope.example.com"),
    o("plain", ""),
    o("sent", "$ curl https://example.com:8443/"),
    o(
      "bad",
      "curl: (7) Failed to connect to example.com port 8443: Connection refused",
    ),
    o("plain", ""),
    o("sent", "$ curl --max-time 5 https://192.0.2.9/"),
    o("bad", "curl: (28) Connection timed out after 5001 milliseconds"),
    o("plain", ""),
    o("sent", "$ curl https://expired.example.com/"),
    o("bad", "curl: (60) SSL certificate problem: certificate has expired"),
    o("plain", ""),
    o(
      "sent",
      "$ curl -s -o /dev/null -w '%{http_code}\\n' https://example.com/",
    ),
    o("recv", "502"),
    o(
      "note",
      "the last one is not a network failure at all. everything worked, and the far end said so",
    ),
  ],
  14: [
    o(
      "sent",
      "$ curl -o /dev/null -s -w 'dns %{time_namelookup}  tcp %{time_connect}  tls %{time_appconnect}  first byte %{time_starttransfer}  total %{time_total}\\n' https://example.com/",
    ),
    o("ok", "dns 0.021  tcp 0.068  tls 0.119  first byte 0.192  total 0.195"),
    o("note", "each number is the clock at that moment, not a duration"),
    o("plain", ""),
    o("plain", "  dns          21 ms   one round trip to the resolver"),
    o("plain", "  tcp          47 ms   one round trip to the server"),
    o("plain", "  tls          51 ms   one more, for TLS 1.3"),
    o("plain", "  first byte   73 ms   the request out, the answer back"),
    o("plain", "  the page      3 ms   actually moving the bytes"),
    o(
      "note",
      "four round trips before one byte of HTML. that is what Part II draws",
    ),
  ],
};

export const outputAt = (step: number): OutLine[] => TRANSCRIPT[step] ?? [];

/* ── the steps ─────────────────────────────────────────────────────────── */

export type Keyword = {
  word: string;
  what: string;
  /** the sentence about what happens when it is missing or wrong */
  without?: string;
  /**
   * True for a gloss on an idea rather than a literal to find on screen —
   * "encapsulation", "a broadcast domain". Everything else must be visible
   * at its own step, and `tests/network-guide.test.ts` holds it to that.
   */
  idea?: true;
};

export type Shell = { text: string; note?: string };

export type Inset = {
  title: string;
  /** the figure itself: a capture, a table, a worked sum */
  body: string[];
  note: string;
};

export type Step = {
  n: number;
  title: string;
  lead: string;
  shell?: Shell[];
  keywords?: Keyword[];
  insets?: Inset[];
  takeaway: string;
};

export const STEPS: Step[] = [
  {
    n: 1,
    title: "One name, one wish",
    lead: "You type `example.com` and press return. Nothing in that sentence is an address. It does not say which cable, which machine, or which program on that machine; the far end has never heard of you, and the two of you have no language in common yet. Everything on this page exists to close that gap, and nearly all of it finishes before a single byte of the page comes back.",
    keywords: [
      {
        word: "the stack",
        idea: true,
        what: "Four or five layers, each solving exactly one problem and handing the rest down. Nobody designed it in one go, which is why it fits together the way a town does rather than the way a machine does.",
      },
      {
        word: "encapsulation",
        idea: true,
        what: "Each layer wraps what the one above handed it, adds its own header, and does not look inside. That is why a router can forward a packet it cannot read, and why a switch can forward one addressed to a country it has never heard of.",
      },
    ],
    takeaway:
      "A URL is a wish. The stack is the machinery that turns it into bytes on one specific wire.",
  },
  {
    n: 2,
    title: "The URL, taken apart",
    lead: "Before anything leaves the machine, the browser splits that line into parts, and each part is answered by a different piece of the stack. Two of them never leave the laptop at all. Knowing which is which is the difference between guessing at a failure and reading it.",
    keywords: [
      {
        word: "https",
        what: "The scheme. It decides two things at once: the default port (443) and that there will be a TLS handshake before a word of HTTP is spoken.",
      },
      {
        word: "example.com",
        what: "The host, and the only part of the line that needs DNS. It is also the only part the server is told about explicitly, in the `Host:` header, because one address may serve hundreds of names.",
      },
      {
        word: ":443",
        what: "The port. Usually absent, because the scheme implies it. Write `:8443` and the browser connects there instead and TLS still happens — the scheme decides the protocol, not the number.",
      },
      {
        word: "/index.html",
        what: "The path. Meaningless until a connection exists: it is the first line of the request, not part of the addressing.",
        without:
          "A path is not a file. The server may serve a file, or a database row, or nothing at all, and the URL cannot tell you which.",
      },
      {
        word: "#top",
        what: "The fragment. It is never sent. The browser keeps it, fetches the whole document and then scrolls — which is why a server log can never tell you which section someone read.",
      },
    ],
    insets: [
      {
        title: "the line, labelled",
        body: [
          "  https://example.com:443/index.html?q=1#top",
          "  └─┬─┘   └────┬────┘ └┬┘└────┬────┘└─┬─┘└┬┘",
          "    │          │       │      │       │   └ fragment · never sent",
          "    │          │       │      │       └ query · sent, part of the path",
          "    │          │       │      └ path · the first line of the request",
          "    │          │       └ port · which program on that machine",
          "    │          └ host · the only part DNS is asked about",
          "    └ scheme · which protocol, and therefore which default port",
        ],
        note: "Two of the seven parts never cross a wire. The fragment stays in the browser, and the port is usually implied rather than written.",
      },
    ],
    takeaway:
      "Seven parts, three jobs: find the machine, find the program, ask for the thing.",
  },
  {
    n: 3,
    title: "Two addresses, and why there are two",
    lead: "Every interface here has two addresses, and they are not alternatives. A MAC address is burned into the card, flat, and means nothing beyond the cable it is plugged into. An IP address is handed out, hierarchical, and means the same thing everywhere on earth. The first three fields of the frame are the near one — so the rail starts there.",
    shell: [
      { text: "$ ip -br link show eth0", note: "the address of the card" },
      { text: "$ ip -br addr show eth0", note: "the address of the machine" },
    ],
    keywords: [
      {
        word: "a4:83:e7:1c:9d:40",
        what: "Six bytes. The first three are the OUI, bought from the IEEE by whoever made the card; the last three are theirs to assign. There is no structure to route on, which is exactly why MACs do not leave the cable.",
      },
      {
        word: "Destination MAC",
        what: "The next device on this wire — here the router, not the server. The server's address is nowhere in this header and will not appear until the IP one does.",
        without:
          "This is the field people get wrong. The destination MAC and the destination IP almost never name the same machine.",
      },
      {
        word: "EtherType",
        what: "Two bytes saying what the next header is: `0x0800` for IPv4, `0x0806` for ARP, `0x86dd` for IPv6. Without it the rest of the frame is a pile of bytes with no grammar.",
      },
      {
        word: "192.168.1.42/24",
        what: "The address, and how much of it is the network. `/24` means the first 24 bits — so 192.168.1.anything is on this wire, and everything else is not.",
      },
      {
        word: "a broadcast domain",
        idea: true,
        what: "Everything one frame can reach without a router. The switch extends it; the router ends it. That boundary is the one that matters, and it is invisible in every diagram that draws the house as a cloud.",
      },
    ],
    insets: [
      {
        title: "same wire, or not: the only sum that matters",
        body: [
          "  address   192.168.1.42    11000000 10101000 00000001 00101010",
          "  mask /24                  ████████ ████████ ████████",
          "  network   192.168.1.0     11000000 10101000 00000001",
          "",
          "  192.168.1.1     first 24 bits match  → same wire, speak directly",
          "  93.184.216.34   they do not          → give it to the router",
        ],
        note: "The laptop does this sum for every packet it sends. The answer decides whether the destination MAC is the server's or the router's, and nothing else in the frame changes.",
      },
    ],
    takeaway:
      "The MAC addresses a cable. The IP addresses a machine. A frame carries both because both questions have to be answered.",
  },
  {
    n: 4,
    title: "ARP · who has 192.168.1.1?",
    lead: "The laptop has just worked out that the frame must go to the router, and it has a problem: it knows the router's IP address and cannot put an IP address on a cable. Ethernet carries MACs. So before anything else happens, it shouts the question at every machine on the segment and waits for one of them to own up.",
    shell: [
      {
        text: "$ ip neigh",
        note: "the ARP cache, which is where the answer is kept",
      },
      {
        text: "$ tcpdump -ni eth0 -e arp",
        note: "the question and the answer, two frames",
      },
    ],
    keywords: [
      {
        word: "ff:ff:ff:ff:ff:ff",
        what: "The broadcast address. A switch does not look this one up — it floods it out of every port it has, which is the one thing a switch does that costs everybody something.",
      },
      {
        word: "who-has 192.168.1.1 tell 192.168.1.42",
        what: "The whole of an ARP request: here is my IP and my MAC, whoever holds that IP please answer. Opcode 1 is the question, opcode 2 the reply.",
      },
      {
        word: "REACHABLE",
        what: "The cache state. Confirmed recently, so it is used without asking. `STALE` means it has not been confirmed lately and will be checked before it is trusted again.",
        without:
          "Without a cache every single packet would begin with a broadcast, and a busy segment would spend most of its time shouting.",
      },
      {
        word: "ip neigh",
        what: "Modern Linux for what `arp -a` used to print. Same table, and the same table IPv6 fills in with Neighbour Discovery instead.",
      },
      {
        word: "trust",
        idea: true,
        what: "Nothing here is authenticated. Whoever answers first is believed, and a machine that answers for an address it does not hold now sees that traffic. That is ARP spoofing, and the protocol has no defence against it.",
      },
    ],
    insets: [
      {
        title: "what the switch learned while that happened",
        body: [
          "  port  MAC                 learned from",
          "  1     a4:83:e7:1c:9d:40   the laptop's ARP request",
          "  3     f0:9f:c2:11:aa:01   the router's reply",
          "  4     —                   the printer has never spoken",
        ],
        note: "A switch learns from source addresses alone, and it never learns about a machine that stays silent. A frame for the printer is flooded out of every port, every time, until it says something.",
      },
    ],
    takeaway:
      "Layer 3 cannot move a byte on its own. Every IP packet needs a layer-2 answer first, and ARP is how it is got.",
  },
  {
    n: 5,
    title: "DNS · the name becomes an address",
    lead: "Now the other address. `example.com` is not routable; 93.184.216.34 is. Turning one into the other is a complete request of its own — its own packets, its own server, its own round trip — and it has to finish before the real request can begin. That is why a slow resolver makes every site feel slow.",
    shell: [
      {
        text: "$ cat /etc/resolv.conf",
        note: "which resolver, and who said so",
      },
      { text: "$ dig +short example.com", note: "the answer alone" },
      { text: "$ dig example.com", note: "the answer, and where it came from" },
    ],
    keywords: [
      {
        word: "A",
        what: 'The record type: a name to an IPv4 address. `AAAA` is the same thing for IPv6, `CNAME` says "ask about this other name instead", `MX` says where mail goes.',
      },
      {
        word: "86400",
        what: "The TTL, in seconds — how long this answer may be cached. One day here. It is also why a DNS change does not take effect everywhere at once, and why the TTL is lowered before a planned move.",
      },
      {
        word: "1.1.1.1#53",
        what: "The resolver that was asked, and the port. Port 53, over UDP, because a question and an answer that fit in one packet each do not need a connection.",
        without:
          "An answer too big for one datagram sets the truncated bit, and the resolver asks again over TCP. DNS has always had both.",
      },
      {
        word: "a recursive resolver",
        idea: true,
        what: "The machine that does the asking around on your behalf. Your laptop asks one question; the resolver may ask three, and caches the answers so the next person asks none.",
      },
      {
        word: "/etc/resolv.conf",
        what: "Where the laptop was told which resolver to use — usually by DHCP, from the router, at the moment it joined the network.",
      },
      {
        word: "Source address",
        what: "Now that there is an address for the far end, the IP header can be written: where this packet is from, where it is going, and which protocol is inside. Those three never change between here and the server — unlike the MACs, which change at every hop.",
      },
    ],
    insets: [
      {
        title: "the three questions behind one answer",
        body: [
          "  $ dig +trace example.com",
          "",
          "  .            NS   a.root-servers.net.      who handles .com?",
          "  com.         NS   a.gtld-servers.net.      who handles example.com?",
          "  example.com. A    93.184.216.34            and the answer",
        ],
        note: "Three questions, from the most general to the most specific, and none of the three servers knows the whole answer. The resolver did all of this once; the TTL means nobody repeats it for a day.",
      },
    ],
    takeaway:
      "DNS is a separate request that must finish before yours starts. It is also the one most often at fault.",
  },
  {
    n: 6,
    title: "The next hop is not the destination",
    lead: "Here is the sentence that unlocks everything else: the destination MAC is the router's, and the destination IP is the server's, in the same frame, at the same time. The IP addresses say where this is ultimately going. The MACs say who hands it on next. Only one of the two is rewritten at every hop.",
    shell: [
      { text: "$ ip route", note: "the whole decision, two lines long" },
      { text: "$ traceroute -n example.com", note: "the hops, made to answer" },
    ],
    keywords: [
      {
        word: "default via 192.168.1.1",
        what: "The route of last resort. Anything that matches no other line goes here — which, on a laptop, is the entire internet.",
      },
      {
        word: "longest prefix match",
        idea: true,
        what: "When two routes match, the more specific one wins. `192.168.1.0/24` beats `0.0.0.0/0` for a local address, and that single rule is how every routing table on earth is read.",
      },
      {
        word: "TTL",
        what: "Time to live: a hop counter, not a clock. Every router subtracts one, and at zero the packet is dropped and an ICMP message is sent back. It is the only thing standing between a routing loop and a packet that circles forever.",
      },
      {
        word: "Header checksum",
        what: "Covers the IP header only, not the data. It has to be recomputed at every single hop, because the TTL that was just decremented is inside it.",
      },
      {
        word: "Don't fragment",
        what: "A flag asking routers not to cut the packet up. If one is too big for the next link, it is dropped and an ICMP message says so — which is how a sender discovers the smallest link on the path.",
      },
      {
        word: "Total length",
        what: "Header plus payload, in bytes. Ethernet carries no length of its own, so this field is the only place the size is written down.",
      },
    ],
    insets: [
      {
        title: "how traceroute makes a router confess",
        body: [
          "  send with TTL 1   →  first router drops it, replies: Time Exceeded",
          "  send with TTL 2   →  second router drops it, replies: Time Exceeded",
          "  send with TTL 3   →  third router drops it, replies: Time Exceeded",
          "  ...                                                              ",
          "  send with TTL 9   →  the server answers for itself",
        ],
        note: "There is no trace protocol. Traceroute abuses the hop counter, one packet per hop, and prints whoever complains. A row of asterisks means a router chose not to complain — it is forwarding fine and simply declining to speak.",
      },
    ],
    takeaway:
      "The MACs change at every hop. The IP addresses do not. That is the entire division of labour between layers 2 and 3.",
  },
  {
    n: 7,
    title: "Ports · one address, many programs",
    lead: "The packet can now reach the right machine, which has perhaps forty programs on it waiting for something. The address gets it through the door; the port says which desk. And because the laptop picks its own number for each conversation, two connections to the same server stay separate without either end having to think about it.",
    shell: [
      { text: "$ ss -tnp", note: "every open connection, and whose it is" },
    ],
    keywords: [
      {
        word: "443",
        what: "The destination port — where a listening web server is. Anything under 1024 is a well-known port that only root may bind, which is a convention from a time when that still meant something.",
      },
      {
        word: "54312",
        what: "The source port, picked at random by the laptop out of its ephemeral range (`32768-60999` on Linux, in `/proc/sys/net/ipv4/ip_local_port_range`). Nobody chose it and nothing depends on it except this one conversation.",
      },
      {
        word: "the four-tuple",
        idea: true,
        what: "Source address, source port, destination address, destination port. That quadruple IS the connection — it is what the kernel looks a packet up by, and the only reason two downloads from the same site do not get mixed together.",
      },
      {
        word: "Protocol",
        what: "In the IP header, `6` means a TCP header comes next and `17` means UDP. Ports are a transport-layer idea; IP itself has none, which is why this field has to exist.",
        without:
          "UDP has ports and nothing else — no ordering, no retries, no connection. That is why DNS used it: one question, one answer, no setup worth paying for.",
      },
    ],
    insets: [
      {
        title: "ports worth knowing by sight",
        body: [
          "   22  SSH          443  HTTPS, and HTTP/3 over QUIC",
          "   53  DNS          587  mail submission",
          "   80  HTTP        3306  MySQL",
          "  123  NTP         5432  PostgreSQL",
        ],
        note: "A number under 1024 is assigned by IANA and means something. A number above 32768 was almost certainly picked at random a moment ago and means nothing at all.",
      },
    ],
    takeaway:
      "An address finds the machine. A port finds the program. Both ends of both is the connection itself.",
  },
  {
    n: 8,
    title: "Three packets, and a stream exists",
    lead: "TCP promises that bytes arrive, in order, exactly once — over a network that offers none of those things. The price is paid up front: three packets carrying no data at all, whose only job is to agree where the counting starts. Watch a capture of them and the rest of TCP stops being mysterious.",
    shell: [
      {
        text: "$ tcpdump -ni eth0 'tcp port 443'",
        note: "[S] is SYN, [S.] is SYN with ACK, [.] is a bare ACK",
      },
    ],
    keywords: [
      {
        word: "Flags",
        what: "One byte of them. `SYN` opens, `ACK` acknowledges, `FIN` closes politely, `RST` slams the door, `PSH` says deliver this to the program now rather than waiting for more.",
      },
      {
        word: "Sequence number",
        what: "Counts BYTES, not packets, and starts from a random number rather than zero — because a predictable start is a connection a stranger can inject into.",
      },
      {
        word: "Acknowledgement",
        what: "The next byte expected, not the last one received. Everything below it has arrived; anything above it has not, or not yet.",
        without:
          'Nothing is acknowledged individually. One number says "everything up to here", which is why a single lost segment stalls the ones behind it.',
      },
      {
        word: "Window",
        what: "How many more bytes this side is willing to accept before it hears back. It is free space in a buffer, published on every packet, and it is how a fast sender is kept from drowning a slow reader.",
      },
      {
        word: "mss 1460",
        what: "The largest segment this side will accept, offered in a TCP option on the SYN. It is 1500 minus 20 bytes of IP header and 20 of TCP — the one piece of arithmetic worth memorising.",
      },
      {
        word: "Checksum",
        what: "Covers the TCP header, the data, AND a pseudo-header made of the two IP addresses. It is the one place two layers are deliberately not independent, and it is why a NAT that rewrites an address must fix this number too.",
      },
    ],
    insets: [
      {
        title: "the sum behind 1460",
        body: [
          "  1500   MTU, what one Ethernet frame may carry",
          "   -20   IPv4 header",
          "   -20   TCP header",
          "  ────",
          "  1460   MSS, the most data one segment can hold",
        ],
        note: "Add a VPN or a tunnel and every one of those packets grows a second header, so the real MSS drops. A path that works for small requests and hangs on large ones is almost always this.",
      },
    ],
    takeaway:
      "TCP's guarantee costs one full round trip before a byte of data moves. Everything after it is bookkeeping on those numbers.",
  },
  {
    n: 9,
    title: "A key agreed in the open",
    lead: "Everything so far has been readable by every device it passed. TLS fixes that, over the same connection, with an exchange in which both sides end up holding the same key without ever sending it — and in which the server has to prove, before anything is trusted, that it really is the name you asked for. Two different promises, often confused for one.",
    shell: [
      {
        text: "$ openssl s_client -connect example.com:443 -servername example.com",
        note: "the handshake, printed",
      },
    ],
    keywords: [
      {
        word: "ClientHello",
        what: "The first TLS message: the versions and ciphers on offer, a random number, and — in TLS 1.3 — a key share sent speculatively so the whole thing fits in one round trip.",
      },
      {
        word: "SNI",
        what: "Server Name Indication: the hostname, sent in the clear in that first message, so a server holding a hundred certificates knows which one to present. It is the thing a tap still learns about you after everything else is encrypted.",
      },
      {
        word: "TLSv1.3",
        what: "One round trip to a working connection, against two for TLS 1.2, and the certificate itself is now encrypted. Everything before 1.2 is broken and has been turned off.",
        without:
          "Resuming an earlier session can cost zero round trips, at the cost of the first request being replayable. That trade is why 0-RTT is usually allowed only for reads.",
      },
      {
        word: "Verify return code: 0",
        what: "The chain checked out: signed by someone your machine already trusts, within its dates, and the name matches the one you asked for. Any other number is a refusal, and browsers refuse by default.",
      },
      {
        word: "ALPN",
        what: "Negotiated inside the handshake: `h2` for HTTP/2, `http/1.1` otherwise. The protocol is chosen before the first request, which saves a round trip of asking.",
      },
      {
        word: "Record type",
        what: "`23` is application data — the only record type a tap sees after the handshake. The length is in the clear; the contents are not.",
      },
    ],
    insets: [
      {
        title: "the handshake, in four messages",
        body: [
          "  →  ClientHello   versions, ciphers, a random, a key share — and the SNI",
          "  ←  ServerHello   the cipher it picked, and its own key share",
          "  ←  Certificate   the proof of the name, already encrypted in TLS 1.3",
          "  →  Finished      both sides hold the same key. one round trip has passed",
        ],
        note: "Neither side ever sends the key. Each combines its own secret with the other's public share and arrives at the same number — which is why watching every byte of this exchange does not help an eavesdropper.",
      },
      {
        title: "what a tap still learns, with TLS working perfectly",
        body: [
          "  both IP addresses      who is talking to whom",
          "  both port numbers      that it is HTTPS",
          "  the SNI hostname       which site, by name, in the clear",
          "  record sizes           roughly how big the page is",
          "  timing                 when, how often, and for how long",
        ],
        note: "Encryption hides the bytes. It does not hide the conversation. Every one of these is visible to anything on the path, which is most of what traffic analysis is.",
      },
    ],
    takeaway:
      "TLS proves who, then hides what. The certificate is the first promise and the key exchange is the second.",
  },
  {
    n: 10,
    title: "The request, and the page",
    lead: "Fifty-four bytes of addressing and one handshake later, the thing you actually wanted goes out: a line, a few headers, a blank line. It is the oldest and plainest protocol in the stack, and on this wire it is inside a TLS record, so the rail shows it greyed — the laptop knows it, the cable never carried it.",
    shell: [
      {
        text: "$ curl -v --http1.1 https://example.com/",
        note: "> is what went out, < is what came back",
      },
    ],
    keywords: [
      {
        word: "GET / HTTP/1.1",
        what: "Method, path, version. The method says what kind of thing you want done; the path is the first time in this whole sequence that the thing you are asking for is named.",
      },
      {
        word: "Host: example.com",
        what: "Required since HTTP/1.1, and the reason one IP address can serve a thousand sites. The connection reached a machine; this header says which site on it you meant.",
        without:
          "Leave it out of an HTTP/1.1 request and a correct server answers `400 Bad Request`, because it genuinely cannot know what you asked for.",
      },
      {
        word: "200 OK",
        what: "The status line. `2xx` worked, `3xx` go elsewhere, `4xx` your fault, `5xx` theirs. Four classes, and the first digit is most of what you need.",
      },
      {
        word: "Content-Length",
        what: "How many bytes of body follow the blank line. Without it the receiver cannot tell the end of this response from the start of the next one on the same connection.",
      },
      {
        word: "HTTP/2",
        what: "Same methods, same headers, same status codes — a different way of putting them on the wire: binary, compressed, many requests interleaved on one connection. HTTP/3 does the same over QUIC, on UDP, with TLS built in.",
      },
    ],
    insets: [
      {
        title: "the part of the rail the wire never carried",
        body: [
          "  on the wire     14 B Ethernet + 20 B IPv4 + 20 B TCP + the TLS record",
          "  in the laptop   GET / HTTP/1.1, Host:, User-Agent:, Accept:, blank line",
          "",
          "  a capture shows the first line. It cannot show the second.",
        ],
        note: "The rail greys those five fields and counts them as zero bytes, for the same reason: they are what the program meant, not what the cable carried. Every byte count on this page is of the wire.",
      },
    ],
    takeaway:
      "The whole of HTTP is a line, some headers, a blank line and a body. Everything else is delivery.",
  },
  {
    n: 11,
    title: "One address for the whole house",
    lead: "The frame that leaves the laptop is not the frame that leaves the house. At the router it gets new MACs, as at every hop — and also a new source address and a new source port, because there is one public address out there and several machines behind it. Four fields rewritten, two checksums redone, one row in a table.",
    shell: [
      {
        text: "$ conntrack -L -p tcp --dport 443",
        note: "on the router: the table that makes the replies findable",
      },
    ],
    keywords: [
      {
        word: "sport=54312",
        what: "What the laptop chose, kept in the table. Outbound it becomes 61001; inbound, anything arriving for 61001 is turned back into 54312 and sent to 192.168.1.42.",
      },
      {
        word: "203.0.113.7",
        what: "The one address the rest of the internet sees. Every machine in the house shares it, and the port number in the table is the only thing that tells their conversations apart.",
      },
      {
        word: "Checksum",
        what: "Both of them have to be fixed. The IP header checksum because the source address changed; the TCP checksum because its pseudo-header includes that same address. A NAT that forgot the second would produce packets every receiver silently drops.",
      },
      {
        word: "inbound",
        idea: true,
        what: "There is no row until someone inside starts a conversation, so an unannounced connection from outside matches nothing and is dropped. That is a side effect of NAT, not a firewall — but it is why a home machine is not reachable until a port is forwarded on purpose.",
      },
      {
        word: "IPv6",
        what: "Enough addresses that no machine has to share one, so the table disappears and a reply finds its own way back. The reason NAT exists at all is that IPv4 ran out of addresses in 2011.",
      },
    ],
    insets: [
      {
        title: "the same request, three cables",
        body: [
          "  laptop → switch    dst MAC router   src 192.168.1.42:54312   TTL 64",
          "  switch → router    dst MAC router   src 192.168.1.42:54312   TTL 64",
          "  router → ISP       dst MAC ISP      src 203.0.113.7:61001    TTL 63",
        ],
        note: "The switch changed nothing at all — it reads layer 2 and forwards. The router rewrote the layer-2 addresses because the old ones were only ever meaningful on the last cable, decremented the hop counter, and swapped the source for its own.",
      },
    ],
    takeaway:
      "A packet is not a parcel that travels. It is rewritten at every hop, and at one of them its return address changes too.",
  },
  {
    n: 12,
    title: "What a tap actually sees",
    lead: "Put all of it together and the frame on the first cable is seventy-five bytes, of which fifty-four are addressing: fourteen of Ethernet, twenty of IPv4, twenty of TCP, before one byte of anything you asked for. That ratio is why small packets are expensive and why every protocol since has tried to send fewer, larger ones.",
    shell: [
      {
        text: "$ tcpdump -ni eth0 -X -c1 'tcp port 443'",
        note: "one frame, as bytes",
      },
      {
        text: "$ ip link show eth0 | head -1",
        note: "and the ceiling it fits under",
      },
    ],
    keywords: [
      {
        word: "f09f c211 aa01",
        what: "The first six bytes of the capture, and the first field of the rail: the router's MAC. Everything on this page is in there, in that order, and the hex pane in Part II will count it out field by field.",
      },
      {
        word: "mtu 1500",
        what: "The largest frame this interface will carry, and the number every other size on the page is derived from. It has been 1500 since Ethernet ran on coaxial cable, for reasons that stopped applying decades ago.",
      },
      {
        word: "0x0030",
        what: "The offset down the left of a hex dump, in bytes from the start of the frame. By byte 54 the addressing is finished and the TLS record has begun — `1703 03` is a record of type 23, version 3.3.",
      },
      {
        word: "promiscuous mode",
        idea: true,
        what: "A card normally discards frames not addressed to it. Told not to, it keeps everything it hears — which on a switch is only broadcasts and its own traffic, and on the old shared-cable Ethernet was everybody's.",
      },
    ],
    insets: [
      {
        title: "the fifty-four byte tax",
        body: [
          "  bytes 0-13    Ethernet II   dst MAC, src MAC, type",
          "  bytes 14-33   IPv4          version … src and dst addresses",
          "  bytes 34-53   TCP           ports, sequence, flags, window",
          "  bytes 54-     the payload   here, one TLS record",
        ],
        note: "Fixed, per packet, whether the payload is one byte or fourteen hundred. A protocol that sends a packet per keystroke spends 98% of the wire on envelopes, which is what Nagle's algorithm was invented to stop.",
      },
    ],
    takeaway:
      "Every layer costs bytes at the front. On a small packet the addressing is most of what you are paying for.",
  },
  {
    n: 13,
    title: "When it breaks, which layer broke",
    lead: "The useful thing about a stack is that failures are layered too. A handful of errors, read properly, name the layer before you have opened anything — and the single most useful distinction in the list is between a refusal and a silence, because they mean opposite things.",
    shell: [
      { text: "$ curl https://nope.example.com/", note: "nothing resolved" },
      { text: "$ curl https://example.com:8443/", note: "someone said no" },
      {
        text: "$ curl --max-time 5 https://192.0.2.9/",
        note: "nobody said anything",
      },
      {
        text: "$ curl https://expired.example.com/",
        note: "the proof did not check out",
      },
    ],
    keywords: [
      {
        word: "curl: (6)",
        what: "Could not resolve host. DNS, layer 7 — and nothing else was even attempted. Check the name, then the resolver.",
      },
      {
        word: "curl: (7)",
        what: "Connection refused. A packet arrived, a machine answered with RST, and nothing was listening on that port. The whole path works; the program is not there.",
      },
      {
        word: "curl: (28)",
        what: "Timed out. The SYN went out and nothing at all came back. That is a firewall dropping it, or a route that goes nowhere — silence is deliberate in a way that a refusal is not.",
        without:
          "Refused in milliseconds means you reached the far end. Timed out after seconds means you are not sure you reached anything.",
      },
      {
        word: "curl: (60)",
        what: "The certificate did not check out: expired, the wrong name, or signed by nobody your machine trusts. Layers 1 to 4 all worked perfectly.",
      },
      {
        word: "502",
        what: "Not a network failure at all. Every layer worked, the request arrived, and the server is telling you that something behind IT failed. A `5xx` is the far end confessing.",
      },
    ],
    insets: [
      {
        title: "the symptom, and the layer to open first",
        body: [
          "  could not resolve      DNS            dig the name",
          "  no route to host       layer 3        ip route, then traceroute",
          "  connection refused     layer 4        ss on the server: is it listening?",
          "  timed out              layer 3 or 4   a firewall, almost always",
          "  certificate problem    layer 6        openssl s_client, check dates and name",
          "  4xx                    layer 7        your request",
          "  5xx                    layer 7        their server",
        ],
        note: "Work from the bottom only when the top gives you nothing. Most of the time the error has already named the layer, and the instinct to start with `ping` wastes the minute in which it told you.",
      },
    ],
    takeaway:
      "The error names the layer. Refused means you got there; timed out means you cannot prove you did.",
  },
  {
    n: 14,
    title: "Where the time goes",
    lead: "Nothing in the last thirteen steps is slow. Parsing a header is nanoseconds; a switch forwards in microseconds. What costs is that four separate exchanges have to complete in sequence before one byte of HTML exists — DNS, then TCP, then TLS, then the request — and each one of them is paid for in round trips across a distance that nothing can shorten.",
    shell: [
      {
        text: "$ curl -o /dev/null -s -w 'dns %{time_namelookup} …' https://example.com/",
        note: "curl's own stopwatch, at each milestone",
      },
    ],
    keywords: [
      {
        word: "time_namelookup",
        what: "The clock when DNS finished. Everything else waits behind it, which is why the resolver's distance matters as much as the server's.",
      },
      {
        word: "time_connect",
        what: "The clock when the TCP handshake finished: one round trip to the server, and the first honest measurement of how far away it is.",
      },
      {
        word: "time_appconnect",
        what: "The clock when TLS finished. One more round trip under 1.3, two under 1.2 — the single biggest argument for the newer version.",
      },
      {
        word: "time_starttransfer",
        what: "The clock when the first byte of the response arrived: the request out, the server's thinking, and the answer back.",
      },
      {
        word: "keep-alive",
        idea: true,
        what: "The second request on the same connection skips DNS, TCP and TLS entirely and costs one round trip instead of four. It is the cheapest performance win there is, and it is on by default.",
      },
    ],
    insets: [
      {
        title: "four round trips, before one byte of HTML",
        body: [
          "  1  DNS          laptop ⇄ resolver     ~21 ms",
          "  2  TCP SYN      laptop ⇄ server       ~47 ms",
          "  3  TLS 1.3      laptop ⇄ server       ~51 ms",
          "  4  GET          laptop ⇄ server       ~73 ms",
          "",
          "  moving the page itself                  ~3 ms",
        ],
        note: "Twenty-four times as long setting up as transferring. Halve the server's response time and you save three milliseconds; put the server a thousand kilometres closer and you save forty.",
      },
    ],
    takeaway:
      "Nearly all of a page load is distance and setup. Below is the same request as a clock — press play and watch the proportions.",
  },
];

export const STEP = (n: number) => STEPS.find(step => step.n === n)!;
