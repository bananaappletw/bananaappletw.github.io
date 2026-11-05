/**
 * The guide behind `/ansible` — Ansible in ten steps, built rather than
 * listed.
 *
 * The page this sits on top of used to open on its own conclusion: a
 * finished playbook, a schedule, and a speed-run over fork counts. All of
 * that is true and none of it is where anyone starts. A reader who has
 * never written a task cannot be taught that `strategy: free` drops a
 * barrier, because they do not yet know what a task is.
 *
 * ── the mechanic ─────────────────────────────────────────────────────────
 *
 * One file is written in front of the reader. Every line of `site.yml`
 * knows which step it arrives at, so descending the page adds lines to a
 * pane that stays in view, and the lines that just arrived are lit. The
 * last step leaves exactly the file the rest of the page simulates —
 * `tests/ansible-guide.test.ts` asserts that, because a guide that ends
 * somewhere other than where the next part begins is a guide to nothing.
 *
 * ── what each step is allowed to be ──────────────────────────────────────
 *
 * One idea, used immediately, with the thing Ansible actually prints when
 * you try it. The terminal output is generated from the same events the
 * simulation runs on, so the `changed` a reader is shown at step 4 is the
 * `changed` they will watch cross a wire at Part II.
 *
 * Two steps add no lines at all. Step 4 runs the same file twice, which is
 * the whole of idempotency and needs no new syntax; step 8 shows `loop`,
 * `register` and `debug` as things you reach for rather than things this
 * file wants. Pretending otherwise would put a `debug` task in a playbook
 * that has no use for one, and a guide that teaches you to write code you
 * would delete is worse than a guide that says "not here".
 */

import {
  EVENTS,
  HOSTS,
  PLAYBOOK,
  PLAYS,
  TASKS,
  type HostId,
  type Part,
  type PlaybookLine,
  type Verdict,
} from "./ansible-run";

/* ── when each piece of the file arrives ───────────────────────────────── */

/**
 * The step at which each task's lines join `site.yml`.
 *
 * Note what is NOT here: a step where a bare task exists without a play.
 * A task cannot be written down on its own — the minimal playbook is a
 * play with one task in it — so the play arrives with the file at step 3,
 * and the fan-out is taught at step 5 by dropping `--limit web1` rather
 * than by editing a line. The file only ever grows.
 */
export const TASK_STEP: Record<number, number> = {
  0: 3, // Gathering Facts — implicit, and printed from the very first run
  1: 3, // Install nginx — the first thing written down
  2: 7, // Write the site config — needs vars and templates first
  3: 7, // Open the port — the conditional arrives with the facts
  4: 6, // Start nginx — the second task, which is what teaches order
  5: 9, // Reload nginx — the handler
  6: 10, // Gathering Facts, play two
  7: 10, // Create the application database
};

/** the step at which each play's scaffolding arrives, by part */
const PART_STEP: Record<number, Partial<Record<Part, number>>> = {
  0: { play: 3, vars: 7, handlers: 9, blank: 3 },
  1: { play: 10, blank: 10 },
};

/** the step at which one line of the finished file first appears */
export const stepOfLine = (line: PlaybookLine): number => {
  if (line.task !== null) return TASK_STEP[line.task] ?? 10;
  return PART_STEP[line.play]?.[line.part] ?? 10;
};

/** The file as it stands at a given step, with the new lines marked. */
export type GuideLine = {
  segs: PlaybookLine["segs"];
  task: number | null;
  /** true when the line arrived at the step being shown */
  fresh: boolean;
};

export const fileAt = (step: number): GuideLine[] =>
  PLAYBOOK.filter(line => stepOfLine(line) <= step).map(line => ({
    segs: line.segs,
    task: line.task,
    fresh: stepOfLine(line) === step,
  }));

/** which tasks are in the file at a given step, in file order */
export const tasksAt = (step: number) =>
  TASKS.filter(t => (TASK_STEP[t.n] ?? 10) <= step);

/**
 * Which hosts the run covers at a given step. The guide starts against one
 * machine on purpose: a reader who has only ever seen a fan-out never finds
 * out that the fan-out is the easy part.
 */
export const HOSTS_AT: Record<number, HostId[]> = {
  1: [],
  2: ["web1"],
  3: ["web1"],
  4: ["web1"],
  5: ["web1", "web2", "web3"],
  6: ["web1", "web2", "web3"],
  7: ["web1", "web2", "web3"],
  8: ["web1", "web2", "web3"],
  9: ["web1", "web2", "web3"],
  10: ["web1", "web2", "web3", "db1"],
};

/* ── what Ansible prints ───────────────────────────────────────────────── */

/**
 * The output pane, generated from the same events the simulation runs on.
 * This is the thing the page was most conspicuously missing: a reader who
 * has never seen `ok: [web1]` in green and `changed: [web1]` in yellow does
 * not know what they are looking for when they run it themselves.
 */
export type OutLine = {
  text: string;
  kind:
    | "play"
    | "task"
    | "ok"
    | "changed"
    | "skipped"
    | "failed"
    | "recap"
    | "blank";
  host?: HostId;
};

const bar = (label: string, width = 46) => {
  const head = `${label} `;
  return head + "*".repeat(Math.max(3, width - head.length));
};

/**
 * One run of the file as it stands at `step`. `second` renders the rerun —
 * every task that changed the first time reports `ok` instead, which is the
 * single most important thing a beginner can be shown and costs one flag.
 */
export const outputAt = (step: number, second = false): OutLine[] => {
  const hosts = HOSTS_AT[step] ?? [];
  if (!hosts.length) return [];
  const lines: OutLine[] = [];
  const shown = tasksAt(step);

  for (const play of PLAYS) {
    const mine = shown.filter(t => t.play === play.n && !t.handler);
    const playHosts = hosts.filter(h => play.hosts.includes(h));
    if (!mine.length || !playHosts.length) continue;

    lines.push({ text: bar(`PLAY [${play.name}]`), kind: "play" });
    lines.push({ text: "", kind: "blank" });

    for (const task of mine) {
      lines.push({ text: bar(`TASK [${task.name}]`), kind: "task" });
      for (const host of playHosts) {
        if (!task.hosts.includes(host)) continue;
        const e = EVENTS.find(x => x.task === task.n && x.host === host);
        if (!e) continue;
        /* A rerun finds the host already in the state the first run left
           it in, so nothing changes and nothing is skipped differently. */
        const verdict: Verdict =
          second && e.verdict === "changed" ? "ok" : e.verdict;
        lines.push({
          text:
            verdict === "skipped"
              ? `skipping: [${host}]`
              : `${verdict}: [${host}]`,
          kind: verdict === "changed" ? "changed" : verdict,
          host,
        });
      }
      lines.push({ text: "", kind: "blank" });
    }

    /* Handlers print their own banner, and only for the hosts that
       notified them — which the output makes obvious and prose does not. */
    const handlers = shown.filter(t => t.play === play.n && t.handler);
    for (const handler of handlers) {
      const notified = second
        ? []
        : handler.hosts.filter(h => playHosts.includes(h));
      if (!notified.length) continue;
      lines.push({
        text: bar(`RUNNING HANDLER [${handler.name}]`),
        kind: "task",
      });
      for (const host of notified) {
        lines.push({ text: `changed: [${host}]`, kind: "changed", host });
      }
      lines.push({ text: "", kind: "blank" });
    }
  }

  lines.push({ text: bar("PLAY RECAP"), kind: "play" });
  for (const host of hosts) {
    /* A rerun changes nothing, so no task notifies and the handler does not
       run at all — it is absent from the rerun's recap rather than ok. */
    const mine = shown.filter(
      t => t.hosts.includes(host) && !(second && t.handler),
    );
    const verdicts = mine
      .map(t => EVENTS.find(e => e.task === t.n && e.host === host))
      .filter((e): e is NonNullable<typeof e> => Boolean(e))
      .map(e => (second && e.verdict === "changed" ? "ok" : e.verdict));
    const count = (v: string) => verdicts.filter(x => x === v).length;
    /* Ansible counts a changed task in BOTH columns: ok means ran and did
       not fail. Everyone discovers this once, by being confused by it. */
    const ok = count("ok") + count("changed");
    lines.push({
      text:
        `${host.padEnd(8)}: ` +
        `ok=${ok}`.padEnd(8) +
        `changed=${count("changed")}`.padEnd(13) +
        "unreachable=0".padEnd(16) +
        "failed=0".padEnd(11) +
        `skipped=${count("skipped")}`,
      kind: "recap",
      host,
    });
  }
  return lines;
};

/* ── the steps ─────────────────────────────────────────────────────────── */

/** a line of a shell transcript, with what it means */
export type Shell = { text: string; note?: string; out?: boolean };

/** a small worked example that does NOT join site.yml */
export type Inset = {
  title: string;
  yaml: string[];
  out: string[];
  note: string;
};

export type Keyword = {
  word: string;
  what: string;
  /** what happens if you leave it out — usually the clearer half */
  without?: string;
};

export type Step = {
  n: number;
  title: string;
  /** the one idea, in the reader's terms */
  lead: string;
  /** the command, where this step is run rather than written */
  shell?: Shell[];
  /** the keywords this step introduces, explained where they appear */
  keywords?: Keyword[];
  /** worked examples that are techniques rather than file content */
  insets?: Inset[];
  /** show the generated output, and whether to show the rerun beside it */
  output?: "one" | "twice" | false;
  /** show the task-by-host grid */
  grid?: boolean;
  /** the sentence the reader should leave with */
  takeaway: string;
};

export const STEPS: Step[] = [
  {
    n: 1,
    title: "The problem",
    lead: "Four machines. Three of them should be serving nginx on port 8080, with a config you can read, a firewall rule, and the service enabled at boot. The fourth needs a database. You could open four terminals — and then do it again next month, from memory, hoping you remember which of the four you already did.",
    keywords: [],
    takeaway:
      "Ansible is that list written down, in a form a machine can carry out against all four — and safely carry out twice.",
  },
  {
    n: 2,
    title: "One host, one module",
    lead: "Start with no file at all. Ansible can run a single module against a single host from the command line, and everything else on this page is that, repeated and written down.",
    shell: [
      {
        text: "ansible -i inventory/hosts.ini web1 -m ansible.builtin.ping",
        note: "does SSH work, and is there a Python at the other end",
      },
      { text: 'web1 | SUCCESS => {"ping": "pong"}', out: true },
      { text: "", out: true },
      {
        text: "ansible -i inventory/hosts.ini web1 \\\n    -m ansible.builtin.package -a 'name=nginx state=present' -b",
        note: "install nginx, as root",
      },
      { text: "web1 | CHANGED => { … }", out: true },
    ],
    keywords: [
      {
        word: "-i inventory/hosts.ini",
        what: "the file that says which machines exist and what they are called. Without it Ansible has no idea what `web1` means.",
      },
      {
        word: "-m",
        what: "the module: the unit of work. `ping`, `package`, `copy`, `service` — around a thousand of them ship in collections.",
      },
      {
        word: "-a",
        what: "the module's arguments, as `key=value` pairs here and as YAML everywhere else.",
      },
      {
        word: "-b",
        what: "become: run it as root, via sudo.",
        without: "Without it you are the `deploy` user and the install fails.",
      },
    ],
    takeaway:
      "A module plus its arguments plus a host is the whole unit. Nothing is installed on web1 to make this work — Ansible speaks SSH and Python.",
  },
  {
    n: 3,
    title: "Write it down",
    lead: "The same thing, in a file. A TASK is a name, a module and the module's arguments — the three things you just typed, one per line. A task cannot stand alone, so it arrives wrapped in a PLAY, and `--limit web1` keeps it to the one machine for now.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1",
        note: "the file, against one host",
      },
    ],
    keywords: [
      {
        word: "- name:",
        what: "a label. It is what the output prints and nothing else; the task works without it.",
        without:
          "Without it the output prints the module name, and a run becomes much harder to read.",
      },
      {
        word: "ansible.builtin.package:",
        what: "the module, fully qualified — namespace, collection, module. `ansible.builtin` ships with Ansible; others come from Galaxy.",
      },
      {
        word: "state: present",
        what: "an assertion about how the host should end up, not a command to run. This is the difference that makes the next step possible.",
      },
      {
        word: "hosts:",
        what: "which machines. A task cannot stand on its own, so it arrives inside a play, and the play names its targets.",
      },
      {
        word: "become:",
        what: "the `-b` from step 2, set once for every task in the play instead of per command.",
      },
      {
        word: "tasks:",
        what: "everything below here runs, in order, against every host the play named.",
      },
      {
        word: "Gathering Facts",
        what: "a task you did not write. Every play opens by running `setup` against each host to learn ~1,200 facts about it. Step 7 is where that pays off.",
        without:
          "`gather_facts: false` turns it off — and anything reading a fact then breaks.",
      },
    ],
    output: "one",
    takeaway:
      "A task is a module call with a label, and it lives in a play. The YAML maps one-to-one onto the command line you just used.",
  },
  {
    n: 4,
    title: "Run it twice",
    lead: "Run the same file again, immediately. Nothing is installed a second time — the module looks at the host, finds nginx already present, and says so. That property has a name, and it is the reason Ansible is safe to run on a schedule, from CI, or by someone who does not know what the last person did.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1",
        note: "the same command, a second time",
      },
    ],
    output: "twice",
    keywords: [
      {
        word: "changed",
        what: "the module altered the host.",
      },
      {
        word: "ok",
        what: "the module ran, checked, and found there was nothing to do.",
      },
    ],
    takeaway:
      "Idempotent: running it twice is the same as running it once. You get that free from `state:` modules and lose it the moment you reach for `shell:`.",
  },
  {
    n: 5,
    title: "More than one machine",
    lead: "Drop the `--limit`. Nothing in the file changes — it already said `hosts: webservers`, and that one line is the fan-out. The task you wrote once now runs against three machines and comes back with three different answers.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml",
        note: "no --limit: every host in the group",
      },
    ],
    keywords: [
      {
        word: "hosts: webservers",
        what: "a group from the inventory. Ansible expands it to web1, web2 and web3 and runs every task against all of them.",
        without:
          "`--limit` narrows it at the command line without editing the file, which is what the last two steps were doing.",
      },
      {
        word: "web2 says ok",
        what: "the same task, the same file, a different answer — because web2 already had nginx. A verdict describes the host, not the task.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "Play = hosts + tasks. The same task, the same file, three machines — and three different answers, because web2 already had nginx.",
  },
  {
    n: 6,
    title: "More than one task",
    lead: "Add a second task. Tasks run top to bottom, and every host finishes a task before any host starts the next — so the grid grows downwards, a row at a time.",
    keywords: [
      {
        word: "state: started",
        what: "running now.",
      },
      {
        word: "enabled: true",
        what: "running after a reboot. Two independent assertions in one task, and one `changed` covering both.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "Order is the file's order. A play is a column of task rows, each run against every host.",
  },
  {
    n: 7,
    title: "Hosts differ",
    lead: "web3 is Debian; the other two are Red Hat. Ansible already knows, because of the facts it gathered — so a task can be given a condition, and a file can be given a variable instead of a number.",
    keywords: [
      {
        word: "vars:",
        what: "names you set once and use everywhere below. `nginx_port: 8080`.",
      },
      {
        word: "{{ nginx_port }}",
        what: "Jinja2. It is rendered on YOUR machine, before anything is sent — the host never sees the braces.",
      },
      {
        word: 'mode: "0644"',
        what: "quoted, always. Unquoted, YAML reads `0644` as an octal number and the file lands with the wrong permissions.",
      },
      {
        word: "when:",
        what: "a condition, tested on your machine against the facts. False means the task is skipped and no connection is opened at all.",
      },
      {
        word: "template:",
        what: "renders a `.j2` file locally, compares it with what is on the host, and transfers only if they differ.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "Facts describe the host; variables describe your intent; `when` joins them. One file, three different runs.",
  },
  {
    n: 8,
    title: "Repeat, capture, look",
    lead: "Three things you will reach for constantly, none of which this particular file needs. They are shown here as they are used, not folded into `site.yml` — a guide that teaches you to write code you would delete is worse than one that says not here.",
    insets: [
      {
        title: "loop — one task, many items",
        yaml: [
          "- name: Install the tools",
          "  ansible.builtin.package:",
          '    name: "{{ item }}"',
          "    state: present",
          "  loop:",
          "    - nginx",
          "    - curl",
          "    - jq",
        ],
        out: [
          "TASK [Install the tools] ****************",
          "changed: [web1] => (item=nginx)",
          "ok: [web1] => (item=curl)",
          "changed: [web1] => (item=jq)",
        ],
        note: "`item` is the loop variable. The task reports once per item, and the task as a whole is `changed` if any item was.",
      },
      {
        title: "register + debug — see what came back",
        yaml: [
          "- name: Check the config",
          "  ansible.builtin.command: nginx -t",
          "  register: result",
          "  changed_when: false",
          "",
          "- name: Show it",
          "  ansible.builtin.debug:",
          "    var: result.stdout",
        ],
        out: [
          "TASK [Show it] **************************",
          "ok: [web1] => {",
          '    "result.stdout": "syntax is ok"',
          "}",
        ],
        note: "`register` captures a module's whole JSON reply into a variable. `debug` prints it — and runs on your machine, so it costs nothing. `changed_when: false` stops a read-only command reporting `changed` every time.",
      },
      {
        title: "block — group, and recover",
        yaml: [
          "- name: Try the fast path",
          "  block:",
          "    - ansible.builtin.command: /usr/local/bin/fastpath",
          "  rescue:",
          "    - ansible.builtin.command: /usr/local/bin/slowpath",
          "  always:",
          "    - ansible.builtin.file:",
          "        path: /tmp/lock",
          "        state: absent",
        ],
        out: [
          "TASK [command] **************************",
          "fatal: [web1]: FAILED! => { … }",
          "",
          "TASK [command] **************************",
          "changed: [web1]",
        ],
        note: "A failure inside `block` jumps to `rescue` instead of removing the host from the play. `always` runs either way.",
      },
    ],
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1 -v",
        note: "the same run, with every module's reply printed",
      },
      {
        text: 'changed: [web1] => {"changed": true, "rc": 0, "results": [...]}',
        out: true,
      },
    ],
    keywords: [
      {
        word: "-v",
        what: "verbosity. `-v` prints each module's JSON reply, `-vv` adds the task's file and line, `-vvv` adds the SSH commands themselves. This is the fastest way to find out why something said `changed`.",
      },
    ],
    takeaway:
      "`loop` repeats, `register` captures, `debug` shows, `block` recovers. With `-v` these are the whole debugging loop.",
  },
  {
    n: 9,
    title: "React to a change",
    lead: "nginx needs reloading when its config changes — and only then. A HANDLER is a task that does nothing until something notifies it, and then runs once, at the end of the play.",
    keywords: [
      {
        word: "handlers:",
        what: "tasks defined but not run. They sit in the play alongside `tasks:`.",
      },
      {
        word: "notify: Reload nginx",
        what: "queues the handler by name — but only if this task reported `changed`.",
        without:
          "An `ok` task notifies nothing. That is why web3, whose config already matched, does not reload.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "Notified on `changed`, de-duplicated, and flushed at the end of the play — not where you wrote it.",
  },
  {
    n: 10,
    title: "A second play, and running it for real",
    lead: "The database is a different group with different work, so it is a different play. Plays run one after another, always. That is the whole file — and this is how you actually set it going.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml",
        note: "the whole thing",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --check --diff",
        note: "change nothing; report what WOULD change, and show the diffs",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1",
        note: "one host out of the group",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --tags nginx",
        note: "only tasks carrying that tag",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --start-at-task 'Open the port'",
        note: "resume after a failure, without redoing the slow part",
      },
      {
        text: "ansible-doc ansible.builtin.service",
        note: "every argument the module takes, with examples, offline",
      },
    ],
    keywords: [
      {
        word: "--check",
        what: "dry run. Every module is asked what it would do. `command` and `shell` are skipped, because they cannot predict.",
      },
      {
        word: "--limit",
        what: "narrows the hosts without editing the inventory. The first thing to reach for when something goes wrong.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "That is the file the rest of this page runs. Below, it stops being source and starts being nineteen modules crossing four SSH connections.",
  },
];

/** the last step, so the page and the tests agree on where the guide ends */
export const LAST_STEP = STEPS[STEPS.length - 1].n;

/** every host the guide ever names, in the order it meets them */
export const GUIDE_HOSTS = HOSTS.filter(h => h.id !== "control").map(h => h.id);
