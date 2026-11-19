import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Assertions about the built site, not about the source.
 *
 * Everything here is a bug that shipped once and could not be seen from the
 * source at all — the font the browser actually fetched, the bundle a post
 * actually loaded, the URL a reader actually landed on. Each was found by
 * measuring `dist/`, so each is checked against `dist/`.
 *
 * This file needs a build, so it is excluded from `npm test` and run by
 * `npm run test:dist` after `npm run build`.
 */

const DIST = "dist";
const POST = join(DIST, "posts/opsec/index.html");

beforeAll(() => {
  if (!existsSync(POST)) {
    throw new Error(
      "dist/ is missing or stale — run `npm run build` before `npm run test:dist`",
    );
  }
});

const page = () => readFileSync(POST, "utf8");

/** the text a reader actually sees, with the markup taken out */
const readable = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

describe("fonts", () => {
  it("links no TrueType to the browser", () => {
    // Astro emits one @font-face per format. The woff2 blocks carry a
    // unicode-range and the TrueType ones do not, so declared together under
    // the same family the TTF wins every Latin codepoint AND comes last: the
    // page was fetching 378KB of TTF and none of the 15KB woff2. TrueType is
    // for satori at build time and lives under its own --font-og variable.
    const ttf = page().match(/\/_astro\/fonts\/[a-z0-9]+\.ttf/g) ?? [];
    expect(ttf, `TrueType linked from a page: ${ttf.join(", ")}`).toEqual([]);
  });

  it("links woff2", () => {
    expect(page()).toMatch(/\/_astro\/fonts\/[a-z0-9]+\.woff2/);
  });
});

describe("diagrams", () => {
  const withDiagram = join(DIST, "posts/aws-resource-hierarchy/index.html");

  it("does not ship mermaid to a post that has none", () => {
    // Astro bundles page scripts per ROUTE, so a static `import mermaid` in a
    // component put mermaid and d3 — 257KB — into the entry every post loads.
    const srcs = page().match(/src="(\/_astro\/[^"]+\.js)"/g) ?? [];
    for (const tag of srcs) {
      const file = tag.slice(6, -1);
      const js = readFileSync(join(DIST, file), "utf8");
      expect(
        js.includes("flowchart-elk") || js.includes("mermaid version"),
        `${file} carries mermaid`,
      ).toBe(false);
    }
  });

  it("keeps the arrows in a diagram's source", () => {
    // A diagram written as raw <div class="mermaid"> has its contents read as
    // markdown text, and smartypants rewrites every `-->` into an em dash.
    // `graph LR\nA —> B` is not a graph, and all three diagrams rendered
    // mermaid's "Syntax error in text" bomb in production.
    const html = readFileSync(withDiagram, "utf8");
    expect(html).toContain('class="mermaid"');
    const block = html.slice(html.indexOf('class="mermaid"'));
    expect(block.slice(0, 400)).toContain("--&gt;");
    expect(block.slice(0, 400)).not.toContain("—");
  });
});

describe("urls", () => {
  const pairs = [
    ...readFileSync("src/redirects.ts", "utf8").matchAll(
      /"([^"]+)":\s*"([^"]+)"/g,
    ),
  ].map(m => [m[1], m[2]] as const);

  const resolves = (path: string) =>
    existsSync(join(DIST, path)) ||
    existsSync(join(DIST, path, "index.html")) ||
    existsSync(join(DIST, path.replace(/\/$/, ""), "index.html"));

  it("has redirects to check", () => {
    expect(pairs.length).toBeGreaterThan(50);
  });

  it("emits a page for every old URL", () => {
    const missing = pairs.filter(([from]) => !resolves(from));
    expect(missing.map(([f]) => f)).toEqual([]);
  });

  it("points every redirect at something that exists", () => {
    // A redirect to a 404 is not a redirect. Six tag pages failed this on the
    // first pass, because the migration collapsed those tags into `archive`.
    const dangling = pairs.filter(([, to]) => !resolves(to));
    expect(dangling.map(([f, t]) => `${f} -> ${t}`)).toEqual([]);
  });
});

describe("llms.txt", () => {
  it("lists every published post", () => {
    const txt = readFileSync(join(DIST, "llms.txt"), "utf8");
    const listed = (txt.match(/^- \[.+?\]\(https?:\/\/\S+\/posts\//gm) ?? [])
      .length;
    const built = readdirSync(join(DIST, "posts"), {
      withFileTypes: true,
    }).filter(e => e.isDirectory() && !/^\d+$/.test(e.name)).length;
    expect(listed).toBe(built);
  });
});

describe("/ansible covers Ansible's own documented topics", () => {
  /**
   * The page exists to teach Ansible, and "teaches Ansible" is not something
   * the other tests can see: they check the simulation's arithmetic, not its
   * syllabus.
   *
   * The list below is NOT this repository's opinion of what matters. Every
   * entry is a chapter or sub-chapter of Ansible's own documentation, taken
   * from the seven user-facing guides, so the standard is theirs and anyone
   * can re-derive it:
   *
   *   docs.ansible.com/ansible/latest/getting_started/index.html
   *   docs.ansible.com/ansible/latest/playbook_guide/index.html
   *   docs.ansible.com/ansible/latest/inventory_guide/index.html
   *   docs.ansible.com/ansible/latest/command_guide/index.html
   *   docs.ansible.com/ansible/latest/vault_guide/index.html
   *   docs.ansible.com/ansible/latest/collections_guide/index.html
   *   docs.ansible.com/ansible/latest/module_plugin_guide/index.html
   *   docs.ansible.com/ansible/latest/tips_tricks/index.html
   *
   * Every chapter of those guides is in one of the two lists here: COVERED,
   * which is asserted, or OMITTED, which carries the reason beside it. An
   * omission with a reason is a decision; an omission nobody writes down is
   * an oversight, and keeping both lists in one place is what stops the
   * second from being mistaken for the first.
   *
   * Each covered row carries a PHRASE OF THE PAGE'S OWN EXPLANATION, and the
   * optional third column is the literal a reader must also see. That split
   * is the point of the file. A list of keywords proves nothing: `set_fact`,
   * `ignore_errors` and `vars_prompt` once passed a keyword check while
   * being nothing but rows in the precedence table, and `ControlPersist`
   * passed on an `ssh_args` line whose only explanation was inside a panel
   * you had to click. A chapter is covered here when the page says something
   * about it in a sentence, and the first test below refuses any row whose
   * phrase is short enough to be a mention.
   *
   * It reads the BUILT page, because a concept explained in a source comment
   * is explained to nobody. Two readings of it are used: everything the page
   * renders, panels included, and `standing` — what is on screen before the
   * reader clicks anything. CORE is held to the stricter one.
   */
  const html = readFileSync(join(DIST, "ansible", "index.html"), "utf8");
  const text = readable(html);
  const standing = readable(html.replace(/<script[\s\S]*?<\/script>/g, " "));

  /** [the docs' chapter, a phrase of the page's explanation, a literal shown] */
  const COVERED: [string, string, string?][] = [
    [
      "Introduction to Ansible",
      "Ansible is that list of steps, written in a file",
      "control node",
    ],
    [
      "Start automating with Ansible",
      "check that SSH works and Python is there",
      "ansible -i inventory",
    ],
    [
      "Building an inventory",
      "The file that lists your machines and their names",
      "inventory/hosts.ini",
    ],
    ["Creating a playbook", "a playbook is a list of plays"],
    [
      "Ansible concepts: managed node",
      "Ansible only needs SSH and a Python",
      "only needs SSH",
    ],
    [
      "Playbook syntax",
      "Most first playbooks fail on YAML, not on Ansible",
      "PLAY [Web tier]",
    ],
    ["Playbook execution", "Tasks run from top to bottom"],
    [
      "Verifying playbooks",
      "is the YAML even valid; parses, runs nothing",
      "--syntax-check",
    ],
    ["Templating (Jinja2)", "The host never sees the braces"],
    [
      "Using filters to manipulate data",
      "uses the variable if it is set, and that value if it is not",
      "A Jinja filter",
    ],
    [
      "Tests",
      "A test asks a question; a filter changes a value",
      "A Jinja test",
    ],
    [
      "Lookups",
      "Reads something from YOUR machine while the template renders",
      "lookup(",
    ],
    [
      "Loops",
      "The task reports once per item, and the whole task counts as changed if any item did",
      "item is the loop variable",
    ],
    ["Delegation and local actions", "Run this task somewhere else"],
    ["Conditionals", "If it is false the task is skipped"],
    ["Blocks", "runs rescue instead of dropping the host"],
    [
      "Handlers: running operations on change",
      "It only fires if this task reported changed",
      "Queues the handler by name",
    ],
    ["Error handling in playbooks", "Decides what counts as a failure"],
    ["Setting the remote environment", "Environment variables for the task"],
    ["Reusing Ansible artifacts", "The role name cannot be a variable"],
    [
      "Roles",
      "Each one brings its own tasks, handlers, templates and defaults",
      "Run these roles before",
    ],
    [
      "Module defaults",
      "Set an argument once for every call of a module in the play",
      "Set an argument once",
    ],
    ["Interactive input: prompts", "Ask for a value when the run starts"],
    ["Using variables", "Names you set once and use below"],
    [
      "Variable precedence",
      "When two of them set the same name, the higher one wins",
      "Twenty-two levels",
    ],
    [
      "Discovering variables: facts",
      "Every play starts by running setup on each host to collect its facts",
      "170 top-level keys",
    ],
    [
      "Discovering variables: magic variables",
      "A magic variable — one Ansible sets itself",
      "A magic variable",
    ],
    ["Rolling upgrades", "Run the whole play on one host at a time"],
    [
      "Validating tasks: check mode and diff mode",
      "every module is asked what it WOULD do, and changes nothing",
      "A dry run",
    ],
    [
      "Understanding privilege escalation: become",
      "Run the module as root, using sudo",
      "Short for become",
    ],
    [
      "Tags",
      "runs only those; --skip-tags slow runs everything else",
      "Labels on tasks or roles",
    ],
    [
      "Executing playbooks for troubleshooting",
      "This is the fastest way to find out why something said",
      "-vvv adds the SSH commands",
    ],
    [
      "Debugging tasks",
      "debug prints it, and runs on your machine, so it costs nothing",
      "ansible.builtin.debug",
    ],
    [
      "Asynchronous actions and polling",
      "This is how a job that takes an hour survives an SSH timeout",
      "Start a long task without",
    ],
    [
      "Controlling playbook execution: strategies",
      "linear makes every host wait",
    ],
    [
      "Inventory basics: formats, hosts, and groups",
      "a group made of other groups",
      "prod:children",
    ],
    [
      "Passing multiple inventory sources",
      "can be given more than once, or pointed at a directory",
      "can be given more than once",
    ],
    [
      "Organizing inventory in a directory",
      "merges everything in it — which is how production and staging stay separate files",
      "or pointed at a",
    ],
    [
      "Defining variables in INI format",
      "the same thing as hosts.yml",
      "[all:vars]",
    ],
    [
      "Assigning a variable to one machine: host variables",
      "A host beats its group, always",
      "host_vars",
    ],
    [
      "Assigning a variable to many machines: group variables",
      "Every group can have a group_vars",
      "group_vars",
    ],
    [
      "Inventory setup examples",
      "settings; found here only because this is where you run from",
      "where the files live",
    ],
    [
      "Working with dynamic inventory",
      "asks the provider what exists and builds the groups from tags",
      "inventory plugin",
    ],
    [
      "Patterns: targeting hosts and groups",
      "take a pattern, not only a group name",
      "webservers:!web3",
    ],
    [
      "Implicit localhost",
      "reachable without appearing in any inventory at all",
      "an implicit",
    ],
    [
      "Connecting to hosts: behavioral parameters",
      "which Python to run modules with",
      "ansible_python_interpreter",
    ],
    [
      "ControlPersist",
      "reuses it for all the rest, so only one task pays for the handshake",
      "ControlPersist",
    ],
    ["Setting a remote user", "the SSH user to log in as", "ansible_user"],
    [
      "Setting up SSH keys",
      "otherwise your agent and ~/.ssh/config apply as usual",
      "ansible_ssh_private_key_file",
    ],
    [
      "Running against localhost",
      "local runs on your own machine, which is what",
      "delegate_to: localhost",
    ],
    [
      "Managing host key checking",
      "the first run against a new host fails with",
      "Host key verification failed",
    ],
    [
      "Introduction to ad hoc commands",
      "this is called an AD HOC command, and everything else on this page is this",
      "ansible -i inventory",
    ],
    [
      "ansible-config",
      "which settings are not at their defaults, and where each came from",
      "ansible-config",
    ],
    [
      "ansible-doc",
      "every argument a module takes, with examples, offline",
      "ansible-doc",
    ],
    [
      "ansible-galaxy",
      "fetch roles and collections other people wrote",
      "ansible-galaxy install -r",
    ],
    [
      "ansible-inventory",
      "prints whatever it produced, file or plugin",
      "ansible-inventory",
    ],
    ["ansible-playbook", "run the file on one host", "ansible-playbook"],
    [
      "ansible-vault",
      "Ansible decrypts it in memory when it reads the variables",
      "ansible-vault",
    ],
    ["Ansible Vault", "Encrypts a whole file with a password"],
    [
      "Managing multiple passwords with vault IDs",
      "two passwords at once, each with a label",
      "--vault-id",
    ],
    [
      "Storing and accessing vault passwords",
      "or read it from a file, for CI",
      "--vault-password-file",
    ],
    [
      "Encrypting individual variables",
      "encrypt one value, to paste into an ordinary vars file",
      "encrypt_string",
    ],
    [
      "Encrypting files with Ansible Vault",
      "opens your editor; saves the file encrypted",
      "ansible-vault create",
    ],
    [
      "Passing a single password",
      "ask for the password when the run starts",
      "--ask-vault-pass",
    ],
    [
      "When are encrypted files made visible?",
      "Stops a task printing its arguments",
    ],
    [
      "Format of files encrypted with Ansible Vault",
      "The file still lives in git, but as ciphertext",
      "$ANSIBLE_VAULT;1.1;AES256",
    ],
    [
      "Install multiple collections with a requirements file",
      "roles and collections to fetch",
      "requirements.yml",
    ],
    [
      "Using collections in a playbook",
      "The module's full name: namespace, collection, module",
      "namespace, collection, module",
    ],
    [
      "Simplifying module names with the collections keyword",
      "Lists collections to search, so tasks in this play can say",
      "collections:",
    ],
    ["Introduction to modules", "A module is one unit of work"],
    [
      "Working with plugins",
      "A PLUGIN runs on the control node and extends Ansible itself",
      "extends Ansible itself",
    ],
    [
      "Action plugins",
      "doing work locally before any module is sent",
      "an ACTION plugin",
    ],
    [
      "Filter, test and lookup plugins",
      "filter, test and lookup plugins inside templates",
      "A Jinja filter",
    ],
    [
      "Inventory plugins",
      "so a machine created ten minutes ago is already in",
      "inventory plugin",
    ],
    [
      "Always name plays, tasks, and blocks",
      "so by step 9 it is load-bearing",
      "it is also the name",
    ],
    [
      "Always mention the state",
      "This says how the host should end up",
      "It is not a command to run",
    ],
    [
      "Use fully qualified collection names",
      "Convenient, and the full name is still the safer habit",
      "namespace, collection, module",
    ],
    [
      "Separate production and staging inventory",
      "so staging values can never leak into production",
      "production and staging stay",
    ],
    ["Update in batches", "Run the whole play on one host at a time"],
    [
      "Handling OS and distro differences",
      "it asks the host which manager it has and picks",
      "picks apt instead of dnf",
    ],
    [
      "Sample directory layout",
      "the common case instead: one directory per environment",
      "where the files live",
    ],
    [
      "Keep vaulted variables safely visible",
      "keep the secret in the vault file under a vault_ name",
      "readable in a diff",
    ],
    ["Idempotency", "Idempotent means running it twice"],
    [
      "ok, changed, skipped, failed, unreachable",
      "could not be reached at all",
    ],
    [
      "Fact caching",
      "only scans a host it has no facts for, so one already in the cache is never contacted",
      "fact_caching = jsonfile",
    ],
    [
      "Pipelining",
      "One SSH operation per task instead of four",
      "pipelining = True",
    ],
    ["set_fact", "Makes a new variable during the run"],
    ["until and retries", "Retry a task until a condition holds"],
    [
      "forks",
      "How many hosts are worked at once",
      "Raising it past the number",
    ],
    ["the playbook/play/task hierarchy", "a playbook is a list of plays"],
    [
      "YAML lists and dictionaries",
      "is an item in a LIST; key: value is an entry in a DICTIONARY",
      "is an item in a LIST",
    ],
    [
      "installing Ansible",
      "on your machine only; the hosts get nothing installed",
      "pipx install --include-deps ansible",
    ],
    [
      "the sudo password (-K)",
      "which is the most common first-run failure there is",
      "Missing sudo password",
    ],
    [
      "reading a failure",
      "is the same thing split up, which is far easier to read",
      "stderr_lines",
    ],
    [
      "fail and assert",
      "assert checks a condition and stops with your message",
      "ansible.builtin.assert",
    ],
    [
      "command vs shell",
      "so a variable in it is an injection risk",
      "ansible.builtin.shell",
    ],
    [
      "creates and removes",
      "the module does not run the command when that path exists",
      "creates:",
    ],
    [
      "loop_control",
      "stops the output printing a whole dictionary per item",
      "loop_control",
    ],
    [
      "meta: flush_handlers",
      "drains the queue where you put it instead of at the end of the play",
      "flush_handlers",
    ],
    ["the always and never tags", "runs whatever --tags you pass"],
    [
      "pre_tasks and post_tasks",
      "Handlers are flushed three times",
      "pre_tasks",
    ],
    [
      "vars_files",
      "Loads variables from files at the start of the play",
      "vars_files",
    ],
    [
      "what is inside a role",
      "the entry point, loaded automatically",
      "roles/webserver/tasks/main.yml",
    ],
    [
      "ansible.cfg discovery order",
      "The first one found wins outright",
      "ANSIBLE_CONFIG",
    ],
    [
      "when: takes no braces",
      "so the braces are a second layer and the comparison breaks",
      "ALREADY a Jinja expression",
    ],
    [
      "discovering what facts exist",
      "around 170 top-level keys, many of them nested",
      "-m setup",
    ],
    [
      "setting inventory in ansible.cfg",
      "and stop typing -i on every command",
      "inventory = inventory/hosts.ini",
    ],
    ["set_fact outlives the play", "lasts for the rest of the RUN"],
    [
      "cacheable facts",
      "puts it in the fact cache, where the next run will find it",
      "cacheable: true",
    ],
    ["not every state is idempotent", "always act, and so always report"],
    [
      "rescued and ignored in the recap",
      "the host just is not removed from the play",
      "rescued=0",
    ],
    [
      "check mode needs supports_check_mode",
      "is skipped rather than guessed at",
      "supports_check_mode",
    ],
    [
      "become_user",
      "becomes somebody other than root",
      "become_user: postgres",
    ],
    ["become_method", "doas or su changes the tool", "become_method"],
    [
      "listen: on handlers",
      "notify that string instead of a task name",
      "Lets one",
    ],
    ["YAML inventory", "the same thing as hosts.yml", "hosts.yml"],
    [
      "import_tasks and include_tasks",
      "Split a long playbook across files without making a role",
      "import_tasks",
    ],
    [
      "with_items is the old loop",
      "flattens one level of nesting and loop does not",
      "with_items",
    ],
    [
      "--diff output shown",
      "change nothing; show what WOULD change, and the diffs",
      "listen 80;",
    ],
    [
      "installing a collection",
      "an exact version; they land in",
      "ansible-galaxy collection install",
    ],
    [
      "role defaults are the real floor",
      "the real floor; any vars file you write beats it",
      "the real floor",
    ],
    [
      "the two fact spellings",
      "names are injected as top-level variables for compatibility",
      "Same fact, two spellings",
    ],
    [
      "ansible_play_hosts_all",
      "is every host the play targets",
      "ansible_play_hosts_all",
    ],
    [
      "role argument_specs",
      "which variables are required, their types, their defaults",
      "Declares what a role takes",
    ],
    [
      "role dependencies",
      "roles listed here run first, and are de-duplicated if two roles need the same one",
      "roles listed here run first",
    ],
    ["which group wins", "which GROUP wins when a host is in several"],
    [
      "ansible_group_priority",
      "overrides the tie-break and must be set in the inventory itself",
      "ansible_group_priority",
    ],
    [
      "hash_behaviour and combine",
      "the winner REPLACES it rather than merging",
      "hash_behaviour = merge",
    ],
    [
      "YAML boolean coercion",
      "Quote it when you mean the word",
      "All booleans",
    ],
    [
      "import_playbook",
      "one file per tier, one file that runs them all",
      "import_playbook",
    ],
    [
      "collections lifecycle",
      "what is installed, and which version",
      "ansible-galaxy collection list",
    ],
    [
      "where collections install",
      "folder beside the playbook is searched first",
      "~/.ansible/collections",
    ],
    [
      "ansible-pull",
      "the host clones the repo and runs it on itself, from cron",
      "ansible-pull",
    ],
    [
      "execution environments",
      "run inside a container image that pins Ansible, the collections and the Python",
      "execution environment",
    ],
    [
      "per-environment inventories",
      "one directory per environment production/hosts.yml with its own group_vars",
      "one directory per environment",
    ],
    ["child group beats parent", "then a parent group, then its children"],
    [
      "group priority goes in the inventory",
      "in group_vars/ it is silently ignored",
    ],
    [
      "y and n are not YAML booleans",
      "They work as module arguments only because Ansible coerces them itself",
      "NOT YAML booleans",
    ],
    [
      "register with loop gives results",
      "a list with one entry per item",
      "holds .results",
    ],
    [
      "callback plugins produce the output",
      "which is what produces every line of output on this page",
      "a CALLBACK plugin",
    ],
    [
      "stdout_callback can be changed",
      "prints module results as readable YAML instead of one long JSON line",
      "stdout_callback = yaml",
    ],
    // reconciled against the eight guides' toctrees, re-fetched 16 Nov 2026:
    // every chapter and sub-chapter they list is now in one of these lists
    [
      "ansible",
      "this is called an AD HOC command, and everything else on this page is this",
      "ansible -i inventory/hosts.ini web1",
    ],
    [
      "Adding variables to inventory",
      "A host beats its group, always",
      "[all:vars]",
    ],
    [
      "Organizing host and group variables",
      "level 5 beside a playbook, 4 inside an inventory",
      "group_vars/",
    ],
    [
      "Using inventory directories and multiple inventory sources",
      "can be given more than once, or pointed at a directory",
      "-i inventories/staging",
    ],
    [
      "Patterns and ansible-playbook flags",
      "narrows it from the command line, without editing the file",
      "--limit",
    ],
    [
      "Patterns and ad-hoc commands",
      "or the shell eats it before Ansible sees it",
      "--list-hosts",
    ],
    [
      "Choosing between a single password and multiple passwords",
      "Developers can then hold the dev key and not the production one",
      "--vault-id",
    ],
    [
      "Passing vault IDs",
      "two passwords at once, each with a label",
      "dev@prompt",
    ],
    [
      "Play Argument Validation",
      "Ansible then validates them before the role's first task runs",
      "argument_specs:",
    ],
    [
      "How variables are merged",
      "the winner REPLACES it rather than merging",
      "combine",
    ],
    [
      "Boolean variables",
      "They work as module arguments only because Ansible coerces them itself",
      "y and n",
    ],
    ["Become plugins", "doas or su changes the tool", "become_method"],
    [
      "Connection plugins",
      "local runs on your own machine, which is what",
      "ansible_connection",
    ],
    [
      "Strategy plugins",
      "lets each host run its own list as fast as it can",
      "free",
    ],
    [
      "Callback plugins",
      "which is what produces every line of output on this page",
      "a CALLBACK plugin",
    ],
    ["Modules", "A module is one unit of work", "ansible.builtin.ping"],
    [
      "Lookup plugins",
      "Reads something from YOUR machine while the template renders",
      "lookup(",
    ],
    [
      "Filter plugins",
      "reading a variable nobody set fails the task with undefined variable",
      "| b64encode",
    ],
    [
      "Test plugins",
      "A test asks a question; a filter changes a value",
      "is defined",
    ],
    [
      "Installing collections in containers",
      "run inside a container image that pins Ansible, the collections and the Python",
      "ansible-navigator",
    ],
    [
      "Installing collections adjacent to playbooks",
      "which is how a repository pins its own without touching your home",
      "collections/",
    ],
    [
      "Installing an older version of a collection",
      "an exact version; they land in",
      "community.general:==8.6.0",
    ],
    [
      "Listing collections",
      "what is installed, and which version",
      "ansible-galaxy collection list",
    ],
    [
      "Customize the CLI output",
      "prints module results as readable YAML instead of one long JSON line",
      "stdout_callback = yaml",
    ],
    [
      "Use whitespace",
      "Indentation says what belongs to what, with spaces only",
      "a tab is a syntax error",
    ],
    [
      "Use dynamic inventory with clouds",
      "asks the provider what exists and builds the groups from tags",
      "inventory plugin",
    ],
    [
      "Group inventory by function",
      "web1, web2, web3 the first play's target",
      "dbservers",
    ],
    [
      "Sample group and host variables",
      "the one machine that differs",
      "host_vars/",
    ],
    [
      "Sample playbooks organized by function",
      "one file per tier, one file that runs them all",
      "import_playbook",
    ],
    [
      "Sample task and handler files in a function-based role",
      "the handlers notify can name",
      "handlers/main.yml",
    ],
    [
      "Using local Ansible modules",
      "your own modules; Ansible looks here on its own",
      "library/",
    ],
    [
      "ControlPersist and paramiko",
      "keeps the first task's socket open and reuses it for all the rest",
      "ControlMaster=auto",
    ],
  ];

  /**
   * Ansible's own `basic_concepts` page names eleven things, and its
   * `getting_started` guide assumes a few more. These are the ones a reader
   * cannot do without, so they are held to the standing prose: a core
   * concept whose only explanation sits in a panel behind a click is not
   * taught, however correct the panel is.
   */
  const CORE: [string, string][] = [
    ["control node", "filled in on the control node"],
    ["managed node", "Ansible only needs SSH and a Python"],
    ["inventory", "The file that lists your machines and their names"],
    ["playbook", "That file is a PLAYBOOK, and it holds the whole hierarchy"],
    ["play", "a play is a group of hosts plus a list of tasks"],
    ["task", "a task is one module with its arguments"],
    ["module", "A module is one unit of work"],
    ["plugin", "A PLUGIN runs on the control node and extends Ansible itself"],
    ["collection", "The module's full name: namespace, collection, module"],
    ["role", "A ROLE is a folder with a fixed layout"],
    ["handler", "A handler is a task that waits"],
    [
      "facts",
      "Every play starts by running setup on each host to collect its facts",
    ],
    ["variables", "Facts describe the host"],
    ["templating", "The host never sees the braces"],
    ["conditionals", "If it is false the task is skipped"],
    ["patterns", "take a pattern, not only a group name"],
    ["privilege escalation", "Run the module as root, using sudo"],
    [
      "idempotency",
      "Idempotent means running it twice does the same as running it once",
    ],
    ["the verdicts", "A verdict describes the host, not the task"],
    ["vault", "Encrypts a whole file with a password"],
  ];

  /**
   * Every remaining chapter of those guides, and why it is not here. Four
   * entries left this list when the page grew to cover them — Ansible-Pull,
   * Play Argument Validation, How variables are merged and Execution
   * Environments — which is the direction this list is supposed to move in.
   */
  const OMITTED: [string, string][] = [
    ["Python3 in templates", "version trivia"],
    ["The now function", "version trivia"],
    ["The undef function", "version trivia"],
    [
      "Language-specific version managers",
      "rvm and nvm, not an Ansible concept",
    ],
    ["Search paths (config, task)", "reference material"],
    ["Unsafe or raw strings", "reference material"],
    ["YAML anchors and aliases", "YAML, not Ansible"],
    ["Loops and list comprehensions", "reference material"],
    ["Complex type transformations", "reference material"],
    ["Inventory script example: Cobbler", "superseded by inventory plugins"],
    ["Other inventory scripts", "superseded by inventory plugins"],
    ["Static groups of dynamic groups", "a corner of dynamic inventory"],
    ["Limitations of patterns", "reference material"],
    ["Pattern processing order", "reference material"],
    ["Advanced pattern options", "reference material"],
    ["Other connection methods", "ssh is the one that matters"],
    ["ansible-console", "an interactive REPL, not a concept"],
    ["Using --vault-id without a vault ID", "a compatibility corner"],
    [
      "Setting a default vault ID",
      "an ansible.cfg setting, reference material",
    ],
    [
      "Setting a default password source",
      "an ansible.cfg setting, reference material",
    ],
    ["Verifying and downloading collections", "operational detail"],
    ["Installing collections from git, source, offline", "operational detail"],
    [
      "Installing collections with signature verification",
      "operational detail",
    ],
    ["Removing a collection", "operational detail"],
    ["Configuring the ansible-galaxy client", "operational detail"],
    [
      "Using collections in roles",
      "only matters when writing roles for others",
    ],
    ["Using a playbook from a collection", "rarely met before you ship one"],
    ["Collections index", "an index of content, not a concept"],
    ["Modules and plugins index", "an index of content, not a concept"],
    [
      "Module maintenance, support, issue reporting, rejecting modules",
      "project process, not a concept",
    ],
    [
      "Cache, cliconf, netconf, terminal, shell, vars and httpapi plugins; module utilities; docs fragments",
      "not written or configured to learn Ansible",
    ],
    ["Keep it simple", "advice, with no mechanism behind it"],
    ["Use version control", "git, not Ansible"],
    ["Use comments", "advice, with no mechanism behind it"],
    [
      "Avoid configuration-dependent content",
      "advice, with no mechanism behind it",
    ],
    [
      "Try it in staging first",
      "advice; the page teaches --check and --limit instead",
    ],
    ["Alternative directory layout", "one layout is enough to learn from"],
    ["What the sample setup enables", "a summary of the layout above it"],
    [
      "Organizing for deployment or configuration",
      "a way of working, not a feature",
    ],
    ["Managing Windows, BSD and z/OS hosts", "a platform guide, not a concept"],
  ];

  const words = (s: string) => s.trim().split(/\s+/);
  const prosey = (w: string) => /^[a-zA-Z]{2,}$/.test(w);

  it("holds every row to a sentence rather than a keyword", () => {
    // This is what stops the file degrading back into a keyword search. A
    // row whose phrase is three identifiers long can be satisfied by a
    // mention, and a mention is not an explanation.
    for (const [chapter, prose] of COVERED) {
      const w = words(prose);
      expect(
        w.length,
        `${chapter}: "${prose}" is not a phrase`,
      ).toBeGreaterThanOrEqual(5);
      expect(
        prose.length,
        `${chapter}: "${prose}" is too short`,
      ).toBeGreaterThanOrEqual(24);
      expect(
        w.filter(prosey).length,
        `${chapter}: "${prose}" is all identifiers`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  for (const [chapter, prose, literal] of COVERED) {
    it(`explains "${chapter}"`, () => {
      expect(text.includes(prose), `${chapter} :: ${prose}`).toBe(true);
      if (literal) {
        expect(text.includes(literal), `${chapter} :: ${literal}`).toBe(true);
      }
    });
  }

  for (const [concept, prose] of CORE) {
    it(`teaches "${concept}" without a click`, () => {
      expect(standing.includes(prose), `${concept} :: ${prose}`).toBe(true);
    });
  }

  it("keeps the omission list honest", () => {
    // Every omission carries a reason, and none of them is blank. The list
    // is the record; this only stops it rotting into bare names.
    for (const [chapter, why] of OMITTED) {
      expect(chapter.length, "a chapter with no name").toBeGreaterThan(2);
      expect(why.length, `${chapter} has no stated reason`).toBeGreaterThan(8);
    }
    expect(COVERED.length).toBeGreaterThan(OMITTED.length * 2);
  });

  it("names every chapter once", () => {
    const seen = new Set<string>();
    for (const [chapter] of COVERED) {
      expect(seen.has(chapter), `${chapter} is listed twice`).toBe(false);
      seen.add(chapter);
    }
  });
});

describe("/terraform covers Terraform's own documented topics", () => {
  /**
   * The same standard as the Ansible block above, against the same kind of
   * list: every entry here is a section of HashiCorp's own documentation
   * sidebar, so the syllabus is theirs and anyone can re-derive it.
   *
   *   developer.hashicorp.com/terraform/intro
   *   developer.hashicorp.com/terraform/language
   *   developer.hashicorp.com/terraform/language/state
   *   developer.hashicorp.com/terraform/cli
   *
   * Each row carries a phrase of the page's own explanation and, where
   * there is one, the literal a reader must also see. CORE is held to the
   * standing prose — what is on screen before anybody clicks anything.
   */
  const html = readFileSync(join(DIST, "terraform", "index.html"), "utf8");
  const text = readable(html);
  const standing = readable(html.replace(/<script[\s\S]*?<\/script>/g, " "));

  /** [the docs' section, a phrase of the page's explanation, a literal shown] */
  const COVERED: [string, string, string?][] = [
    [
      "Configuration Language",
      "A resource block is a noun, not a verb",
      'resource "aws_vpc" "main"',
    ],
    [
      "The Core Terraform Workflow",
      "works out what it would do, and changes nothing",
      "terraform plan",
    ],
    [
      "Initializing Working Directories",
      "downloads the AWS provider into .terraform/",
      "terraform init",
    ],
    [
      "Provisioning Infrastructure",
      "shows the same plan, asks once, then does it",
      "terraform apply",
    ],
    [
      "Configure providers",
      "How to reach the API: region, and credentials it finds from the environment",
      'provider "aws"',
    ],
    [
      "Resources",
      "Type, then name. Together they make the ADDRESS",
      "aws_vpc.main",
    ],
    [
      "Data sources",
      "A read, not a resource. It asks the provider a question",
      'data "aws_ami" "ubuntu"',
    ],
    ["Variables", "An input. type is worth writing", 'variable "region"'],
    ["Locals", "A name for an expression you use more than once", "locals"],
    [
      "Outputs",
      "A value this stack publishes: to you on screen, to a script",
      'output "vpc_id"',
    ],
    [
      "Modules",
      "A module is a folder with inputs and outputs",
      'module "network"',
    ],
    [
      "Meta-arguments: for_each",
      "One object per key of a map or set",
      "for_each",
    ],
    ["Meta-arguments: count", "One object per number, addressed", "count"],
    [
      "Meta-arguments: depends_on",
      "For the dependency you cannot express as a reference",
      "depends_on",
    ],
    [
      "Meta-arguments: lifecycle",
      "make the new object before taking the old one away",
      "lifecycle",
    ],
    [
      "Meta-arguments: provider version",
      "and leaving it off means a stranger can change your infrastructure",
      "version",
    ],
    [
      "Sensitive data",
      "Treat it like a secret, because it is one",
      "terraform.tfstate",
    ],
    [
      "Backends",
      "State in a bucket instead of beside the file",
      'backend "s3"',
    ],
    ["Search and import", "Adopt an existing object into state", "import {"],
    [
      "State",
      "mapping every address in your file to an ID at the provider",
      "terraform state list",
    ],
    [
      "State: locking",
      "so only one run holds it at a time",
      "use_lockfile = true",
    ],
    [
      "State: remote state",
      "A data source that reads another stack's outputs",
      "terraform_remote_state",
    ],
    [
      "State: refactor",
      "Rename an address in state as part of an ordinary plan",
      "moved {",
    ],
    [
      "State: remove a resource",
      "Forget an object without destroying it",
      "terraform state rm",
    ],
    [
      "State: workspaces",
      "Workspaces share a backend and a configuration",
      "one state per environment",
    ],
    [
      "Expressions",
      "a list built from a collection",
      "[for s in aws_subnet.public : s.id]",
    ],
    [
      "Extend CRUD operations",
      "Run a declared action before or after a create, update or destroy",
      "action_trigger",
    ],
    [
      "Internals: the resource graph",
      "Every reference is an edge",
      "the graph",
    ],
    [
      "Files and configuration structure",
      "the exact provider versions, with checksums",
      ".terraform.lock.hcl",
    ],
    [
      "Inspecting Infrastructure",
      "every attribute it recorded for one object",
      "terraform state show",
    ],
    [
      "Automating Terraform",
      "plan once, review the file, apply exactly that plan",
      "-out=tfplan",
    ],
    [
      "Managing Plugins",
      "Run it once per directory, and again whenever you change a provider",
      "required_providers",
    ],
    [
      "Plan: create",
      "The object does not exist yet. Terraform will make it",
      "+",
    ],
    [
      "Plan: update in place",
      "the API can change this argument without making a new one",
      "~",
    ],
    [
      "Plan: destroy",
      "Deleting code is an instruction to delete infrastructure",
      "-",
    ],
    ["Plan: replace", "so Terraform destroys it and creates a new one", "-/+"],
    [
      "Variable precedence",
      "a default is a floor, not a value",
      "terraform.tfvars",
    ],
    [
      "parallelism",
      "How many objects may be worked on at once",
      "-parallelism",
    ],
    ["drift", "The real world changing underneath you", "-refresh-only"],
    [
      "errors and partial applies",
      "What succeeded is in state. Fix the file and run again",
      "Error: creating",
    ],
    [
      "destroy",
      "Everything in state, in reverse dependency order",
      "terraform destroy",
    ],
    [
      "Intro to Terraform",
      "written down as a file, so the file is the answer to all three",
      "Terraform",
    ],
  ];

  /** what a reader cannot do without, and must meet without clicking */
  const CORE: [string, string][] = [
    ["resource", "A resource block is a noun, not a verb"],
    [
      "provider",
      "How to reach the API: region, and credentials it finds from the environment",
    ],
    ["plan", "works out what it would do, and changes nothing"],
    ["apply", "shows the same plan, asks once, then does it"],
    ["state", "mapping every address in your file to an ID at the provider"],
    ["the address", "Type, then name. Together they make the ADDRESS"],
    ["the graph", "a reference IS a dependency"],
    ["variables", "An input. type is worth writing"],
    ["outputs", "A value this stack publishes: to you on screen, to a script"],
    ["modules", "A module is a folder with inputs and outputs"],
    ["remote state and locking", "so only one run holds it at a time"],
    ["replacement", "so Terraform destroys it and creates a new one"],
    ["drift", "The real world changing underneath you"],
    ["convergence", "The file is a destination, not a journey"],
  ];

  /** the sections of those guides that are deliberately not here */
  const OMITTED: [string, string][] = [
    ["Stacks", "an HCP Terraform feature, not the language"],
    ["Test and validate", "a testing framework for module authors"],
    ["Functions", "a reference list; the page uses expressions and names them"],
    ["Style guide", "formatting advice, with fmt and lint behind it"],
    ["Writing and Modifying Code", "fmt and validate: commands, not concepts"],
    ["CLI Configuration", "the CLI's own settings file, reference material"],
    [
      "Managing Workspaces",
      "named workspaces share one configuration; the page teaches a directory per environment instead, and says why",
    ],
    [
      "Using HCP Terraform",
      "a hosted product; only its place in variable precedence is here",
    ],
    ["Terraform Editions", "which product to buy, not how it works"],
    [
      "Phases of Terraform Adoption",
      "an organisational model, not a mechanism",
    ],
    [
      "Terraform vs. Alternatives",
      "a comparison, and this page is not an argument",
    ],
    [
      "Upgrading and compatibility promises",
      "version trivia; required_version is covered where it is written",
    ],
    ["Provisioners", "the escape hatch the docs themselves call a last resort"],
    ["Alphabetical List of Commands", "an index, not a concept"],
    ["Query blocks", "a recent addition for listing existing objects"],
    [
      "Built-in resources",
      "terraform_data; the one that matters here, terraform_remote_state, is covered",
    ],
  ];

  const words = (s: string) => s.trim().split(/\s+/);
  const prosey = (w: string) => /^[a-zA-Z]{2,}$/.test(w);

  it("holds every row to a sentence rather than a keyword", () => {
    for (const [section, prose] of COVERED) {
      const w = words(prose);
      expect(
        w.length,
        `${section}: "${prose}" is not a phrase`,
      ).toBeGreaterThanOrEqual(5);
      expect(
        prose.length,
        `${section}: "${prose}" is too short`,
      ).toBeGreaterThanOrEqual(24);
      expect(
        w.filter(prosey).length,
        `${section}: "${prose}" is all identifiers`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  for (const [section, prose, literal] of COVERED) {
    it(`explains "${section}"`, () => {
      expect(text.includes(prose), `${section} :: ${prose}`).toBe(true);
      if (literal) {
        expect(text.includes(literal), `${section} :: ${literal}`).toBe(true);
      }
    });
  }

  for (const [concept, prose] of CORE) {
    it(`teaches "${concept}" without a click`, () => {
      expect(standing.includes(prose), `${concept} :: ${prose}`).toBe(true);
    });
  }

  it("keeps the omission list honest", () => {
    for (const [section, why] of OMITTED) {
      expect(section.length, "a section with no name").toBeGreaterThan(2);
      expect(why.length, `${section} has no stated reason`).toBeGreaterThan(8);
    }
    expect(COVERED.length).toBeGreaterThan(OMITTED.length * 2);
  });

  it("names every section once", () => {
    const seen = new Set<string>();
    for (const [section] of COVERED) {
      expect(seen.has(section), `${section} is listed twice`).toBe(false);
      seen.add(section);
    }
  });

  it("ends the guide on the stack the simulation applies", () => {
    /* the page's own continuity claim, checked against the built page:
       the last step's file holds the load balancer and the record, which
       are the two objects Part II spends its two minutes on */
    expect(text).toContain('resource "aws_lb" "app"');
    expect(text).toContain('resource "aws_route53_record" "app"');
    expect(text).toContain("127.2");
  });
});
