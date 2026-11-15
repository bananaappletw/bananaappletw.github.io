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

describe("/ansible explains the concepts it claims to", () => {
  /**
   * The page's whole purpose is to teach Ansible, and "teaches Ansible" is
   * not something the other tests can see: they check the simulation's
   * arithmetic, not its syllabus. This walks a list of the concepts a
   * person actually needs and asserts each one reaches the reader.
   *
   * It reads the BUILT page, because a concept explained only in a source
   * comment is explained to nobody. Each entry names a phrase that can only
   * appear if the concept is genuinely on the page — `set_fact` and
   * `ignore_errors` both passed a looser version of this check while being
   * nothing but rows in the precedence table, so the needles are the words
   * the explanation uses, not the bare keyword.
   */
  const page = readFileSync(join(DIST, "ansible", "index.html"), "utf8");
  const text = readable(page);

  const CONCEPTS: [string, string[]][] = [
    ["control node and managed hosts", ["control node"]],
    ["agentless: SSH and a Python", ["only needs SSH"]],
    ["inventory", ["inventory/hosts.ini"]],
    ["groups and children", ["prod:children"]],
    ["group_vars and host_vars", ["group_vars", "host_vars"]],
    ["connection variables", ["ansible_host", "ansible_python_interpreter"]],
    ["ansible.cfg", ["ansible.cfg"]],
    ["play and playbook", ["PLAY [Web tier]"]],
    ["task", ["A task is three things"]],
    ["module", ["A module is one unit of work"]],
    [
      "fully qualified names and collections",
      ["namespace, collection, module"],
    ],
    ["become", ["Short for become"]],
    ["handlers and notify", ["Queues the handler by name"]],
    ["roles, used by a play", ["Run these roles before"]],
    ["role layout", ["defaults/main.yml"]],
    [
      "import_role against include_role",
      ["The role name cannot be a variable"],
    ],
    ["galaxy and requirements.yml", ["ansible-galaxy install -r"]],
    ["idempotency", ["Idempotent means running it twice"]],
    [
      "ok against changed",
      ["The module ran, checked, and found nothing to do"],
    ],
    ["skipped", ["skipping: ["]],
    ["failed and unreachable", ["could not be reached at all"]],
    ["facts and gather_facts", ["about 1,200 facts"]],
    ["fact caching", ["reads facts that an earlier run saved"]],
    ["forks", ["how many hosts are worked at once", "forks"]],
    ["strategy", ["no host starts a task until every host"]],
    [
      "serial and rolling deploys",
      ["Run the whole play on one host at a time"],
    ],
    ["pipelining", ["pipelining = True"]],
    ["check mode", ["A dry run"]],
    ["tags", ["Labels on tasks or roles"]],
    ["limit", ["Picks fewer hosts"]],
    ["start-at-task", ["--start-at-task"]],
    ["verbosity", ["-vvv adds the SSH commands"]],
    ["variables", ["Names you set once and use below"]],
    ["variable precedence", ["Twenty-two levels"]],
    ["extra vars win", ["beats everything, and nothing can override it"]],
    ["Jinja renders on the control node", ["The host never sees the braces"]],
    ["Jinja filters", ["default(", "A Jinja filter"]],
    ["Jinja logic", ["{% for", "{% if"]],
    ["template module", ["Fills in a .j2 file on your machine"]],
    ["conditionals", ["If it is false, the task is skipped"]],
    ["loop", ["item is the loop variable"]],
    ["register", ["saves a module's full JSON reply"]],
    ["set_fact", ["Makes a new variable during the run"]],
    ["debug", ["ansible.builtin.debug"]],
    [
      "block, rescue, always",
      ["Ansible runs rescue instead of dropping the host"],
    ],
    ["changed_when", ["stops a read-only command from saying"]],
    ["failed_when", ["Decides what counts as a failure"]],
    ["ignore_errors", ["Carry on even if this task fails"]],
    ["any_errors_fatal", ["stop the whole play on every host"]],
    ["until and retries", ["Retry a task until a condition holds"]],
    ["delegate_to", ["Run this task somewhere else"]],
    ["run_once", ["Run this task on one host only"]],
    ["vault", ["Encrypts a whole file with a password"]],
    ["vault password file", ["--vault-password-file"]],
    ["no_log", ["Stops a task printing its arguments"]],
    ["ad-hoc ansible", ["ansible -i inventory"]],
    ["ansible-playbook", ["ansible-playbook"]],
    ["ansible-doc", ["ansible-doc"]],
  ];

  for (const [concept, needles] of CONCEPTS) {
    it(`explains ${concept}`, () => {
      expect(
        needles.some(n => text.includes(n)),
        concept,
      ).toBe(true);
    });
  }
});
