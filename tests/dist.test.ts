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
   * The page's purpose is to teach Ansible, and "teaches Ansible" is not
   * something the other tests can see: they check the simulation's
   * arithmetic, not its syllabus.
   *
   * The list below is NOT this repository's opinion of what matters. Each
   * entry is a chapter heading from Ansible's own documentation, so the
   * standard is theirs and can be re-derived by anyone:
   *
   *   docs.ansible.com/ansible/latest/getting_started/index.html
   *   docs.ansible.com/ansible/latest/playbook_guide/index.html
   *   docs.ansible.com/ansible/latest/inventory_guide/index.html
   *
   * Chapters of theirs that are deliberately absent, so the omissions are
   * on the record rather than unnoticed: ansible-pull (a different
   * execution model), Python3-in-templates and the now/undef functions
   * (version trivia), language-specific version managers, search paths,
   * YAML anchors, unsafe strings, list comprehensions and complex type
   * transformations (reference material, not concepts), and play argument
   * validation (only meaningful once you write roles for other people).
   *
   * It reads the BUILT page, because a concept explained in a source
   * comment is explained to nobody, and the needles are words from the
   * explanation rather than the bare keyword — `set_fact`, `ignore_errors`
   * and `vars_prompt` all passed a looser version of this check while being
   * nothing but rows in the precedence table.
   */
  const text = readable(
    readFileSync(join(DIST, "ansible", "index.html"), "utf8"),
  );

  /** [the docs' chapter, what proves the page covers it] */
  const CHAPTERS: [string, string[]][] = [
    // getting_started: Ansible concepts
    ["control node", ["control node"]],
    ["managed nodes need no agent", ["only needs SSH"]],
    ["inventory", ["inventory/hosts.ini"]],
    ["creating a playbook", ["A task is three things"]],
    ["modules", ["A module is one unit of work"]],
    [
      "collections and fully qualified names",
      ["namespace, collection, module"],
    ],

    // playbook_guide: Ansible playbooks
    ["playbook syntax: plays", ["PLAY [Web tier]"]],
    ["playbook execution order", ["Tasks run from top to bottom"]],
    ["verifying playbooks", ["--syntax-check", "ansible-lint"]],

    // playbook_guide: Working with playbooks
    ["templating (Jinja2)", ["The host never sees the braces"]],
    ["using filters to manipulate data", ["A Jinja filter"]],
    ["tests", ["A Jinja test"]],
    ["lookups", ["lookup('file'", "lookup("]],
    ["loops", ["item is the loop variable"]],
    [
      "delegation and local actions",
      ["Run this task somewhere else", "run_once"],
    ],
    ["conditionals", ["If it is false, the task is skipped"]],
    ["blocks", ["Ansible runs rescue instead of dropping the host"]],
    ["handlers: running operations on change", ["Queues the handler by name"]],
    [
      "error handling in playbooks",
      ["Decides what counts as a failure", "Carry on even if this task fails"],
    ],
    ["setting the remote environment", ["environment:"]],
    [
      "reusing artifacts: import vs include",
      ["The role name cannot be a variable"],
    ],
    ["roles", ["Run these roles before"]],
    ["module defaults", ["module_defaults"]],
    ["interactive input: prompts", ["vars_prompt"]],
    ["using variables", ["Names you set once and use below"]],
    ["variable precedence", ["Twenty-two levels"]],
    ["discovering variables: facts", ["about 1,200 facts"]],
    ["magic variables", ["A magic variable", "hostvars"]],
    ["rolling upgrades", ["Run the whole play on one host at a time"]],

    // playbook_guide: Executing playbooks
    ["check mode and diff mode", ["A dry run"]],
    ["privilege escalation: become", ["Short for become"]],
    ["tags", ["Labels on tasks or roles"]],
    ["troubleshooting with verbosity", ["-vvv adds the SSH commands"]],
    ["debugging tasks", ["ansible.builtin.debug"]],
    ["asynchronous actions and polling", ["async:"]],
    ["strategies and forks", ["no host starts a task until every host"]],

    // inventory_guide
    ["inventory basics: hosts and groups", ["prod:children"]],
    ["host and group variables", ["group_vars", "host_vars"]],
    ["dynamic inventory", ["inventory plugin"]],
    ["patterns: targeting hosts and groups", ["webservers:!web3"]],
    [
      "connecting to hosts: behavioral parameters",
      ["ansible_python_interpreter"],
    ],
    ["ControlPersist", ["ControlPersist"]],

    // things this page teaches that the guides above cover elsewhere
    ["vault", ["Encrypts a whole file with a password"]],
    ["no_log", ["Stops a task printing its arguments"]],
    ["idempotency", ["Idempotent means running it twice"]],
    [
      "ok, changed, skipped, failed, unreachable",
      ["could not be reached at all"],
    ],
    ["fact caching", ["reads facts that an earlier run saved"]],
    ["pipelining", ["pipelining = True"]],
    ["set_fact", ["Makes a new variable during the run"]],
    ["until and retries", ["Retry a task until a condition holds"]],
    ["ad-hoc commands", ["ansible -i inventory"]],
    ["ansible-doc", ["ansible-doc"]],
    ["ansible-galaxy", ["ansible-galaxy install -r"]],
  ];

  for (const [chapter, needles] of CHAPTERS) {
    it(`covers "${chapter}"`, () => {
      expect(
        needles.some(n => text.includes(n)),
        chapter,
      ).toBe(true);
    });
  }
});
