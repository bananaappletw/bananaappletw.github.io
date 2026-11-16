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
   * It reads the BUILT page, because a concept explained in a source comment
   * is explained to nobody, and the needles are phrases from the explanation
   * rather than the bare keyword. That distinction has caught real defects:
   * `set_fact`, `ignore_errors` and `vars_prompt` all passed a looser check
   * while being nothing but rows in the precedence table, and action plugins
   * were explained only inside a panel reachable by clicking a bar one pixel
   * wide.
   */
  const text = readable(
    readFileSync(join(DIST, "ansible", "index.html"), "utf8"),
  );

  /** [the docs' chapter, a phrase the page's explanation of it contains] */
  const COVERED: [string, string][] = [
    // getting started
    ["Introduction to Ansible", "control node"],
    ["Start automating with Ansible", "ansible -i inventory"],
    ["Building an inventory", "inventory/hosts.ini"],
    ["Creating a playbook", "a playbook is a list of plays"],
    ["Ansible concepts: managed node", "only needs SSH"],
    // playbook guide
    ["Playbook syntax", "PLAY [Web tier]"],
    ["Playbook execution", "Tasks run from top to bottom"],
    ["Verifying playbooks", "--syntax-check"],
    ["Templating (Jinja2)", "The host never sees the braces"],
    ["Using filters to manipulate data", "A Jinja filter"],
    ["Tests", "A Jinja test"],
    ["Lookups", "lookup("],
    ["Loops", "item is the loop variable"],
    ["Delegation and local actions", "Run this task somewhere else"],
    ["Conditionals", "If it is false the task is skipped"],
    ["Blocks", "runs rescue instead of dropping the host"],
    ["Handlers: running operations on change", "Queues the handler by name"],
    ["Error handling in playbooks", "Decides what counts as a failure"],
    ["Setting the remote environment", "Environment variables for the task"],
    ["Reusing Ansible artifacts", "The role name cannot be a variable"],
    ["Roles", "Run these roles before"],
    ["Module defaults", "Set an argument once"],
    ["Interactive input: prompts", "Ask for a value when the run starts"],
    ["Using variables", "Names you set once and use below"],
    ["Variable precedence", "Twenty-two levels"],
    ["Discovering variables: facts", "170 top-level keys"],
    ["Discovering variables: magic variables", "A magic variable"],
    ["Rolling upgrades", "Run the whole play on one host at a time"],
    ["Validating tasks: check mode and diff mode", "A dry run"],
    ["Understanding privilege escalation: become", "Short for become"],
    ["Tags", "Labels on tasks or roles"],
    ["Executing playbooks for troubleshooting", "-vvv adds the SSH commands"],
    ["Debugging tasks", "ansible.builtin.debug"],
    ["Asynchronous actions and polling", "Start a long task without"],
    [
      "Controlling playbook execution: strategies",
      "linear makes every host wait",
    ],
    // inventory guide
    ["Inventory basics: formats, hosts, and groups", "prod:children"],
    ["Passing multiple inventory sources", "can be given more than once"],
    ["Organizing inventory in a directory", "or pointed at a"],
    ["Defining variables in INI format", "[all:vars]"],
    ["Assigning a variable to one machine: host variables", "host_vars"],
    ["Assigning a variable to many machines: group variables", "group_vars"],
    ["Inventory setup examples", "where the files live"],
    ["Working with dynamic inventory", "inventory plugin"],
    ["Patterns: targeting hosts and groups", "webservers:!web3"],
    ["Implicit localhost", "an implicit"],
    [
      "Connecting to hosts: behavioral parameters",
      "ansible_python_interpreter",
    ],
    ["ControlPersist", "ControlPersist"],
    ["Setting a remote user", "ansible_user"],
    ["Setting up SSH keys", "ansible_ssh_private_key_file"],
    ["Running against localhost", "delegate_to: localhost"],
    ["Managing host key checking", "Host key verification failed"],
    // command guide
    ["Introduction to ad hoc commands", "ansible -i inventory"],
    ["ansible-config", "ansible-config"],
    ["ansible-doc", "ansible-doc"],
    ["ansible-galaxy", "ansible-galaxy install -r"],
    ["ansible-inventory", "ansible-inventory"],
    ["ansible-playbook", "ansible-playbook"],
    ["ansible-vault", "ansible-vault"],
    // vault guide
    ["Ansible Vault", "Encrypts a whole file with a password"],
    ["Managing multiple passwords with vault IDs", "--vault-id"],
    ["Storing and accessing vault passwords", "--vault-password-file"],
    ["Encrypting individual variables", "encrypt_string"],
    ["Encrypting files with Ansible Vault", "ansible-vault create"],
    ["Passing a single password", "--ask-vault-pass"],
    [
      "When are encrypted files made visible?",
      "Stops a task printing its arguments",
    ],
    [
      "Format of files encrypted with Ansible Vault",
      "$ANSIBLE_VAULT;1.1;AES256",
    ],
    // collections guide
    [
      "Install multiple collections with a requirements file",
      "requirements.yml",
    ],
    ["Using collections in a playbook", "namespace, collection, module"],
    ["Simplifying module names with the collections keyword", "collections:"],
    // modules and plugins guide
    ["Introduction to modules", "A module is one unit of work"],
    ["Working with plugins", "extends Ansible itself"],
    ["Action plugins", "an ACTION plugin"],
    ["Filter, test and lookup plugins", "A Jinja filter"],
    ["Inventory plugins", "inventory plugin"],
    // tips and tricks
    ["Always name plays, tasks, and blocks", "it is also the name"],
    ["Always mention the state", "It is not a command to run"],
    ["Use fully qualified collection names", "namespace, collection, module"],
    [
      "Separate production and staging inventory",
      "production and staging stay",
    ],
    ["Update in batches", "Run the whole play on one host at a time"],
    ["Handling OS and distro differences", "picks apt instead of dnf"],
    ["Sample directory layout", "where the files live"],
    ["Keep vaulted variables safely visible", "readable in a diff"],
    // taught here, and spread across those guides
    ["Idempotency", "Idempotent means running it twice"],
    [
      "ok, changed, skipped, failed, unreachable",
      "could not be reached at all",
    ],
    ["Fact caching", "fact_caching = jsonfile"],
    ["Pipelining", "pipelining = True"],
    ["set_fact", "Makes a new variable during the run"],
    ["until and retries", "Retry a task until a condition holds"],
    ["forks", "Raising it past the number"],
    // added after an independent review read the page as a learner
    ["the playbook/play/task hierarchy", "a playbook is a list of plays"],
    ["YAML lists and dictionaries", "is an item in a LIST"],
    ["installing Ansible", "pipx install --include-deps ansible"],
    ["the sudo password (-K)", "Missing sudo password"],
    ["reading a failure", "stderr_lines"],
    ["fail and assert", "ansible.builtin.assert"],
    ["command vs shell", "ansible.builtin.shell"],
    ["creates and removes", "creates:"],
    ["loop_control", "loop_control"],
    ["meta: flush_handlers", "flush_handlers"],
    [
      "the always and never tags",
      "runs whatever `--tags` you pass".replace(/`/g, ""),
    ],
    ["pre_tasks and post_tasks", "pre_tasks"],
    ["vars_files", "vars_files"],
    ["what is inside a role", "roles/webserver/tasks/main.yml"],
    ["ansible.cfg discovery order", "ANSIBLE_CONFIG"],
    // added after a second independent review of the live page
    ["when: takes no braces", "ALREADY a Jinja expression"],
    ["discovering what facts exist", "-m setup"],
    ["setting inventory in ansible.cfg", "inventory = inventory/hosts.ini"],
    ["set_fact outlives the play", "lasts for the rest of the RUN"],
    ["cacheable facts", "cacheable: true"],
    ["not every state is idempotent", "always act, and so always report"],
    ["rescued and ignored in the recap", "rescued=0"],
    ["check mode needs supports_check_mode", "supports_check_mode"],
    ["become_user", "become_user: postgres"],
    // closed after the second review named them as mentions, not teaching
    ["become_method", "become_method"],
    ["listen: on handlers", "Lets one"],
    ["YAML inventory", "hosts.yml"],
    ["import_tasks and include_tasks", "import_tasks"],
    ["with_items is the old loop", "with_items"],
    ["--diff output shown", "listen 80;"],
    ["installing a collection", "ansible-galaxy collection install"],
    // the fourth review's two blocking errors, kept from coming back
    ["role defaults are the real floor", "the real floor"],
    ["the two fact spellings", "Same fact, two spellings"],
    ["ansible_play_hosts_all", "ansible_play_hosts_all"],
    ["role argument_specs", "Declares what a role takes"],
    ["role dependencies", "roles listed here run first"],
  ];

  /** every remaining chapter of those guides, and why it is not here */
  const OMITTED: [string, string][] = [
    ["Ansible-Pull", "a different execution model entirely"],
    ["Python3 in templates", "version trivia"],
    ["The now function", "version trivia"],
    ["The undef function", "version trivia"],
    [
      "Language-specific version managers",
      "rvm and nvm, not an Ansible concept",
    ],
    ["Play Argument Validation", "only matters when writing roles for others"],
    ["Search paths (config, task)", "reference material"],
    ["Unsafe or raw strings", "reference material"],
    ["YAML anchors and aliases", "YAML, not Ansible"],
    ["Loops and list comprehensions", "reference material"],
    ["Complex type transformations", "reference material"],
    ["How variables are merged", "hash_behaviour, discouraged by the docs"],
    ["Inventory script example: Cobbler", "superseded by inventory plugins"],
    ["Static groups of dynamic groups", "a corner of dynamic inventory"],
    ["Other connection methods", "ssh is the one that matters"],
    ["ansible-console", "an interactive REPL, not a concept"],
    ["Verifying, listing, downloading collections", "operational detail"],
    ["Installing collections from git, source, offline", "operational detail"],
    [
      "Module maintenance and rejecting modules",
      "project process, not a concept",
    ],
    [
      "Cache, callback, cliconf, netconf, terminal plugins",
      "not written or configured to learn Ansible",
    ],
    [
      "Use Execution Environments",
      "a containerised runtime, a packaging choice",
    ],
    ["Managing Windows, BSD and z/OS hosts", "a platform guide, not a concept"],
  ];

  for (const [chapter, needle] of COVERED) {
    it(`covers "${chapter}"`, () => {
      expect(text.includes(needle), `${chapter} :: ${needle}`).toBe(true);
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
});
