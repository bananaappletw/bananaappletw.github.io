/**
 * The run behind `/ansible`: one `ansible-playbook` invocation, simulated.
 *
 * `/network` follows one request across the cables it crosses. This follows
 * one playbook across the hosts it touches, and for the same reason: the
 * thing worth learning is not the YAML, which anyone can read in ten
 * minutes, but the shape of what happens when you press return — and that
 * shape is a schedule. Ansible reads declarative and runs imperative.
 *
 * ── the shape of it ──────────────────────────────────────────────────────
 *
 * A PLAY names a group of hosts and a list of TASKS. A task plus a host is
 * an EVENT: one module, shipped, run and reported, with its own verdict.
 * Events are what the page animates, because an event is the smallest thing
 * Ansible actually does.
 *
 * Every event carries STAGES, in order, from the control node's own work
 * through the bytes on the SSH channel to the module's JSON reply. The
 * stages are the lesson the YAML hides: `template` renders on the control
 * node and ships the RESULT, a module is a Python program that gets piped
 * into an interpreter over an existing connection, and a verdict is read out
 * of one JSON key.
 *
 * ── the schedule is the lesson ───────────────────────────────────────────
 *
 * `SCHEDULE` is built here, not in the browser, so that
 * `tests/ansible-run.test.ts` can hold it to the two rules that decide how
 * long a real run takes:
 *
 *   FORKS   — at most this many hosts are worked at once. With three web
 *             servers and two forks, one of them always waits.
 *   LINEAR  — the default strategy. No host starts task n+1 until EVERY
 *             host has finished task n. One slow host holds the whole play.
 *
 * Watch it run and the two rules are visible as gaps. Nearly all of the
 * wall clock is a package manager and a barrier; almost none of it is the
 * network this page's sibling draws.
 *
 * ── the verdicts are not decoration ──────────────────────────────────────
 *
 * The same four tasks run against three hosts and come back different,
 * because a verdict is a statement about the host, not about the task.
 * web1 is bare, web2 is already converged, web3 is Debian and so one task
 * is skipped before a connection is even opened. `notify` fires on
 * `changed`, which is why the handler runs on two hosts out of three.
 */

/* ── the inventory ─────────────────────────────────────────────────────── */

export type HostId = "control" | "web1" | "web2" | "web3" | "db1";

/** One fact the page is willing to show, out of the ~1,200 `setup` returns. */
export type Fact = { key: string; value: string; note?: string };

export type Host = {
  id: HostId;
  name: string;
  /** what the inventory calls it */
  fqdn: string;
  /** what it is, in one line, for the label under the drawing */
  role: string;
  /** the groups it lands in, nearest first */
  groups: string[];
  /** the paragraph the sidebar leads with when this host is selected */
  about: string;
  /** the interpreter Ansible discovers and then pipes modules into */
  python: string;
  /** the handful of facts that decide what happens to it on this run */
  facts: Fact[];
  /** position on the canvas, 0..1 across and 0..1 down */
  x: number;
  y: number;
};

export const HOSTS: Host[] = [
  {
    id: "control",
    name: "control node",
    fqdn: "laptop",
    role: "where the playbook is, and all the thinking",
    groups: [],
    about:
      "The only machine here with Ansible installed. It holds the inventory, resolves every variable, renders every template, builds every module and reads every reply — the managed hosts receive finished Python and know nothing about the play they are part of. Nothing is installed on them for this to work, which is the whole claim of the word agentless.",
    python: "/usr/bin/python3.12",
    facts: [],
    x: 0.07,
    y: 0.5,
  },
  {
    id: "web1",
    name: "web1",
    fqdn: "web1.example.net",
    role: "bare — every task has work to do",
    groups: ["webservers", "prod", "all"],
    about:
      "A fresh host. nginx is not installed, no config exists, the port is shut and the service has never started, so all four tasks change something and the handler fires. This is the only host on the page where the run looks like the tutorial.",
    python: "/usr/bin/python3.9",
    facts: [
      { key: "ansible_facts.distribution", value: "Rocky" },
      {
        key: "ansible_facts.os_family",
        value: "RedHat",
        note: "the fact the firewalld task's `when` is testing",
      },
      {
        key: "ansible_facts.pkg_mgr",
        value: "dnf",
        note: "what `ansible.builtin.package` resolves to here",
      },
      { key: "ansible_facts.distribution_version", value: "9.4" },
      { key: "ansible_facts.processor_vcpus", value: "4" },
      { key: "ansible_facts.default_ipv4.address", value: "10.4.0.11" },
    ],
    x: 0.55,
    y: 0.14,
  },
  {
    id: "web2",
    name: "web2",
    fqdn: "web2.example.net",
    role: "already converged — same tasks, different verdicts",
    groups: ["webservers", "prod", "all"],
    about:
      "The same operating system as web1 and the opposite result: nginx is installed, running and enabled, and the port is already open. Three of its four tasks report ok without touching anything. The tasks did not change — the host did, on an earlier run, and a verdict is a statement about the host.",
    python: "/usr/bin/python3.9",
    facts: [
      { key: "ansible_facts.distribution", value: "Rocky" },
      { key: "ansible_facts.os_family", value: "RedHat" },
      { key: "ansible_facts.pkg_mgr", value: "dnf" },
      { key: "ansible_facts.distribution_version", value: "9.4" },
      { key: "ansible_facts.processor_vcpus", value: "4" },
      { key: "ansible_facts.default_ipv4.address", value: "10.4.0.12" },
    ],
    x: 0.55,
    y: 0.38,
  },
  {
    id: "web3",
    name: "web3",
    fqdn: "web3.example.net",
    role: "a different distribution, and the third fork",
    groups: ["webservers", "prod", "all"],
    about:
      "Debian, in a group written for Red Hat. Two things follow and both are worth more than the YAML: `package` resolves to apt rather than dnf, so a different module is built for the same task, and the firewalld task is skipped from a fact — the decision is made on the control node and no connection is opened at all. It is also the host with no fork of its own, so it starts every task late and the whole play waits for it.",
    python: "/usr/bin/python3.12",
    facts: [
      { key: "ansible_facts.distribution", value: "Ubuntu" },
      {
        key: "ansible_facts.os_family",
        value: "Debian",
        note: 'so `when: ansible_facts.os_family == "RedHat"` is false',
      },
      { key: "ansible_facts.pkg_mgr", value: "apt" },
      { key: "ansible_facts.distribution_version", value: "24.04" },
      { key: "ansible_facts.processor_vcpus", value: "2" },
      { key: "ansible_facts.default_ipv4.address", value: "10.4.0.13" },
    ],
    x: 0.55,
    y: 0.62,
  },
  {
    id: "db1",
    name: "db1",
    fqdn: "db1.example.net",
    role: "another play, another region",
    groups: ["dbservers", "prod", "all"],
    about:
      "In a second play, so nothing it does overlaps the web tier: plays run one after another, always. It is also in another region, and its link costs twelve times what the others do — which matters because a non-pipelined task pays that cost four times instead of once.",
    python: "/usr/bin/python3.11",
    facts: [
      { key: "ansible_facts.distribution", value: "Debian" },
      { key: "ansible_facts.os_family", value: "Debian" },
      { key: "ansible_facts.pkg_mgr", value: "apt" },
      { key: "ansible_facts.distribution_version", value: "12" },
      { key: "ansible_facts.processor_vcpus", value: "8" },
      { key: "ansible_facts.default_ipv4.address", value: "10.9.0.21" },
    ],
    x: 0.55,
    y: 0.86,
  },
];

export const MANAGED: HostId[] = ["web1", "web2", "web3", "db1"];

/** One SSH channel, and what a round trip on it costs. */
export type Link = {
  host: HostId;
  /** what the channel is, once it exists */
  medium: string;
  ms: number;
};

export const LINKS: Link[] = [
  {
    host: "web1",
    medium: "SSH, multiplexed — ControlPersist holds it open for 60s",
    ms: 1.2,
  },
  { host: "web2", medium: "SSH, multiplexed", ms: 1.2 },
  { host: "web3", medium: "SSH, multiplexed", ms: 1.4 },
  {
    host: "db1",
    medium: "SSH, multiplexed — another region, and it shows",
    ms: 14,
  },
];

export const LINK_MS: Record<string, number> = Object.fromEntries(
  LINKS.map(l => [l.host, l.ms]),
);

/** The groups, as the inventory draws them. */
export const GROUPS: { name: string; members: string[]; note: string }[] = [
  {
    name: "webservers",
    members: ["web1", "web2", "web3"],
    note: "the first play's target",
  },
  { name: "dbservers", members: ["db1"], note: "the second play's target" },
  {
    name: "prod",
    members: ["webservers", "dbservers"],
    note: "a group of groups — `prod:children`",
  },
  {
    name: "all",
    members: ["prod"],
    note: "implicit, and always there; `group_vars/all` is the floor",
  },
];

/* ── how long things take ──────────────────────────────────────────────── */

/**
 * At most this many hosts are worked at once. The default in `ansible.cfg`
 * is 5; it is set to 2 here because three web servers and two forks is the
 * smallest picture of the thing that actually limits a large run, and
 * raising it is the first fix anyone reaches for.
 */
export const FORKS = 2;

/**
 * Real milliseconds a module spends on the target. These are the honest
 * proportions and they are the point: the package manager is two orders of
 * magnitude more expensive than everything the page draws around it.
 */
export const MODULE_MS: Record<string, number> = {
  "setup:web1": 820,
  "setup:web2": 790,
  "setup:web3": 910,
  "setup:db1": 760,
  "install:web1": 2400,
  "install:web2": 310,
  "install:web3": 2600,
  "stat:web1": 40,
  "stat:web2": 40,
  "stat:web3": 45,
  "copy:web1": 200,
  "copy:web2": 220,
  "firewalld:web1": 180,
  "firewalld:web2": 90,
  "service:web1": 420,
  "service:web2": 60,
  "service:web3": 390,
  "reload:web1": 150,
  "reload:web2": 150,
  "createdb:db1": 540,
};

/* ── the playbook ──────────────────────────────────────────────────────── */

export type Seg = {
  t: string;
  k?: "key" | "str" | "num" | "jinja" | "name" | "comment";
};

export type PlaybookLine = {
  segs: Seg[];
  /** the global task index this line belongs to, or null for play scaffolding */
  task: number | null;
  play: number;
  /** a handler's lines are marked, because a handler is not in the task list */
  handler?: boolean;
};

/**
 * A tokeniser for exactly the YAML on this page — enough to colour keys,
 * strings, numbers and Jinja, and no more. Shiki is not reached for because
 * the listing is interactive: every line has to carry a task index so the
 * running play can light its own source.
 */
const tokenise = (line: string): Seg[] => {
  const segs: Seg[] = [];
  const lead = /^(\s*(?:- )?)/.exec(line)![1];
  if (lead) segs.push({ t: lead });
  let rest = line.slice(lead.length);

  if (rest.startsWith("#")) {
    segs.push({ t: rest, k: "comment" });
    return segs;
  }

  const key = /^([A-Za-z_][\w.]*):(\s*)/.exec(rest);
  if (key) {
    segs.push({ t: `${key[1]}:`, k: "key" });
    if (key[2]) segs.push({ t: key[2] });
    rest = rest.slice(key[0].length);
    if (key[1] === "name") {
      if (rest) segs.push({ t: rest, k: "name" });
      return segs;
    }
  }

  if (!rest) return segs;

  /* values: a quoted string, Jinja inside it, a constant, a number, or bare */
  const parts = rest.split(/(\{\{[^}]*\}\})/);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("{{")) {
      segs.push({ t: part, k: "jinja" });
    } else if (/^(true|false|null|yes|no)$/.test(part.trim())) {
      segs.push({ t: part, k: "num" });
    } else if (/^\d+$/.test(part.trim())) {
      segs.push({ t: part, k: "num" });
    } else {
      segs.push({ t: part, k: "str" });
    }
  }
  return segs;
};

export type Task = {
  /** global index, so a line and an event can both point at one task */
  n: number;
  play: number;
  name: string;
  /** the module, fully qualified, as it is written */
  module: string;
  /** why this task is here, in the reader's terms */
  summary: string;
  /** its own YAML, for the listing */
  yaml: string[];
  /** the hosts the play targets */
  hosts: HostId[];
  /** a handler runs at the end of its play, on the hosts that notified it */
  handler?: boolean;
};

export type Play = {
  n: number;
  name: string;
  /** the group the play names */
  target: string;
  hosts: HostId[];
  /** the lines before the first task */
  head: string[];
  summary: string;
};

export const PLAYS: Play[] = [
  {
    n: 0,
    name: "Web tier",
    target: "webservers",
    hosts: ["web1", "web2", "web3"],
    summary:
      "Three hosts, two forks and the default linear strategy — so the play is a column of barriers, and each one is as slow as the slowest host at that row.",
    head: [
      "- name: Web tier",
      "  hosts: webservers",
      "  become: true",
      "  vars:",
      "    nginx_port: 8080",
      "  handlers:",
      "    - name: Reload nginx",
      "      ansible.builtin.service:",
      "        name: nginx",
      "        state: reloaded",
      "  tasks:",
    ],
  },
  {
    n: 1,
    name: "Database",
    target: "dbservers",
    hosts: ["db1"],
    summary:
      "A second play, which is to say: nothing in it begins until the first play's last handler has finished. Plays never overlap, whatever the forks are set to.",
    head: [
      "- name: Database",
      "  hosts: dbservers",
      "  become: true",
      "  tasks:",
    ],
  },
];

export const TASKS: Task[] = [
  {
    n: 0,
    play: 0,
    name: "Gathering Facts",
    module: "ansible.builtin.setup",
    summary:
      "The task nobody writes. Unless `gather_facts: false` is set, every play opens by running the largest module in Ansible against every host to learn ~1,200 facts, most of which no play will read. It is often the most expensive thing in a fast run.",
    yaml: ["    # implicit: gather_facts"],
    hosts: ["web1", "web2", "web3"],
  },
  {
    n: 1,
    play: 0,
    name: "Install nginx",
    module: "ansible.builtin.package",
    summary:
      "`package` is not a package manager; it is a shim that reads `ansible_facts.pkg_mgr` and builds a different module per host. web1 and web2 get dnf, web3 gets apt — one task, two programs.",
    yaml: [
      "    - name: Install nginx",
      "      ansible.builtin.package:",
      "        name: nginx",
      "        state: present",
    ],
    hosts: ["web1", "web2", "web3"],
  },
  {
    n: 2,
    play: 0,
    name: "Write the site config",
    module: "ansible.builtin.template",
    summary:
      "Jinja2 runs on the control node, never on the target. The host is sent a rendered file and has no idea a template existed — which is why `nginx_port` can be a variable at all, and why a host is asked for its checksum before anything is transferred.",
    yaml: [
      "    - name: Write the site config",
      "      ansible.builtin.template:",
      "        src: site.conf.j2",
      "        dest: /etc/nginx/conf.d/site.conf",
      '        mode: "0644"',
      "      notify: Reload nginx",
    ],
    hosts: ["web1", "web2", "web3"],
  },
  {
    n: 3,
    play: 0,
    name: "Open the port",
    module: "ansible.posix.firewalld",
    summary:
      "`when` is evaluated on the control node against facts already in hand. web3 is Debian, so this task is decided before any connection is opened — a skipped task costs one comparison, not a round trip.",
    yaml: [
      "    - name: Open the port",
      "      ansible.posix.firewalld:",
      '        port: "{{ nginx_port }}/tcp"',
      "        permanent: true",
      "        state: enabled",
      '      when: ansible_facts.os_family == "RedHat"',
    ],
    hosts: ["web1", "web2", "web3"],
  },
  {
    n: 4,
    play: 0,
    name: "Start nginx",
    module: "ansible.builtin.service",
    summary:
      "Two independent assertions in one task: running now, and running after a reboot. The module reports `changed` if either of them was not already true, which is how one verdict can hide two actions.",
    yaml: [
      "    - name: Start nginx",
      "      ansible.builtin.service:",
      "        name: nginx",
      "        state: started",
      "        enabled: true",
    ],
    hosts: ["web1", "web2", "web3"],
  },
  {
    n: 5,
    play: 0,
    name: "Reload nginx",
    module: "ansible.builtin.service",
    handler: true,
    summary:
      "Notified three times across the play and run once per host, at the end of it, and only on the hosts whose task actually changed. web3's config was already byte-identical, so web3 never notified and is not in this row.",
    yaml: [
      "    - name: Reload nginx",
      "      ansible.builtin.service:",
      "        name: nginx",
      "        state: reloaded",
    ],
    hosts: ["web1", "web2"],
  },
  {
    n: 6,
    play: 1,
    name: "Gathering Facts",
    module: "ansible.builtin.setup",
    summary:
      "Gathered again, because this is a new play. Fact caching is what stops that; without it, every play pays for the same ~1,200 facts.",
    yaml: ["    # implicit: gather_facts"],
    hosts: ["db1"],
  },
  {
    n: 7,
    play: 1,
    name: "Create the application database",
    module: "community.postgresql.postgresql_db",
    summary:
      "Neither `builtin` nor `posix`: a collection installed from Galaxy and pinned in `requirements.yml`. The fully-qualified name is the whole addressing scheme — namespace, collection, module.",
    yaml: [
      "    - name: Create the application database",
      "      community.postgresql.postgresql_db:",
      "        name: app",
      "        state: present",
      "        encoding: UTF-8",
    ],
    hosts: ["db1"],
  },
];

/** The listing, assembled so that every line knows which task owns it. */
export const PLAYBOOK: PlaybookLine[] = PLAYS.flatMap(play => {
  const lines: PlaybookLine[] = [];
  if (play.n > 0) lines.push({ segs: [], task: null, play: play.n });
  for (const text of play.head) {
    lines.push({ segs: tokenise(text), task: null, play: play.n });
  }
  for (const task of TASKS.filter(t => t.play === play.n && !t.handler)) {
    if (task.n > 0 && lines[lines.length - 1].segs.length) {
      lines.push({ segs: [], task: null, play: play.n });
    }
    for (const text of task.yaml) {
      lines.push({ segs: tokenise(text), task: task.n, play: play.n });
    }
  }
  return lines;
});

/* ── one event: a task, a host, a verdict ──────────────────────────────── */

export type Arg = {
  key: string;
  /** as written in the playbook */
  raw: string;
  /** after Jinja and facts; omitted when it resolved to itself */
  resolved?: string;
  note?: string;
};

export type Stage = {
  name: string;
  /** where the work happens — the distinction the YAML hides */
  where: "control" | "wire" | "target";
  summary: string;
  lines: { text: string; note?: string }[];
};

export type Verdict = "ok" | "changed" | "skipped" | "failed";

export type Event = {
  id: string;
  task: number;
  host: HostId;
  verdict: Verdict;
  /** why that verdict, in one line */
  why: string;
  /** the resolved module — not always the one in the YAML */
  module: string;
  args: Arg[];
  stages: Stage[];
  /** the module's JSON reply, flattened one level */
  ret: { key: string; value: string; note?: string }[];
  /** did this event notify a handler */
  notified?: string;
  /** milliseconds the module spends on the target */
  runMs: number;
};

/** Bytes of Python the control node builds and pipes down the channel. */
const PAYLOAD_KB: Record<string, number> = {
  setup: 161.8,
  dnf: 62.4,
  apt: 71.1,
  stat: 48.2,
  copy: 54.6,
  firewalld: 59.3,
  service: 57.9,
  postgresql_db: 66.7,
};

const SOCKET: Record<HostId, string> = {
  control: "",
  web1: "~/.ansible/cp/0e1f5b2a84",
  web2: "~/.ansible/cp/7c4a1d93f6",
  web3: "~/.ansible/cp/b2f80e6517",
  db1: "~/.ansible/cp/4d9c23a7e1",
};

const hostOf = (id: HostId) => HOSTS.find(h => h.id === id)!;

/**
 * The three stages every real module execution shares, with pipelining on.
 * They are generated rather than written out nineteen times, which is also
 * the only way they stay consistent with the payload sizes and the socket
 * paths above.
 */
const transport = (host: HostId, short: string, become = true): Stage[] => {
  const h = hostOf(host);
  const kb = PAYLOAD_KB[short];
  const inner = become
    ? `sudo -H -S -n -u root /bin/sh -c '${h.python}'`
    : h.python;

  return [
    {
      name: "Build",
      where: "control",
      summary:
        "The module's source, the Python it imports and the resolved arguments are zipped into one self-extracting script. Nothing is installed on the target; the program is the message.",
      lines: [
        {
          text: `AnsiballZ_${short}.py   ${kb.toFixed(1)} KB`,
          note: "the module, module_utils, and the arguments as embedded JSON",
        },
        {
          text: "ANSIBLE_MODULE_ARGS = { … }",
          note: "every Jinja expression is already a literal by this point",
        },
      ],
    },
    {
      name: "Pipe",
      where: "wire",
      summary:
        "With `pipelining = True` there is no temp directory and no SFTP: the script is written to the standard input of an interpreter started over the connection that is already open. One SSH operation for the whole task.",
      lines: [
        {
          text: `ssh -o ControlPath=${SOCKET[host]} deploy@${h.fqdn} \\`,
          note: "no handshake — ControlPersist opened this socket on the first task",
        },
        { text: `    "/bin/sh -c \\"${inner}\\""` },
        {
          text: `  <- AnsiballZ_${short}.py on stdin`,
          note: `${kb.toFixed(1)} KB, once per task per host`,
        },
      ],
    },
    {
      name: "Run",
      where: "target",
      summary:
        "The script unpacks itself into a temporary directory, imports `AnsibleModule`, parses the embedded arguments, does the work and prints exactly one JSON object. Then it deletes itself.",
      lines: [
        { text: `${h.python} -c "import sys; …"`, note: "run as root" },
        {
          text: "AnsibleModule(argument_spec=…)",
          note: "the spec is what validates and type-casts the arguments",
        },
      ],
    },
  ];
};

const verdictStage = (
  verdict: Verdict,
  why: string,
  notified?: string,
): Stage => ({
  name: "Verdict",
  where: "control",
  summary:
    "The control node reads one key. `changed` decides the colour, the recap column and whether a handler is queued — and the module, not the playbook, decides what it holds.",
  lines: [
    { text: `"changed": ${verdict === "changed"}`, note: why },
    ...(notified
      ? [
          {
            text: `notify -> "${notified}"`,
            note: "queued, de-duplicated, and run at the end of the play",
          },
        ]
      : []),
  ],
});

/** The one stage that has no transport at all. */
const skipStage = (expr: string, value: string): Stage => ({
  name: "Evaluate",
  where: "control",
  summary:
    "A `when` is a Jinja expression tested on the control node against facts it already holds. It is false, so there is nothing to build, nothing to send, and no connection to open.",
  lines: [
    { text: expr, note: "evaluated here, not there" },
    { text: `-> ${value}`, note: "the task ends on the control node" },
  ],
});

const RENDERED = [
  "server {",
  "    listen 8080;",
  "    server_name web3.example.net;",
  "    root /srv/app/public;",
  "}",
];

const EVENTS: Event[] = [];

const push = (e: Event) => {
  EVENTS.push(e);
};

/* task 0 and 6 — gather_facts */
for (const host of ["web1", "web2", "web3", "db1"] as HostId[]) {
  const h = hostOf(host);
  const task = host === "db1" ? 6 : 0;
  push({
    id: `t${task}-${host}`,
    task,
    host,
    verdict: "ok",
    why: "`setup` reads; it never writes, so it can never report changed.",
    module: "ansible.builtin.setup",
    args: [
      {
        key: "gather_subset",
        raw: "all",
        note: "narrow this to `!all,!min,network` and the cost falls by most of it",
      },
    ],
    stages: [
      ...transport(host, "setup", false),
      {
        name: "Return",
        where: "wire",
        summary:
          "One JSON object with around twelve hundred keys, every one of which becomes a variable usable in every later task and template on this host.",
        lines: [
          { text: `"ansible_facts": { … 1,207 keys … }` },
          ...h.facts.slice(0, 3).map(f => ({
            text: `"${f.key.replace("ansible_facts.", "")}": "${f.value}"`,
            note: f.note,
          })),
        ],
      },
      verdictStage("ok", "Nothing was written, so nothing changed."),
    ],
    ret: [
      {
        key: "ansible_facts",
        value: "1,207 keys",
        note: "merged into the host's variables for the rest of the run",
      },
      { key: "changed", value: "false" },
    ],
    runMs: MODULE_MS[`setup:${host}`],
  });
}

/* task 1 — install nginx */
const INSTALL: Record<string, [Verdict, string, string, string]> = {
  web1: [
    "changed",
    "dnf",
    "nginx was absent; 1.24.0 and six dependencies were installed.",
    "nginx-1:1.24.0-1.el9.x86_64",
  ],
  web2: [
    "ok",
    "dnf",
    "nginx was already present, so dnf did nothing and said so.",
    "nginx-1:1.24.0-1.el9.x86_64",
  ],
  web3: [
    "changed",
    "apt",
    "A different module entirely: `package` read `pkg_mgr` and built apt.",
    "nginx/1.24.0-2ubuntu7",
  ],
};

for (const host of ["web1", "web2", "web3"] as HostId[]) {
  const [verdict, short, why, pkg] = INSTALL[host];
  push({
    id: `t1-${host}`,
    task: 1,
    host,
    verdict,
    why,
    module: `ansible.builtin.${short}`,
    args: [
      { key: "name", raw: "nginx" },
      {
        key: "state",
        raw: "present",
        note: "present, not latest — `latest` is what makes a run non-idempotent",
      },
    ],
    stages: [
      {
        name: "Resolve",
        where: "control",
        summary:
          "`package` is an action plugin, not a module. It reads a fact gathered a moment ago and picks the real module, so the same line of YAML becomes a different program on each host.",
        lines: [
          { text: "ansible_facts.pkg_mgr", note: `is "${short}" on this host` },
          {
            text: `ansible.builtin.package -> ansible.builtin.${short}`,
            note: "this is why facts are gathered before anything else runs",
          },
        ],
      },
      ...transport(host, short),
      {
        name: "Return",
        where: "wire",
        summary:
          verdict === "changed"
            ? "The package manager's own transaction, summarised — and a `changed` that came from counting what it did, not from the task having run."
            : "A resolved version and nothing else. The module checked, found the assertion already true and stopped.",
        lines:
          verdict === "changed"
            ? [
                { text: `"changed": true` },
                { text: `"results": ["Installed: ${pkg}", …]` },
                { text: `"rc": 0` },
              ]
            : [
                { text: `"changed": false` },
                { text: `"msg": "Nothing to do"` },
                { text: `"rc": 0` },
              ],
      },
      verdictStage(verdict, why),
    ],
    ret: [
      { key: "changed", value: String(verdict === "changed") },
      ...(verdict === "changed"
        ? [{ key: "results", value: `Installed: ${pkg} (+6 deps)` }]
        : [{ key: "msg", value: "Nothing to do" }]),
      { key: "rc", value: "0" },
    ],
    runMs: MODULE_MS[`install:${host}`],
  });
}

/* task 2 — template */
const TEMPLATE: Record<string, [Verdict, string, string, string | undefined]> =
  {
    web1: [
      "changed",
      "d41f0b…",
      "No file existed, so the rendered bytes were copied in.",
      "Reload nginx",
    ],
    web2: [
      "changed",
      "8c2e71…",
      "A file existed and its checksum differed — the port was still 80.",
      "Reload nginx",
    ],
    web3: [
      "ok",
      "a73e5c…",
      "Checksums matched byte for byte, so nothing was transferred and no handler was notified.",
      undefined,
    ],
  };

for (const host of ["web1", "web2", "web3"] as HostId[]) {
  const [verdict, sum, why, notified] = TEMPLATE[host];
  const h = hostOf(host);
  const changed = verdict === "changed";
  push({
    id: `t2-${host}`,
    task: 2,
    host,
    verdict,
    why,
    module: "ansible.builtin.template",
    notified,
    args: [
      { key: "src", raw: "site.conf.j2", note: "a path on the control node" },
      { key: "dest", raw: "/etc/nginx/conf.d/site.conf" },
      { key: "mode", raw: '"0644"', note: "quoted, or YAML reads it as octal" },
      {
        key: "port",
        raw: "{{ nginx_port }}",
        resolved: "8080",
        note: "a play var — rung 12 of the precedence ladder",
      },
      {
        key: "server_name",
        raw: "{{ inventory_hostname }}",
        resolved: h.fqdn,
        note: "the inventory's name for the host, not a fact",
      },
    ],
    stages: [
      {
        name: "Render",
        where: "control",
        summary:
          "The one stage that explains the whole module. Jinja2 runs here, with this host's variables and facts in scope, and produces bytes. The target never sees the template, the variables or Jinja.",
        lines: [
          { text: "site.conf.j2 + vars(web) + facts(host)" },
          ...RENDERED.map(text => ({
            text: `  ${host === "web3" ? text : text.replace("web3", host)}`,
          })),
          {
            text: `sha1 = ${sum}`,
            note: "computed locally, before anything is sent",
          },
        ],
      },
      {
        name: "Compare",
        where: "target",
        summary:
          "A separate module runs first, purely to answer one question: what is the checksum of the file that is already there? That answer is what makes this task idempotent.",
        lines: [
          {
            text: "AnsiballZ_stat.py -> checksum",
            note: "48.2 KB, one round trip",
          },
          {
            text: changed
              ? host === "web1"
                ? '"exists": false'
                : `"checksum": "3f9ab2…"`
              : `"checksum": "${sum}"`,
            note: changed
              ? "different from the rendered bytes, so a transfer is needed"
              : "identical, so the task ends here",
          },
        ],
      },
      ...(changed
        ? [
            ...transport(host, "copy"),
            {
              name: "Return",
              where: "wire" as const,
              summary:
                "`template` reports as `copy`, because by the time anything reached the host that is all it was.",
              lines: [
                { text: `"changed": true` },
                { text: `"dest": "/etc/nginx/conf.d/site.conf"` },
                { text: `"checksum": "${sum}"` },
                { text: `"mode": "0644"` },
              ],
            },
          ]
        : []),
      verdictStage(verdict, why, notified),
    ],
    ret: [
      { key: "changed", value: String(changed) },
      { key: "checksum", value: sum },
      ...(changed
        ? [{ key: "dest", value: "/etc/nginx/conf.d/site.conf" }]
        : [
            {
              key: "msg",
              value: "file already matches",
              note: "and so no handler is notified",
            },
          ]),
    ],
    runMs:
      MODULE_MS[`stat:${host}`] + (changed ? MODULE_MS[`copy:${host}`] : 0),
  });
}

/* task 3 — firewalld */
const FIREWALL: Record<string, [Verdict, string]> = {
  web1: [
    "changed",
    "The port was not in the public zone; it is now — in the zone file only, because `immediate` was not set.",
  ],
  web2: ["ok", "8080/tcp was already enabled in the public zone."],
  web3: [
    "skipped",
    "Debian — the `when` was false, so no connection was opened.",
  ],
};

for (const host of ["web1", "web2", "web3"] as HostId[]) {
  const [verdict, why] = FIREWALL[host];
  const h = hostOf(host);
  const skipped = verdict === "skipped";
  push({
    id: `t3-${host}`,
    task: 3,
    host,
    verdict,
    why,
    module: "ansible.posix.firewalld",
    args: [
      {
        key: "port",
        raw: '"{{ nginx_port }}/tcp"',
        resolved: "8080/tcp",
        note: "the same play var the template used",
      },
      {
        key: "permanent",
        raw: "true",
        note: "written to the zone file; add `immediate: true` to also change the firewall that is running",
      },
      { key: "state", raw: "enabled" },
      {
        key: "when",
        raw: 'ansible_facts.os_family == "RedHat"',
        resolved: String(!skipped),
        note: "not a module argument — a gate, tested on the control node",
      },
    ],
    stages: skipped
      ? [
          skipStage(
            'ansible_facts.os_family == "RedHat"',
            `false  ("${h.facts[1].value}")`,
          ),
          {
            name: "Verdict",
            where: "control",
            summary:
              "A skipped host is still in the play and still in the recap — it simply did nothing. The next task will include it again.",
            lines: [
              { text: `"skipped": true` },
              {
                text: `"skip_reason": "Conditional result was False"`,
                note: "no bytes were sent to this host for this task",
              },
            ],
          },
        ]
      : [
          ...transport(host, "firewalld"),
          {
            name: "Return",
            where: "wire",
            summary:
              verdict === "changed"
                ? "`permanent` writes the zone file and nothing else: the firewall running right now still has no such rule. `immediate: true`, or a reload, is what applies it — and forgetting that is this module's classic trap."
                : "Queried, found, and left alone.",
            lines: [
              { text: `"changed": ${verdict === "changed"}` },
              {
                text: `"msg": "${verdict === "changed" ? "Permanent operation" : "Port 8080/tcp already enabled"}"`,
              },
            ],
          },
          verdictStage(verdict, why),
        ],
    ret: skipped
      ? [
          { key: "skipped", value: "true" },
          { key: "skip_reason", value: "Conditional result was False" },
        ]
      : [
          { key: "changed", value: String(verdict === "changed") },
          {
            key: "msg",
            value:
              verdict === "changed"
                ? "Permanent operation"
                : "Port 8080/tcp already enabled",
          },
        ],
    runMs: skipped ? 0 : MODULE_MS[`firewalld:${host}`],
  });
}

/* task 4 — service */
const SERVICE: Record<string, [Verdict, string, string]> = {
  web1: [
    "changed",
    "It was dead and disabled; now it is running and will come back after a reboot.",
    "started, enabled",
  ],
  web2: ["ok", "Already running, already enabled — both assertions held.", "—"],
  web3: [
    "changed",
    "Running now; the enable was already true, and one half is enough.",
    "started",
  ],
};

for (const host of ["web1", "web2", "web3"] as HostId[]) {
  const [verdict, why, did] = SERVICE[host];
  push({
    id: `t4-${host}`,
    task: 4,
    host,
    verdict,
    why,
    module: "ansible.builtin.service",
    args: [
      { key: "name", raw: "nginx" },
      {
        key: "state",
        raw: "started",
        note: "running now — an assertion, not a command",
      },
      {
        key: "enabled",
        raw: "true",
        note: "running after a reboot — a second, independent assertion",
      },
    ],
    stages: [
      ...transport(host, "service"),
      {
        name: "Return",
        where: "wire",
        summary:
          "One `changed` covering two assertions. The reply says which of them moved; the recap does not, and that is the honest limit of a one-word verdict.",
        lines: [
          { text: `"changed": ${verdict === "changed"}` },
          { text: `"state": "started"` },
          { text: `"enabled": true` },
          ...(did === "—"
            ? []
            : [{ text: `"status": { … }`, note: `moved: ${did}` }]),
        ],
      },
      verdictStage(verdict, why),
    ],
    ret: [
      { key: "changed", value: String(verdict === "changed") },
      { key: "state", value: "started" },
      { key: "enabled", value: "true" },
      ...(did === "—" ? [] : [{ key: "moved", value: did }]),
    ],
    runMs: MODULE_MS[`service:${host}`],
  });
}

/* task 5 — the handler */
for (const host of ["web1", "web2"] as HostId[]) {
  push({
    id: `t5-${host}`,
    task: 5,
    host,
    verdict: "changed",
    why: "A handler that runs reports changed; it was asked to act, and it did.",
    module: "ansible.builtin.service",
    args: [
      { key: "name", raw: "nginx" },
      {
        key: "state",
        raw: "reloaded",
        note: "the one state that is a command rather than an assertion",
      },
    ],
    stages: [
      {
        name: "Flush",
        where: "control",
        summary:
          "The play's tasks are over, so the notification queue is drained — in the order the handlers are DEFINED, not the order they were notified, once per host, however many times it was notified.",
        lines: [
          { text: "RUNNING HANDLER [Reload nginx]" },
          {
            text: "hosts: web1, web2",
            note: "web3's config was identical, so web3 never notified",
          },
        ],
      },
      ...transport(host, "service"),
      {
        name: "Return",
        where: "wire",
        summary:
          "`reloaded` is the exception to the shape of every other module on this page: there is no state to compare, so it always acts and always reports changed.",
        lines: [
          { text: `"changed": true` },
          {
            text: `"name": "nginx"`,
            note: "SIGHUP; the workers are replaced, the socket is not",
          },
        ],
      },
      verdictStage(
        "changed",
        "A reload is an action, so there is nothing to be idempotent about.",
      ),
    ],
    ret: [
      { key: "changed", value: "true" },
      { key: "name", value: "nginx" },
      { key: "state", value: "reloaded" },
    ],
    runMs: MODULE_MS[`reload:${host}`],
  });
}

/* task 7 — the database */
push({
  id: "t7-db1",
  task: 7,
  host: "db1",
  verdict: "changed",
  why: "No database called app existed; one was created with the requested encoding.",
  module: "community.postgresql.postgresql_db",
  args: [
    { key: "name", raw: "app" },
    { key: "state", raw: "present" },
    { key: "encoding", raw: "UTF-8", note: "only honoured at creation time" },
  ],
  stages: [
    {
      name: "Build",
      where: "control",
      summary:
        "A collection module, so the Python comes out of `~/.ansible/collections` rather than the Ansible package — and it needs psycopg2 present on the TARGET, which is the usual first failure with any database module.",
      lines: [
        { text: "AnsiballZ_postgresql_db.py   66.7 KB" },
        {
          text: "requires: psycopg2 on db1",
          note: "module dependencies live on the managed host, not the control node",
        },
      ],
    },
    ...transport("db1", "postgresql_db").slice(1),
    {
      name: "Return",
      where: "wire",
      summary:
        "One round trip, fourteen milliseconds each way. With pipelining off this task would have crossed that link four times instead of once.",
      lines: [
        { text: `"changed": true` },
        { text: `"db": "app"` },
        {
          text: `"executed_commands": ["CREATE DATABASE \\"app\\" ENCODING 'UTF-8'"]`,
        },
      ],
    },
    verdictStage("changed", "The database did not exist and now does."),
  ],
  ret: [
    { key: "changed", value: "true" },
    { key: "db", value: "app" },
    {
      key: "executed_commands",
      value: `CREATE DATABASE "app" ENCODING 'UTF-8'`,
    },
  ],
  runMs: MODULE_MS["createdb:db1"],
});

export { EVENTS };

/* ── the schedule ──────────────────────────────────────────────────────── */

/**
 * One scheduled event, in virtual milliseconds, with the two crossings of
 * the channel either side of the module's own work. A skipped event has
 * `out === back === t0`, because nothing ever left the control node.
 */
export type Slot = {
  event: number;
  task: number;
  host: HostId;
  /** the control node starts on it */
  t0: number;
  /** the payload lands on the target */
  out: number;
  /** the module finishes and the reply starts back */
  back: number;
  /** the reply lands on the control node */
  t1: number;
  /** which of the FORKS worker slots carried it */
  fork: number;
};

/**
 * Built here so that the invariants can be tested rather than asserted:
 * the linear strategy's barrier between tasks, and the fork ceiling on
 * concurrency. Both are visible on the page as gaps, and both are the
 * reason a run takes as long as it does.
 */
const build = (): { slots: Slot[]; end: number } => {
  const slots: Slot[] = [];
  /** when each worker slot is free again */
  const forks = new Array<number>(FORKS).fill(0);
  /** the linear strategy: no task starts before every host finished the last */
  let barrier = 0;

  for (const task of TASKS) {
    let taskEnd = barrier;

    for (const host of task.hosts) {
      const index = EVENTS.findIndex(e => e.task === task.n && e.host === host);
      if (index < 0) continue;
      const event = EVENTS[index];

      /* a skipped task never reaches a worker — it is one comparison */
      if (event.verdict === "skipped") {
        slots.push({
          event: index,
          task: task.n,
          host,
          t0: barrier,
          out: barrier,
          back: barrier,
          t1: barrier + 0.05,
          fork: -1,
        });
        taskEnd = Math.max(taskEnd, barrier + 0.05);
        continue;
      }

      const fork = forks.indexOf(Math.min(...forks));
      const t0 = Math.max(forks[fork], barrier);
      const ms = LINK_MS[host];
      const out = t0 + ms;
      const back = out + event.runMs;
      const t1 = back + ms;

      slots.push({ event: index, task: task.n, host, t0, out, back, t1, fork });
      forks[fork] = t1;
      taskEnd = Math.max(taskEnd, t1);
    }

    barrier = taskEnd;
  }

  return { slots, end: barrier };
};

const built = build();

export const SCHEDULE: Slot[] = built.slots;

/** Virtual milliseconds the whole run takes, plus a beat to read the recap. */
export const RUN_END = built.end + 120;

/* ── the recap ─────────────────────────────────────────────────────────── */

export type RecapRow = {
  host: HostId;
  ok: number;
  changed: number;
  unreachable: number;
  failed: number;
  skipped: number;
  /** when this host's last event landed */
  done: number;
};

/**
 * `PLAY RECAP`, folded out of the events rather than written down — the same
 * discipline as the rest of the page, and the reason the table on screen can
 * fill in as the clock runs.
 */
export const RECAP: RecapRow[] = MANAGED.map(host => {
  const mine = SCHEDULE.filter(s => s.host === host);
  const count = (v: Verdict) =>
    mine.filter(s => EVENTS[s.event].verdict === v).length;
  return {
    host,
    /* Ansible counts a changed task in BOTH columns, which surprises everyone
       exactly once. ok = ran and did not fail. */
    ok: count("ok") + count("changed"),
    changed: count("changed"),
    unreachable: 0,
    failed: 0,
    skipped: count("skipped"),
    done: Math.max(...mine.map(s => s.t1)),
  };
});

/* ── the reference panels ──────────────────────────────────────────────── */

/**
 * The inventory, as a file. Shown rather than described because the shape of
 * the file IS the shape of the variable scope: a group is a directory name
 * under `group_vars`, and nothing more mysterious than that.
 */
export const INVENTORY = `[webservers]
web1.example.net
web2.example.net
web3.example.net

[dbservers]
db1.example.net

[prod:children]
webservers
dbservers

[all:vars]
ansible_user=deploy
ansible_python_interpreter=auto_silent`;

/**
 * The twenty-two rungs, lowest first. Everyone meets this ladder the day a
 * variable has the wrong value and no file seems to be wrong, and the only
 * thing that helps is knowing it is a total order with `-e` on top.
 */
export const PRECEDENCE: { n: number; what: string; note?: string }[] = [
  {
    n: 1,
    what: "command line values",
    note: "`-u deploy`, `-b` — not really variables",
  },
  {
    n: 2,
    what: "role defaults",
    note: "`roles/x/defaults/main.yml` — the floor, and where a role's knobs belong",
  },
  { n: 3, what: "inventory file group vars" },
  { n: 4, what: "inventory `group_vars/all`" },
  { n: 5, what: "playbook `group_vars/all`" },
  { n: 6, what: "inventory `group_vars/*`" },
  {
    n: 7,
    what: "playbook `group_vars/*`",
    note: "a playbook-adjacent file beats the inventory's",
  },
  { n: 8, what: "inventory file host vars" },
  { n: 9, what: "inventory `host_vars/*`" },
  { n: 10, what: "playbook `host_vars/*`", note: "host beats group, always" },
  { n: 11, what: "host facts / cached `set_fact`" },
  { n: 12, what: "play vars", note: "`nginx_port: 8080` on this page" },
  { n: 13, what: "play `vars_prompt`" },
  { n: 14, what: "play `vars_files`" },
  {
    n: 15,
    what: "role vars",
    note: "`roles/x/vars/main.yml` — high, and the usual surprise",
  },
  { n: 16, what: "block vars" },
  { n: 17, what: "task vars" },
  { n: 18, what: "`include_vars`" },
  { n: 19, what: "`set_fact` / registered vars" },
  { n: 20, what: "role and `include_role` params" },
  { n: 21, what: "`include` params" },
  {
    n: 22,
    what: "extra vars",
    note: "`-e` — wins over everything, and cannot be overridden",
  },
];

/** A role is a directory layout, and the layout is the API. */
export const ROLE_TREE: { path: string; depth: number; note?: string }[] = [
  { path: "roles/webserver/", depth: 0 },
  { path: "defaults/main.yml", depth: 1, note: "rung 2 — overridable" },
  { path: "vars/main.yml", depth: 1, note: "rung 15 — hard to override" },
  {
    path: "tasks/main.yml",
    depth: 1,
    note: "the entry point; loaded automatically",
  },
  { path: "handlers/main.yml", depth: 1, note: "what `notify` can name" },
  {
    path: "templates/site.conf.j2",
    depth: 1,
    note: "rendered on the control node",
  },
  { path: "files/", depth: 1, note: "copied verbatim" },
  {
    path: "meta/main.yml",
    depth: 1,
    note: "dependencies and `argument_specs`",
  },
  {
    path: "library/",
    depth: 1,
    note: "custom modules, found without configuration",
  },
];

/**
 * The transport, twice. The round-trip counts are the argument for one line
 * in `ansible.cfg`, and they are why the page models pipelining on.
 */
export const TRANSPORT: {
  mode: string;
  trips: number;
  steps: { text: string; note?: string }[];
}[] = [
  {
    mode: "pipelining = False",
    trips: 4,
    steps: [
      { text: "mkdir -p ~/.ansible/tmp/ansible-tmp-…/", note: "1" },
      { text: "sftp put AnsiballZ_dnf.py", note: "2" },
      { text: "python3 ~/.ansible/tmp/…/AnsiballZ_dnf.py", note: "3" },
      { text: "rm -rf ~/.ansible/tmp/ansible-tmp-…/", note: "4" },
    ],
  },
  {
    mode: "pipelining = True",
    trips: 1,
    steps: [
      {
        text: "python3  <- AnsiballZ_dnf.py on stdin",
        note: "1",
      },
      { text: "the module makes and removes its own temp dir" },
      {
        text: "requires: no `requiretty` in sudoers",
        note: "the one reason it is still off by default",
      },
    ],
  },
];

/** What the four words mean, and what moves between them. */
export const VERDICTS: {
  id: Verdict | "unreachable";
  what: string;
  from: string;
}[] = [
  {
    id: "ok",
    what: "ran, asserted, found nothing to do",
    from: "the module returned `changed: false`",
  },
  {
    id: "changed",
    what: "ran and altered the host",
    from: "the module returned `changed: true` — and a handler may be queued",
  },
  {
    id: "skipped",
    what: "never ran; no connection opened",
    from: "a `when` was false on the control node",
  },
  {
    id: "failed",
    what: "ran and the assertion could not be met",
    from: "the host leaves the play, unless `ignore_errors` or a `rescue` block",
  },
  {
    id: "unreachable",
    what: "could not be reached at all",
    from: "SSH, not the module — the host leaves the play either way",
  },
];

/** `--check` is the whole reason a verdict has to be a prediction. */
export const CHECK_MODE = [
  {
    text: "ansible-playbook site.yml --check --diff",
    note: "every module is asked what it WOULD do",
  },
  {
    text: "changed  = would change",
    note: "the verdict becomes a forecast, which is what makes it reviewable",
  },
  {
    text: "command, shell",
    note: "skipped in check mode unless `check_mode: false` — they cannot predict",
  },
];
