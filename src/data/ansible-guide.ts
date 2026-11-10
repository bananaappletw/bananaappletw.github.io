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
  const shown = tasksAt(step);
  /* Before step 3 there is no file, so there is no `ansible-playbook` run
     and nothing to print. A PLAY RECAP of zeroes would be a lie about a
     command the reader has not typed yet. */
  if (!hosts.length || !shown.length) return [];
  const lines: OutLine[] = [];

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
    lead: "You have four machines. Three of them should run nginx on port 8080, with a config file, an open firewall port, and the service set to start at boot. The fourth needs a database. You could log into each one and do it by hand. Then next month you have to do it again, and remember exactly what you did.",
    keywords: [],
    takeaway:
      "Ansible is that list of steps, written in a file. It runs the list on all four machines for you, and it is safe to run twice.",
  },
  {
    n: 2,
    title: "One host, one module",
    lead: "Start with no file at all. Ansible can run one module on one host straight from the command line. Everything else on this page is this, repeated and written down.",
    shell: [
      {
        text: "ansible -i inventory/hosts.ini web1 -m ansible.builtin.ping",
        note: "check that SSH works and Python is there",
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
        what: "The file that lists your machines and their names. Without it, Ansible does not know what `web1` means.",
      },
      {
        word: "-m",
        what: "The module. A module is one unit of work: `ping`, `package`, `copy`, `service`. About a thousand of them exist.",
      },
      {
        word: "-a",
        what: "The module's arguments. Here they are `key=value` pairs. In a file they are YAML.",
      },
      {
        word: "-b",
        what: "Short for become. Run the module as root, using sudo.",
        without: "Without it you stay the `deploy` user and the install fails.",
      },
    ],
    takeaway:
      "One module, its arguments, and one host. That is the whole unit. You do not install anything on web1 first — Ansible only needs SSH and a Python.",
  },
  {
    n: 3,
    title: "Write it down",
    lead: "Now put it in a file. A task is three things: a name, a module, and the module's arguments. That is what you just typed. A task cannot sit alone in a file, so it goes inside a play. `--limit web1` keeps the run on one machine for now.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1",
        note: "run the file on one host",
      },
    ],
    keywords: [
      {
        word: "- name:",
        what: "A label. It only changes what the output prints. The task still works without it.",
        without:
          "Without it the output shows the module name, which is much harder to read.",
      },
      {
        word: "ansible.builtin.package:",
        what: "The module's full name: namespace, collection, module. `ansible.builtin` comes with Ansible. Others come from Galaxy.",
      },
      {
        word: "state: present",
        what: "This says how the host should end up. It is not a command to run. That difference is what makes the next step work.",
      },
      {
        word: "hosts:",
        what: "Which machines to run on. A task cannot sit alone, so it goes in a play, and the play picks the targets.",
      },
      {
        word: "become:",
        what: "The same as `-b` in step 2. Set it once here and it applies to every task in the play.",
      },
      {
        word: "tasks:",
        what: "Everything below this runs in order, on every host the play picked.",
      },
      {
        word: "Gathering Facts",
        what: "A task you did not write. Every play starts by running `setup` on each host to collect about 1,200 facts about it. Step 7 uses one of them.",
        without:
          "`gather_facts: false` turns it off. Then anything that reads a fact breaks.",
      },
    ],
    output: "one",
    takeaway:
      "A task is a module call with a label, and it lives in a play. The file says the same thing as the command line you used before.",
  },
  {
    n: 4,
    title: "Run it twice",
    lead: "Run the same file again, right away. Nginx is not installed a second time. The module checks the host first, finds nginx already there, and reports `ok` instead of `changed`. This is called idempotent, and it is why you can run Ansible on a schedule, or from CI, without worrying.",
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
        what: "The module changed the host.",
      },
      {
        word: "ok",
        what: "The module ran, checked, and found nothing to do.",
      },
    ],
    takeaway:
      "Idempotent means running it twice does the same as running it once. `state:` modules give you this for free. `shell:` does not.",
  },
  {
    n: 5,
    title: "More than one machine",
    lead: "Remove `--limit`. Nothing in the file changes. It already said `hosts: webservers`, and that one line is what spreads the work across machines. The task you wrote once now runs on three hosts, and comes back with three different answers.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml",
        note: "no --limit: every host in the group",
      },
    ],
    keywords: [
      {
        word: "hosts: webservers",
        what: "A group from the inventory. Ansible expands it to web1, web2 and web3, and runs every task on all of them.",
        without:
          "`--limit` narrows it from the command line, without editing the file. That is what the last two steps did.",
      },
      {
        word: "web2 says ok",
        what: "Same task, same file, different answer. web2 already had nginx. A verdict describes the host, not the task.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "One line picks the machines. The answers differ because the machines differ.",
  },
  {
    n: 6,
    title: "More than one task",
    lead: "Add a second task. Tasks run from top to bottom. Every host finishes a task before any host starts the next one, so the grid grows downward, one row at a time.",
    keywords: [
      {
        word: "state: started",
        what: "Running now.",
      },
      {
        word: "enabled: true",
        what: "Running again after a reboot. These are two separate checks, and one `changed` covers both.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "Tasks run in file order. A play is a stack of task rows, and each row runs on every host.",
  },
  {
    n: 7,
    title: "Hosts differ",
    lead: "web3 runs Debian. The other two run Red Hat. Ansible already knows, because of the facts it gathered. So you can give a task a condition, and put a variable in the file instead of a fixed number.",
    keywords: [
      {
        word: "vars:",
        what: "Names you set once and use below. Here, `nginx_port: 8080`.",
      },
      {
        word: "{{ nginx_port }}",
        what: "Jinja2. It is filled in on YOUR machine, before anything is sent. The host never sees the braces.",
      },
      {
        word: 'mode: "0644"',
        what: "Always put quotes around it. Without them YAML reads `0644` as a number, and the file gets the wrong permissions.",
      },
      {
        word: "when:",
        what: "A condition. Ansible tests it on your machine against the facts. If it is false, the task is skipped and no connection is opened.",
      },
      {
        word: "template:",
        what: "Fills in a `.j2` file on your machine, compares the result with the file on the host, and only sends it if they differ.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "Facts describe the host. Variables describe what you want. `when:` joins the two. One file, three different runs.",
  },
  {
    n: 8,
    title: "Repeat, capture, look",
    lead: "Three things you will use all the time. This file does not need any of them, so they are shown on their own rather than added to `site.yml`.",
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
        what: "Verbosity. `-v` prints each module's JSON reply. `-vv` adds the task's file and line. `-vvv` adds the SSH commands. This is the fastest way to find out why something said `changed`.",
      },
    ],
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
        note: "`item` is the loop variable. The task reports once per item. The whole task counts as `changed` if any item changed.",
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
        note: "`register` saves a module's full JSON reply into a variable. `debug` prints it, and runs on your machine, so it costs nothing. `changed_when: false` stops a read-only command from saying `changed` every time.",
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
        note: "If a task inside `block` fails, Ansible runs `rescue` instead of dropping the host from the play. `always` runs either way.",
      },
    ],
    takeaway:
      "`loop` repeats. `register` saves. `debug` prints. `block` recovers. Add `-v` and you have a way to debug.",
  },
  {
    n: 9,
    title: "React to a change",
    lead: "Nginx needs a reload when its config changes, but only then. A handler is a task that waits. It does nothing until another task notifies it. Then it runs once, at the end of the play.",
    keywords: [
      {
        word: "handlers:",
        what: "Tasks that are written down but do not run yet. They sit next to `tasks:` in the play.",
      },
      {
        word: "notify: Reload nginx",
        what: "Queues the handler by name. It only fires if this task reported `changed`.",
        without:
          "A task that reports `ok` notifies nothing. web3's config already matched, so web3 does not reload.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "A handler runs only when something changed, only once per host, and only at the end of the play — not where you wrote it.",
  },
  {
    n: 10,
    title: "A second play, and running it for real",
    lead: "The database is a different group doing different work, so it gets its own play. Plays always run one after another. That is the whole file. Here is how you set it going.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml",
        note: "run the whole file",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --check --diff",
        note: "change nothing; show what WOULD change, and the diffs",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1",
        note: "run on one host out of the group",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --tags nginx",
        note: "run only the tasks with that tag",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --start-at-task 'Open the port'",
        note: "start again after a failure, without redoing the slow part",
      },
      {
        text: "ansible-doc ansible.builtin.service",
        note: "every argument a module takes, with examples, offline",
      },
    ],
    keywords: [
      {
        word: "--check",
        what: "A dry run. Ansible asks every module what it would do. `command` and `shell` are skipped, because they cannot predict.",
      },
      {
        word: "--limit",
        what: "Picks fewer hosts, without editing the inventory. Reach for this first when something goes wrong.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "That is the file the rest of this page runs. Below, it stops being text and becomes nineteen modules crossing four SSH connections.",
  },
];

/** the last step, so the page and the tests agree on where the guide ends */
export const LAST_STEP = STEPS[STEPS.length - 1].n;

/** every host the guide ever names, in the order it meets them */
export const GUIDE_HOSTS = HOSTS.filter(h => h.id !== "control").map(h => h.id);
