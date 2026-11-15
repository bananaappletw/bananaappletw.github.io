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
  /* The last three steps add nothing to `site.yml` — they are techniques
     the file has no use for — so the run behind them is the finished one. */
  11: ["web1", "web2", "web3", "db1"],
  12: ["web1", "web2", "web3", "db1"],
  13: ["web1", "web2", "web3", "db1"],
  14: ["web1", "web2", "web3", "db1"],
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
        /* Seven columns, because that is what Ansible prints. The page
           teaches `rescue:` and `ignore_errors` and used to show a recap
           with no way to report either of them. */
        `${host.padEnd(8)}: ` +
        `ok=${ok}`.padEnd(7) +
        `changed=${count("changed")}`.padEnd(11) +
        "unreachable=0".padEnd(15) +
        "failed=0".padEnd(10) +
        `skipped=${count("skipped")}`.padEnd(11) +
        "rescued=0".padEnd(11) +
        "ignored=0",
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
    lead: "Start with no file at all. Ansible can run one module on one host straight from the command line — this is called an AD HOC command, and everything else on this page is this, repeated and written down.",
    shell: [
      {
        text: "pipx install --include-deps ansible",
        note: "on your machine only; the hosts get nothing installed",
      },
      {
        text: "# or apt install ansible / dnf install ansible",
        note: "a plain `pip install` now fails on most Linux (PEP 668)",
        out: true,
      },
      {
        text: "ssh-copy-id deploy@web1.example.net",
        note: "your key on the host, and its key in your known_hosts",
      },
      { text: "", out: true },
      {
        text: "ansible -i inventory/hosts.ini web1 -m ansible.builtin.ping",
        note: "check that SSH works and Python is there",
      },
      { text: 'web1 | SUCCESS => {"ping": "pong"}', out: true },
      { text: "", out: true },
      {
        text: "ansible -i inventory/hosts.ini web1 \\\n    -m ansible.builtin.package -a 'name=nginx state=present' -b -K",
        note: "install nginx, as root, asking for the sudo password",
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
        what: "The module. A module is one unit of work: `ping`, `package`, `copy`, `service`. About ninety ship in `ansible.builtin`, and several thousand more across the collections.",
      },
      {
        word: "-a",
        what: "The module's arguments. Here they are `key=value` pairs. In a file they are YAML.",
      },
      {
        word: "plugins",
        what: "A module runs on the target. A PLUGIN runs on the control node and extends Ansible itself. You meet several on this page without the name: an ACTION plugin, which is what `package` and `template` really are, doing work locally before any module is sent; filter, test and lookup plugins inside templates; inventory plugins that build the host list; connection and strategy plugins. `ansible-doc -t lookup -l` lists one kind.",
      },
      {
        word: "-b",
        what: "Short for become. Run the module as root, using sudo.",
        without: "Without it you stay the `deploy` user and the install fails.",
      },
      {
        word: "-K",
        what: "Ask for the sudo password, once, at the start. If your sudo is not passwordless, every `-b` task fails with `Missing sudo password` until you add this — which is the most common first run failure there is. `become_user:` changes who you become; `become_method:` changes how.",
      },
    ],
    takeaway:
      "One module, its arguments, and one host. That is the whole unit. You do not install anything on web1 first — Ansible only needs SSH and a Python.",
  },
  {
    n: 3,
    title: "Write it down",
    lead: "Now put it in a file. That file is a PLAYBOOK, and it holds the whole hierarchy: a playbook is a list of plays, a play is a group of hosts plus a list of tasks, and a task is one module with its arguments. That is what you just typed on the command line, written down.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1",
        note: "run the file on one host",
      },
    ],
    keywords: [
      {
        word: "the YAML itself",
        what: "Two shapes, and that is nearly all of it. A line starting `- ` is an item in a LIST; `key: value` is an entry in a DICTIONARY. Indentation says what belongs to what, with spaces only — a tab is a syntax error. Most first playbooks fail on YAML, not on Ansible.",
        without:
          "`ansible-playbook --syntax-check` catches those before anything connects to anything.",
      },
      {
        word: "- name:",
        what: "A label. Mostly it is what the output prints — but it is also the name `notify:` looks for and the one `--start-at-task` matches, so by step 9 it is load-bearing.",
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
        what: "A task you did not write. Every play starts by running `setup` on each host to collect about 1,200 facts about it. Step 7 uses one. To see the rest: `ansible -i inventory/hosts.ini web1 -m setup`, or `-a 'filter=ansible_os*'` to narrow it.",
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
      "Idempotent means running it twice does the same as running it once. Most `state:` values give you this — but not all: `state: reloaded` and `restarted` always act, and so always report `changed`. `command` and `shell` never give it to you at all.",
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
      {
        word: "patterns",
        what: "`hosts:` and `--limit` both take a pattern, not only a group name: a wildcard, a union, a difference, an intersection.",
      },
    ],
    insets: [
      {
        title: "patterns — the ways to name hosts",
        yaml: [
          "all                   every host in the inventory",
          "webservers            one group",
          "web1,db1              a list",
          "web*                  a wildcard",
          "webservers:dbservers  both groups, a union",
          "webservers:!web3      the group, except web3",
          "webservers:&prod      only those in both",
          "~web[1-2]             a regular expression",
        ],
        out: [
          "$ ansible-playbook site.yml --limit 'webservers:!web3'",
          "",
          "PLAY [Web tier] *************************",
          "ok: [web1]",
          "ok: [web2]",
        ],
        note: "Quote any pattern with `!` or `&` in it, or the shell eats it before Ansible sees it. `--list-hosts` prints who a pattern matches without running anything.",
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
        word: "| default",
        what: "A Jinja filter. `{{ app_root | default('/srv/app') }}` uses the variable if it is set, and that value if it is not. There are hundreds more: `| length`, `| join`, `| to_json`, `| b64encode`.",
        without:
          "Without it, reading a variable nobody set fails the task with `undefined variable`.",
      },
      {
        word: "is defined",
        what: "A Jinja test, used in `when:`. `when: cert is defined`, `when: result is succeeded`, `when: path is file`. A test asks a question; a filter changes a value.",
      },
      {
        word: "inventory_hostname",
        what: "A magic variable — one Ansible sets itself. `inventory_hostname` is this host's name in the inventory, `groups` holds every group and its members, and `hostvars` reaches another host's variables.",
      },
      {
        word: "lookup()",
        what: "Reads something from YOUR machine while the template renders: `lookup('file', 'tls.key')`, `lookup('env', 'HOME')`, `lookup('password', ...)`.",
      },
      {
        word: 'mode: "0644"',
        what: "Always put quotes around it. YAML reads a bare `0644` as octal, which happens to be right, and a bare `644` as the decimal number 644 — which is `0o1204`, a different mode with a sticky bit on it. Quoting is the only form that cannot be misread.",
      },
      {
        word: "when:",
        what: "A condition, tested on your machine against the facts. If it is false the task is skipped, with no connection opened at all.",
        without:
          "Do NOT write `when: \"{{ x }} == 'y'\"`. A `when:` is ALREADY a Jinja expression, so the braces are a second layer and the comparison breaks. Bare names: `when: x == 'y'`. This is the commonest mistake there is with conditionals.",
      },
      {
        word: "template:",
        what: "Fills in a `.j2` file on your machine, compares the result with the file on the host, and only sends it if they differ.",
      },
    ],
    insets: [
      {
        title: "inside site.conf.j2",
        yaml: [
          "server {",
          "    listen {{ nginx_port }};",
          "    server_name {{ inventory_hostname }};",
          "    root {{ app_root | default('/srv/app') }};",
          "",
          "{% if ansible_facts.os_family == 'Debian' %}",
          "    include /etc/nginx/mime.types;",
          "{% endif %}",
          "",
          "{% for host in groups['webservers'] %}",
          "    # peer {{ hostvars[host].ansible_facts.default_ipv4.address }}",
          "{% endfor %}",
          "}",
        ],
        out: [
          "# rendered for web3, which is Debian",
          "server {",
          "    listen 8080;",
          "    server_name web3;",
          "    root /srv/app;",
          "",
          "    include /etc/nginx/mime.types;",
          "",
          "    # peer 10.4.0.11",
          "    # peer 10.4.0.12",
          "    # peer 10.4.0.13",
          "}",
        ],
        note: "`{{ }}` inserts a value. `{% %}` is logic: the tag prints nothing, but what is inside it does — the three peer lines come from one `{% for %}`, and the `include` appears only because web3 is Debian. `| default(...)` is the filter you will use most: `app_root` is set nowhere on this page, so without it this template would fail the task with `undefined variable` instead of falling back.",
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
      {
        word: "environment:",
        what: "Environment variables for the task's own process on the target: `http_proxy`, `PATH`, `JAVA_HOME`. It does not change the host's login shell, only this one command.",
      },
      {
        word: "creates:",
        what: "The simplest way to make `command` and `shell` idempotent. `creates: /path` skips the task if that path exists; `removes:` skips it if it does not. `changed_when:` is the other way, and writing a command that is safe to repeat is the best way.",
      },
      {
        word: "loop_control:",
        what: 'Tidies a loop. `label: "{{ item.name }}"` stops the output printing a whole dictionary per item, and `loop_var:` renames `item` so nested loops do not collide.',
      },
      {
        word: "set_fact",
        what: "Makes a new variable during the run, from anything you already have. `register` captures what a module returned; `set_fact` computes a value yourself.",
        without:
          "It lasts for the rest of the RUN, not just the play — it is written into the host's facts, so a later play sees it. `cacheable: true` goes further and puts it in the fact cache, where the next run will find it. It sits near the top of the precedence list, so it beats almost anything you set in a file.",
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
          "",
          "- name: Add the users",
          "  ansible.builtin.user:",
          '    name: "{{ item.name }}"',
          '    groups: "{{ item.groups }}"',
          '  loop: "{{ app_users }}"',
          "  loop_control:",
          '    label: "{{ item.name }}"',
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
          "  environment:",
          '    PATH: "/usr/local/sbin:{{ ansible_env.PATH }}"',
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
        title: "set_fact — work a value out yourself",
        yaml: [
          "- name: Decide where the app lives",
          "  ansible.builtin.set_fact:",
          '    app_root: "/srv/{{ app_name }}-{{ release }}"',
          "    is_rhel: \"{{ ansible_facts.os_family == 'RedHat' }}\"",
          "",
          "- name: Use it",
          "  ansible.builtin.file:",
          '    path: "{{ app_root }}"',
          "    state: directory",
        ],
        out: [
          "TASK [Decide where the app lives] *******",
          "ok: [web1]",
          "",
          "TASK [Use it] ***************************",
          "changed: [web1]",
        ],
        note: "`set_fact` never reports `changed`, because it does nothing to the host. The variable lives for the rest of the run on that host — later plays see it too, which is not true of `vars:`.",
      },
      {
        title: "command and shell — the escape hatch, and its price",
        yaml: [
          "- name: command — no shell, no pipes, safest",
          "  ansible.builtin.command: /srv/app/migrate --once",
          "  args:",
          "    creates: /srv/app/.migrated",
          "",
          "- name: shell — only when you need a pipe or a redirect",
          "  ansible.builtin.shell: >",
          "    pg_dump app | gzip > /backup/app-{{ today }}.sql.gz",
          "  args:",
          "    creates: /backup/app-{{ today }}.sql.gz",
          "",
          "- name: or decide for yourself what changed means",
          "  ansible.builtin.command: /usr/sbin/nginx -s reload",
          "  register: out",
          "  changed_when: out.rc == 0",
          "  failed_when: out.rc not in [0, 1]",
        ],
        out: [
          "# first run",
          "TASK [command — no shell, no pipes, safest] *",
          "changed: [web1]",
          "",
          "# second run: the file exists, so the module skips",
          "TASK [command — no shell, no pipes, safest] *",
          "skipping: [web1]",
        ],
        note: "Neither module knows what your command does, so both report `changed` every single time. `creates:` is the fix — the task is skipped if that path already exists — and `removes:` is its mirror. `changed_when:` takes any Jinja expression, not only `false`. Prefer `command`: `shell` runs through `/bin/sh`, so a variable in it is an injection risk.",
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
    insets: [
      {
        title: "when the end of the play is too late",
        yaml: [
          "- name: Write the site config",
          "  ansible.builtin.template:",
          "    src: site.conf.j2",
          "    dest: /etc/nginx/conf.d/site.conf",
          "  notify: Reload nginx",
          "",
          "- name: Apply the queued handlers now",
          "  ansible.builtin.meta: flush_handlers",
          "",
          "- name: Check the site answers on the new port",
          "  ansible.builtin.uri:",
          "    url: http://localhost:8080/health",
        ],
        out: [
          "RUNNING HANDLER [Reload nginx] *********",
          "changed: [web1]",
          "",
          "TASK [Check the site answers] **********",
          "ok: [web1]",
        ],
        note: "`meta: flush_handlers` drains the queue where you put it instead of at the end of the play. Without it the health check above runs against the old config, passes, and tells you nothing. `serial` flushes handlers at the end of every batch too, which is the real reason a rolling restart works.",
      },
    ],
    takeaway:
      "A handler runs only when something changed, once per host, at the end of the play — or wherever you put `meta: flush_handlers`.",
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
        note: "only tasks tagged nginx — nothing in this file is tagged yet; step 13 adds them",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --start-at-task 'Open the port'",
        note: "start again after a failure, without redoing the slow part",
      },
      {
        text: "ansible-playbook site.yml --syntax-check",
        note: "is the YAML even valid; parses, runs nothing",
      },
      {
        text: "ansible-playbook site.yml --list-tasks --list-hosts",
        note: "what would run, and where, without running it",
      },
      {
        text: "ansible-lint site.yml",
        note: "the separate tool that catches what is legal but unwise",
      },
      {
        text: "ansible-config dump --only-changed",
        note: "which settings are not at their defaults, and where each came from",
      },
      {
        text: "# put `inventory = inventory/hosts.ini` in ansible.cfg",
        note: "and stop typing -i on every command, which nobody does in practice",
        out: true,
      },
      {
        text: "ansible-doc ansible.builtin.service",
        note: "every argument a module takes, with examples, offline",
      },
    ],
    keywords: [
      {
        word: "--check",
        what: "A dry run. Ansible asks each module what it would do — but only a module that declares `supports_check_mode` can answer, and the rest are skipped. `command` and `shell` are the obvious ones; plenty of collection modules are too.",
      },
      {
        word: "--limit",
        what: "Picks fewer hosts, without editing the inventory. Reach for this first when something goes wrong.",
      },
    ],
    output: "one",
    grid: true,
    takeaway:
      "That is the whole file. Three more steps cover the things every real playbook needs and this one does not.",
  },
  {
    n: 11,
    title: "Secrets",
    lead: "A real playbook needs a database password, an API token, a private key. You cannot put those in a file you commit. Ansible Vault encrypts a file in place, and the playbook reads it as if nothing happened.",
    shell: [
      {
        text: "ansible-vault create group_vars/prod/vault.yml",
        note: "opens your editor; saves the file encrypted",
      },
      {
        text: "ansible-vault edit group_vars/prod/vault.yml",
        note: "decrypt, edit, re-encrypt, in one step",
      },
      {
        text: "ansible-vault encrypt_string 's3cret' --name db_password",
        note: "encrypt one value, to paste into an ordinary vars file",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --ask-vault-pass",
        note: "ask for the password when the run starts",
      },
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml \\\n    --vault-password-file ~/.vault-pass",
        note: "or read it from a file, for CI",
      },
      {
        text: "ansible-playbook site.yml \\\n    --vault-id dev@prompt --vault-id prod@~/.prod-pass",
        note: "two passwords at once, each with a label",
      },
    ],
    keywords: [
      {
        word: "ansible-vault",
        what: "Encrypts a whole file with a password. The file still lives in git, but as ciphertext. Ansible decrypts it in memory when it reads the variables.",
      },
      {
        word: "vars_files:",
        what: "Loads variables from files at the start of the play — which is how a vault file usually gets read: `vars_files: [group_vars/prod/vault.yml]`. Files under `group_vars/` and `host_vars/` are loaded for you; anywhere else needs this.",
      },
      {
        word: "encrypt_string",
        what: "Encrypts a single value rather than a whole file. The output pastes straight into a normal vars file, so the rest of that file stays readable in a diff.",
      },
      {
        word: "--vault-id",
        what: "More than one vault password at a time, each with a label: `--vault-id dev@prompt --vault-id prod@~/.prod-pass`. Developers can then hold the dev key and not the production one.",
      },
      {
        word: "vars_prompt:",
        what: "Ask for a value when the run starts, instead of storing it. Good for a one-off password; no use in CI, where nobody is there to type.",
      },
      {
        word: "no_log: true",
        what: "Stops a task printing its arguments and its result. Without it a password you pass to a module appears in the output, and in anything that captures the output.",
        without:
          "Without it, `-v` and most CI logs will show the secret in full.",
      },
    ],
    insets: [
      {
        title: "the encrypted file, and how it is used",
        yaml: [
          "# group_vars/prod/vault.yml, on disk",
          "$ANSIBLE_VAULT;1.1;AES256",
          "66383439383437643533...",
          "",
          "# group_vars/prod/vars.yml, in the clear",
          'db_password: "{{ vault_db_password }}"',
          "",
          "# loaded at the start of the play",
          "vars_files:",
          "  - group_vars/prod/vault.yml",
          "",
          "# or ask for it, once, at the start of the run",
          "vars_prompt:",
          "  - name: db_password",
          "    prompt: Database password",
          "    private: true",
          "",
          "# and in a task",
          "- name: Set the database password",
          "  community.postgresql.postgresql_user:",
          "    name: app",
          '    password: "{{ db_password }}"',
          "  no_log: true",
        ],
        out: [
          "TASK [Set the database password] ********",
          'ok: [db1] => {"censored": "the output has been',
          '  hidden due to the fact that no_log is set"}',
        ],
        note: "The common pattern: keep the secret in the vault file under a `vault_` name, and point a plain variable at it. That way you can read `vars.yml` to see WHAT is set without decrypting anything.",
      },
    ],
    takeaway:
      "`ansible-vault` encrypts the file. `no_log: true` keeps the value out of the output. You need both.",
  },
  {
    n: 12,
    title: "Reuse: roles",
    lead: "Copying tasks between playbooks stops working quickly. A ROLE is a folder with a fixed layout, and Ansible loads the parts by name. You met the layout in Part III; this is how a play uses one.",
    shell: [
      {
        text: "ansible-galaxy init roles/webserver",
        note: "create the folder layout",
      },
      {
        text: "ansible-galaxy install -r requirements.yml",
        note: "fetch roles and collections other people wrote",
      },
    ],
    keywords: [
      {
        word: "roles:",
        what: "Run these roles before the play's own tasks. Each one brings its own tasks, handlers, templates and defaults.",
      },
      {
        word: "import_role",
        what: "Static. The tasks are read when the playbook is parsed, so `--tags` and `--list-tasks` can see them. The role name cannot be a variable.",
      },
      {
        word: "pre_tasks / post_tasks",
        what: "Roles run between them: `pre_tasks`, then `roles:`, then `tasks:`, then `post_tasks`. Handlers are flushed three times — after `pre_tasks`, after roles and tasks together, and after `post_tasks` — not between roles and tasks.",
      },
      {
        word: "collections:",
        what: "Lists collections to search, so tasks in this play can say `postgresql_db` instead of `community.postgresql.postgresql_db`. Convenient, and the full name is still the safer habit.",
      },
      {
        word: "module_defaults:",
        what: "Set an argument once for every call of a module in the play. Credentials for a cloud module are the usual case, instead of repeating them on twenty tasks.",
      },
      {
        word: "include_role",
        what: "Dynamic. The tasks are read when the play reaches that line, so the role name can be a variable or sit in a loop. Tags do not reach inside.",
        without:
          "This is the whole static-versus-dynamic split, and it applies to `import_tasks` and `include_tasks` in exactly the same way.",
      },
    ],
    insets: [
      {
        title: "what is actually inside one",
        yaml: [
          "# roles/webserver/defaults/main.yml",
          "nginx_port: 80          # the knob, overridable",
          "",
          "# roles/webserver/tasks/main.yml",
          "- name: Install nginx",
          "  ansible.builtin.package:",
          "    name: nginx",
          "    state: present",
          "",
          "- name: Write the site config",
          "  ansible.builtin.template:",
          "    src: site.conf.j2   # found without a path",
          "    dest: /etc/nginx/conf.d/site.conf",
          "  notify: Reload nginx",
          "",
          "# roles/webserver/handlers/main.yml",
          "- name: Reload nginx",
          "  ansible.builtin.service:",
          "    name: nginx",
          "    state: reloaded",
          "",
          "# requirements.yml — other people's work",
          "roles:",
          "  - name: geerlingguy.postgresql",
          "collections:",
          "  - name: community.postgresql",
        ],
        out: [
          "TASK [webserver : Install nginx] ********",
          "changed: [web1]",
          "",
          "RUNNING HANDLER [webserver : Reload nginx] *",
          "changed: [web1]",
        ],
        note: "It is the same tasks you already wrote, moved into files whose names Ansible knows. `src: site.conf.j2` needs no path because `templates/` is searched automatically, and the handler is found because it is in `handlers/main.yml`. That is the whole of what a role is.",
      },
      {
        title: "three ways to use the same role",
        yaml: [
          "- name: Web tier",
          "  hosts: webservers",
          "  collections:",
          "    - community.postgresql",
          "  module_defaults:",
          "    ansible.builtin.uri:",
          "      timeout: 30",
          "  roles:",
          "    - webserver",
          "",
          "    - role: webserver",
          "      nginx_port: 8080",
          "",
          "  tasks:",
          "    - ansible.builtin.import_role:",
          "        name: webserver",
          "",
          "    - ansible.builtin.include_role:",
          '        name: "{{ tier }}_role"',
        ],
        out: [
          "TASK [webserver : Install nginx] ********",
          "changed: [web1]",
          "",
          "TASK [webserver : Write the config] *****",
          "changed: [web1]",
        ],
        note: "The task name is prefixed with the role, which is how you find out where a task you did not write came from. A value passed next to `role:` is a role parameter, and those sit near the top of the precedence list.",
      },
    ],
    takeaway:
      "A role is reuse with a fixed shape. `roles:` runs it, `import_role` is static, `include_role` is dynamic.",
  },
  {
    n: 13,
    title: "Rolling it out safely",
    lead: "Three hosts is fine. Three hundred behind a load balancer is not: you do not want every one of them restarting nginx at the same second. These are the controls for that, and for deciding what counts as a failure.",
    keywords: [
      {
        word: "serial: 1",
        what: 'Run the whole play on one host at a time, finish it, then move to the next. This is a rolling deploy. `serial: "25%"` works too, and a list like `[1, 5, 10]` ramps up.',
      },
      {
        word: "tags:",
        what: "Labels on tasks or roles. `--tags nginx` runs only those; `--skip-tags slow` runs everything else.",
      },
      {
        word: "always / never",
        what: "Two tag names Ansible treats specially. A task tagged `always` runs whatever `--tags` you pass, which is what you want for a task that sets variables everything else needs. A task tagged `never` only runs if you ask for it by name.",
        without:
          "`--list-tags` prints every tag in the playbook, and `apply:` pushes tags down into an `include_role` that would not otherwise inherit them.",
      },
      {
        word: "failed_when:",
        what: "Decides what counts as a failure. A command that exits 2 is not always broken, and a command that exits 0 is not always fine.",
      },
      {
        word: "any_errors_fatal: true",
        what: "If any host fails, stop the whole play on every host. Without it, the failed host drops out and the others carry on.",
      },
      {
        word: "run_once: true",
        what: "Run this task on one host only — one host per BATCH, which is the part that catches people. With `serial: 1` every host is its own batch, so a `run_once` task runs once per host after all.",
        without:
          "To run something exactly once whatever `serial` says, gate it instead: `when: inventory_hostname == ansible_play_hosts_all[0]`.",
      },
      {
        word: "delegate_to:",
        what: "Run this task somewhere else, but with the current host's variables. Taking a host out of a load balancer is the usual reason.",
      },
      {
        word: "ignore_errors: true",
        what: "Carry on even if this task fails. The task still reports `failed` in red; the host just is not removed from the play.",
        without:
          "Reach for `failed_when` first. `ignore_errors` hides every failure, including the ones you did want to know about.",
      },
      {
        word: "until:",
        what: "Retry a task until a condition holds. With `retries` and `delay`, it is how you wait for something to come up instead of guessing with a sleep.",
      },
      {
        word: "async:",
        what: "Start a long task without holding the connection open for it. `poll: 0` fires and forgets, and a later task with `async_status` collects the result. This is how a job that takes an hour survives an SSH timeout.",
      },
    ],
    insets: [
      {
        title: "a rolling deploy, one host at a time",
        yaml: [
          "- name: Web tier",
          "  hosts: webservers",
          "  serial: 1",
          "  any_errors_fatal: true",
          "  tasks:",
          "    - name: Take it out of the pool",
          "      ansible.builtin.uri:",
          "        url: http://lb/drain/{{ inventory_hostname }}",
          "      delegate_to: localhost",
          "      tags: [deploy]",
          "",
          "    - name: Work out the release path",
          "      ansible.builtin.set_fact:",
          '        release_dir: "/srv/app/{{ build_sha }}"',
          "      tags: [always]",
          "",
          "    - name: Migrate the database",
          "      ansible.builtin.command: /srv/app/migrate",
          "      when: inventory_hostname == ansible_play_hosts_all[0]",
          "      register: out",
          "      failed_when: out.rc not in [0, 2]",
        ],
        out: [
          "PLAY [Web tier] ****** (web1)",
          "changed: [web1]",
          "",
          "PLAY [Web tier] ****** (web2)",
          "changed: [web2]",
        ],
        note: "With `serial: 1` the play banner repeats, once per host — the clearest sign in the output that a rolling deploy is happening. Note what the migration does NOT say: `run_once` is once per batch, and under `serial: 1` every host is a batch, so `run_once` there would have migrated the database once per machine. The `when:` gate is the form that survives `serial`.",
      },
      {
        title: "waiting, and deciding what counts as broken",
        yaml: [
          "- name: Wait for the port to answer",
          "  ansible.builtin.uri:",
          "    url: http://localhost:8080/health",
          "  register: health",
          "  until: health.status == 200",
          "  retries: 10",
          "  delay: 3",
          "",
          "- name: Tidy up, and never mind if it fails",
          "  ansible.builtin.command: /srv/app/cleanup",
          "  ignore_errors: true",
          "",
          "- name: Reindex, which takes an hour",
          "  ansible.builtin.command: /srv/app/reindex",
          "  async: 3600",
          "  poll: 0",
        ],
        out: [
          "TASK [Wait for the port to answer] ******",
          "FAILED - RETRYING (9 retries left).",
          "FAILED - RETRYING (8 retries left).",
          "ok: [web1]",
          "",
          "TASK [Tidy up, and never mind if it fails] *",
          "fatal: [web1]: FAILED! => {...}",
          "...ignoring",
        ],
        note: "`until` needs `register`, because the condition reads the variable the task just set. Ten retries three seconds apart is thirty seconds of patience — and far better than `sleep 30`, which is both too long and too short.",
      },
    ],
    takeaway:
      "`serial` controls how many hosts at once. `tags` control which tasks. `failed_when` and `any_errors_fatal` control what stops the run.",
  },
  {
    n: 14,
    title: "When it fails",
    lead: "Everything above assumed it worked. It will not, and reading the failure is the skill you will use more than any other on this page. Ansible prints one JSON object when a task fails, and three of its keys answer almost every question.",
    shell: [
      {
        text: "ansible-playbook -i inventory/hosts.ini site.yml --limit web1",
        note: "the same run, on a host where nginx is not in the repositories",
      },
    ],
    keywords: [
      {
        word: "msg",
        what: "Ansible's own summary of what went wrong. Read this first; it is right more often than it looks.",
      },
      {
        word: "stderr / stdout",
        what: "What the command itself printed. `command` and `shell` failures live here, not in `msg` — and `stderr_lines` is the same thing split up, which is far easier to read.",
      },
      {
        word: "rc",
        what: "The exit status. `rc: 0` with a failure means Ansible decided it failed, so look at your own `failed_when`.",
      },
      {
        word: "ansible.builtin.assert",
        what: "Fail on purpose, before the damage. `assert` checks a condition and stops with your message; `fail` stops unconditionally. Both are better than discovering it halfway through a rolling deploy.",
      },
    ],
    insets: [
      {
        title: "what a failure actually looks like",
        yaml: [
          "TASK [Install nginx] ********************",
          "fatal: [web1]: FAILED! => {",
          '    "changed": false,',
          '    "msg": "No package nginx available.",',
          '    "rc": 1,',
          '    "results": []',
          "}",
          "",
          "PLAY RECAP ******************************",
          "web1    : ok=1  changed=0  unreachable=0  failed=1",
          "          skipped=0  rescued=0  ignored=0",
        ],
        out: [
          "# the same task, with a shell command instead",
          "fatal: [web1]: FAILED! => {",
          '    "changed": true,',
          '    "cmd": "/srv/app/migrate",',
          '    "rc": 2,',
          '    "stderr_lines": [',
          '        "could not connect to database"',
          "    ],",
          '    "stdout_lines": []',
          "}",
        ],
        note: "A module failure puts its reason in `msg`. A `command` or `shell` failure puts it in `stderr_lines`, and `msg` says only that the command returned non-zero — which is why so many people conclude Ansible told them nothing. Note `changed: true` on the second one: it ran, it did damage, and then it failed.",
      },
      {
        title: "fail before you break something",
        yaml: [
          "- name: Refuse to deploy a dirty build",
          "  ansible.builtin.assert:",
          "    that:",
          "      - build_sha is defined",
          "      - app_env in ['staging', 'prod']",
          '    fail_msg: "build_sha and a known app_env are required"',
          "",
          "- name: Not on a Friday",
          "  ansible.builtin.fail:",
          '    msg: "deploys are blocked today"',
          "  when: ansible_facts.date_time.weekday == 'Friday'",
        ],
        out: [
          "TASK [Refuse to deploy a dirty build] ***",
          "fatal: [web1]: FAILED! => {",
          '    "assertion": "build_sha is defined",',
          '    "msg": "build_sha and a known app_env are required"',
          "}",
        ],
        note: "`assert` prints which of the conditions failed, which is the whole reason to prefer it over a `when:` that silently skips. A failing host leaves the play; the others carry on unless `any_errors_fatal` says otherwise.",
      },
    ],
    takeaway:
      "`msg` for module failures, `stderr_lines` for command failures, `rc` for the exit status. `assert` to stop before the damage rather than after. Below, the file from step 10 runs for real.",
  },
];

/** the last step, so the page and the tests agree on where the guide ends */
export const LAST_STEP = STEPS[STEPS.length - 1].n;

/** every host the guide ever names, in the order it meets them */
export const GUIDE_HOSTS = HOSTS.filter(h => h.id !== "control").map(h => h.id);
