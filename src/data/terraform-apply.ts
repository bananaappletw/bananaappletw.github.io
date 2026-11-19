/**
 * /terraform — one `terraform apply`, as a graph and as a schedule.
 *
 * Ansible's page is a GRID: tasks down, hosts across, because a run is the
 * same list repeated against several machines. Terraform is not that shape
 * at all. It is a GRAPH walked once: thirteen objects, each waiting on the
 * ones it refers to, with as many in flight as `-parallelism` allows. The
 * lesson of the picture is the critical path — the load balancer takes
 * ninety seconds and nothing can hurry it, so the only number that moves
 * the total is the one on the slowest chain, never the one on the knob.
 *
 * Every duration here is a plausible AWS API create time, not a measured
 * one, and the page says so. What is exact is the SHAPE: which object
 * waits on which, what a change does to the plan, and which of the four
 * plan actions each object gets. That is the part a reader can carry to
 * their own stack, and the part the tests hold still.
 */

/* ── the stack ─────────────────────────────────────────────────────────── */

export type Action = "create" | "update" | "replace" | "read" | "noop";

export type Arg = {
  name: string;
  value: string;
  /** what this argument is for, in a reader's terms */
  note?: string;
  /** changing it cannot be done in place */
  forcesNew?: boolean;
};

export type Res = {
  /** the resource address, which is how Terraform names it everywhere */
  addr: string;
  type: string;
  /** what it is, in plain English */
  what: string;
  kind: "managed" | "data";
  /** addresses this one refers to, which is the whole of the graph */
  deps: string[];
  /** seconds the provider's API takes, roughly */
  createS: number;
  destroyS: number;
  args: Arg[];
  /** the line as it appears in the file */
  hcl: string[];
};

const r = (res: Res) => res;

export const RESOURCES: Res[] = [
  r({
    addr: "data.aws_ami.ubuntu",
    type: "aws_ami",
    kind: "data",
    what: "Asks AWS for the newest Ubuntu image rather than pinning an ID that goes stale.",
    deps: [],
    createS: 0.6,
    destroyS: 0,
    args: [
      { name: "most_recent", value: "true" },
      {
        name: "owners",
        value: '["099720109477"]',
        note: "Canonical's account",
      },
      {
        name: "filter.name",
        value: "ubuntu/images/hvm-ssd/*24.04-amd64-server-*",
      },
    ],
    hcl: [
      'data "aws_ami" "ubuntu" {',
      "  most_recent = true",
      '  owners      = ["099720109477"]',
      "  filter {",
      '    name   = "name"',
      '    values = ["ubuntu/images/hvm-ssd/*24.04-amd64-server-*"]',
      "  }",
      "}",
    ],
  }),
  r({
    addr: "aws_vpc.main",
    type: "aws_vpc",
    kind: "managed",
    what: "The private network everything else lives in. Nothing can be created before it exists.",
    deps: [],
    createS: 2,
    destroyS: 1.5,
    args: [
      {
        name: "cidr_block",
        value: '"10.0.0.0/16"',
        forcesNew: true,
        note: "The address range. It cannot be changed afterwards, so changing it here destroys everything inside.",
      },
      { name: "enable_dns_hostnames", value: "true" },
    ],
    hcl: [
      'resource "aws_vpc" "main" {',
      '  cidr_block           = "10.0.0.0/16"',
      "  enable_dns_hostnames = true",
      '  tags = { Name = "app" }',
      "}",
    ],
  }),
  r({
    addr: "aws_internet_gateway.gw",
    type: "aws_internet_gateway",
    kind: "managed",
    what: "The door to the internet. Attached to the VPC, which is why it waits for it.",
    deps: ["aws_vpc.main"],
    createS: 3,
    destroyS: 2,
    args: [
      {
        name: "vpc_id",
        value: "aws_vpc.main.id",
        note: "This reference IS the dependency. Nobody wrote depends_on.",
      },
    ],
    hcl: [
      'resource "aws_internet_gateway" "gw" {',
      "  vpc_id = aws_vpc.main.id",
      "}",
    ],
  }),
  r({
    addr: 'aws_subnet.public["a"]',
    type: "aws_subnet",
    kind: "managed",
    what: "A slice of the VPC in one availability zone.",
    deps: ["aws_vpc.main"],
    createS: 1.4,
    destroyS: 1,
    args: [
      { name: "vpc_id", value: "aws_vpc.main.id" },
      { name: "cidr_block", value: '"10.0.1.0/24"', forcesNew: true },
      { name: "availability_zone", value: '"eu-west-1a"', forcesNew: true },
    ],
    hcl: [
      'resource "aws_subnet" "public" {',
      "  for_each          = var.zones",
      "  vpc_id            = aws_vpc.main.id",
      "  cidr_block        = each.value",
      "  availability_zone = each.key",
      "}",
    ],
  }),
  r({
    addr: 'aws_subnet.public["b"]',
    type: "aws_subnet",
    kind: "managed",
    what: "The same resource block, a second instance. for_each made two of them from one map.",
    deps: ["aws_vpc.main"],
    createS: 1.4,
    destroyS: 1,
    args: [
      { name: "vpc_id", value: "aws_vpc.main.id" },
      { name: "cidr_block", value: '"10.0.2.0/24"', forcesNew: true },
      { name: "availability_zone", value: '"eu-west-1b"', forcesNew: true },
    ],
    hcl: [],
  }),
  r({
    addr: "aws_route_table.public",
    type: "aws_route_table",
    kind: "managed",
    what: "Says that anything not local goes out of the gateway.",
    deps: ["aws_vpc.main", "aws_internet_gateway.gw"],
    createS: 1.2,
    destroyS: 1,
    args: [
      { name: "vpc_id", value: "aws_vpc.main.id" },
      { name: "route.gateway_id", value: "aws_internet_gateway.gw.id" },
    ],
    hcl: [
      'resource "aws_route_table" "public" {',
      "  vpc_id = aws_vpc.main.id",
      "  route {",
      '    cidr_block = "0.0.0.0/0"',
      "    gateway_id = aws_internet_gateway.gw.id",
      "  }",
      "}",
    ],
  }),
  r({
    addr: 'aws_route_table_association.public["a"]',
    type: "aws_route_table_association",
    kind: "managed",
    what: "Ties one subnet to that route table. Small, fast, and it waits for both.",
    deps: ['aws_subnet.public["a"]', "aws_route_table.public"],
    createS: 0.8,
    destroyS: 0.6,
    args: [
      { name: "subnet_id", value: 'aws_subnet.public["a"].id' },
      { name: "route_table_id", value: "aws_route_table.public.id" },
    ],
    hcl: [
      'resource "aws_route_table_association" "public" {',
      "  for_each       = aws_subnet.public",
      "  subnet_id      = each.value.id",
      "  route_table_id = aws_route_table.public.id",
      "}",
    ],
  }),
  r({
    addr: 'aws_route_table_association.public["b"]',
    type: "aws_route_table_association",
    kind: "managed",
    what: "The second association, from the same block.",
    deps: ['aws_subnet.public["b"]', "aws_route_table.public"],
    createS: 0.8,
    destroyS: 0.6,
    args: [
      { name: "subnet_id", value: 'aws_subnet.public["b"].id' },
      { name: "route_table_id", value: "aws_route_table.public.id" },
    ],
    hcl: [],
  }),
  r({
    addr: "aws_security_group.web",
    type: "aws_security_group",
    kind: "managed",
    what: "The firewall rules. Ports 80 and 443 in, everything out.",
    deps: ["aws_vpc.main"],
    createS: 2.2,
    destroyS: 1.8,
    args: [
      { name: "vpc_id", value: "aws_vpc.main.id", forcesNew: true },
      { name: "ingress", value: "80, 443 from 0.0.0.0/0" },
    ],
    hcl: [
      'resource "aws_security_group" "web" {',
      '  name_prefix = "web-"',
      "  vpc_id      = aws_vpc.main.id",
      "  ingress {",
      "    from_port   = 443",
      "    to_port     = 443",
      '    protocol    = "tcp"',
      '    cidr_blocks = ["0.0.0.0/0"]',
      "  }",
      "  lifecycle {",
      "    create_before_destroy = true",
      "  }",
      "}",
    ],
  }),
  r({
    addr: 'aws_instance.web["a"]',
    type: "aws_instance",
    kind: "managed",
    what: "A machine. Twenty-four seconds, and the first thing on this page that takes real time.",
    deps: [
      "data.aws_ami.ubuntu",
      'aws_subnet.public["a"]',
      "aws_security_group.web",
    ],
    createS: 24,
    destroyS: 18,
    args: [
      { name: "ami", value: "data.aws_ami.ubuntu.id" },
      {
        name: "instance_type",
        value: "var.instance_type",
        note: "Changing this is an update in place: the provider stops the machine, changes it and starts it again.",
      },
      {
        name: "subnet_id",
        value: 'aws_subnet.public["a"].id',
        forcesNew: true,
        note: "A machine cannot move between subnets, so changing this is a replacement.",
      },
    ],
    hcl: [
      'resource "aws_instance" "web" {',
      "  for_each      = aws_subnet.public",
      "  ami           = data.aws_ami.ubuntu.id",
      "  instance_type = var.instance_type",
      "  subnet_id     = each.value.id",
      "  vpc_security_group_ids = [aws_security_group.web.id]",
      "}",
    ],
  }),
  r({
    addr: 'aws_instance.web["b"]',
    type: "aws_instance",
    kind: "managed",
    what: "The second machine, in the other zone. Nothing makes it wait for the first.",
    deps: [
      "data.aws_ami.ubuntu",
      'aws_subnet.public["b"]',
      "aws_security_group.web",
    ],
    createS: 24,
    destroyS: 18,
    args: [
      { name: "ami", value: "data.aws_ami.ubuntu.id" },
      { name: "instance_type", value: "var.instance_type" },
      {
        name: "subnet_id",
        value: 'aws_subnet.public["b"].id',
        forcesNew: true,
      },
    ],
    hcl: [],
  }),
  r({
    addr: "aws_lb.app",
    type: "aws_lb",
    kind: "managed",
    what: "The load balancer. Ninety-two seconds, and it is the reason the whole apply takes two minutes.",
    deps: [
      'aws_subnet.public["a"]',
      'aws_subnet.public["b"]',
      "aws_security_group.web",
    ],
    createS: 92,
    destroyS: 40,
    args: [
      { name: "subnets", value: "every subnet in aws_subnet.public" },
      { name: "security_groups", value: "[aws_security_group.web.id]" },
      { name: "internal", value: "false", forcesNew: true },
    ],
    hcl: [
      'resource "aws_lb" "app" {',
      '  name               = "app"',
      '  load_balancer_type = "application"',
      "  subnets            = [for s in aws_subnet.public : s.id]",
      "  security_groups    = [aws_security_group.web.id]",
      "}",
    ],
  }),
  r({
    addr: "aws_route53_record.app",
    type: "aws_route53_record",
    kind: "managed",
    what: "The name people type. It cannot be written until the load balancer has an address to point at.",
    deps: ["aws_lb.app"],
    createS: 31,
    destroyS: 25,
    args: [
      { name: "name", value: '"app.example.com"', forcesNew: true },
      {
        name: "alias.name",
        value: "aws_lb.app.dns_name",
        note: "The last link in the chain, and the reason the critical path ends here.",
      },
    ],
    hcl: [
      'resource "aws_route53_record" "app" {',
      "  zone_id = var.zone_id",
      '  name    = "app.example.com"',
      '  type    = "A"',
      "  alias {",
      "    name                   = aws_lb.app.dns_name",
      "    zone_id                = aws_lb.app.zone_id",
      "    evaluate_target_health = true",
      "  }",
      "}",
    ],
  }),
];

export const BY_ADDR: Record<string, Res> = Object.fromEntries(
  RESOURCES.map(res => [res.addr, res]),
);

/** Every edge of the graph, which is every reference anyone wrote. */
export const EDGES: { from: string; to: string }[] = RESOURCES.flatMap(res =>
  res.deps.map(dep => ({ from: dep, to: res.addr })),
);

/* ── the three plans ───────────────────────────────────────────────────── */

export type Change = "create" | "update" | "replace";

/**
 * What each change does to each object. A plan is not a list of what you
 * changed; it is a list of what Terraform must do about it, and the second
 * is always longer than the first.
 */
export const ACTIONS: Record<Change, Record<string, Action>> = {
  create: Object.fromEntries(
    RESOURCES.map(res => [res.addr, res.kind === "data" ? "read" : "create"]),
  ),
  update: Object.fromEntries(
    RESOURCES.map(res => [
      res.addr,
      res.kind === "data"
        ? "read"
        : res.addr.startsWith("aws_instance.")
          ? "update"
          : "noop",
    ]),
  ),
  replace: Object.fromEntries(
    RESOURCES.map(res => [
      res.addr,
      res.kind === "data"
        ? "read"
        : res.addr.startsWith("aws_instance.")
          ? "replace"
          : "noop",
    ]),
  ),
};

export const CHANGES: {
  id: Change;
  name: string;
  edit: string;
  what: string;
}[] = [
  {
    id: "create",
    name: "first apply",
    edit: "nothing exists yet",
    what: "Thirteen objects, none of which exist. Every edge in the graph is a wait.",
  },
  {
    id: "update",
    name: "change instance_type",
    edit: 'instance_type = "t3.small"',
    what: "One line, two objects, and both can be changed where they stand. Nothing downstream notices.",
  },
  {
    id: "replace",
    name: "move them to new subnets",
    edit: "subnet_id = (a different subnet)",
    what: "The same two objects, but a machine cannot move. Terraform must destroy and create each one, and that is where create_before_destroy earns its keep.",
  },
];

/* ── the walk ──────────────────────────────────────────────────────────── */

export type RunOptions = {
  /** -parallelism: how many objects may be in flight at once */
  parallelism: number;
  change: Change;
  /** lifecycle { create_before_destroy = true } on the replaced objects */
  cbd: boolean;
  /** whether the run refreshes state first */
  refresh: boolean;
};

export const DEFAULTS: RunOptions = {
  parallelism: 10,
  change: "create",
  cbd: false,
  refresh: true,
};

export const PARALLELISMS = [1, 5, 10, 20];

export type Slot = {
  addr: string;
  action: Action;
  /** the part of the work this bar is: a refresh, a destroy, or the thing itself */
  part: "refresh" | "destroy" | "create" | "update" | "read";
  start: number;
  end: number;
};

export type Schedule = {
  slots: Slot[];
  end: number;
  critical: string[];
  /**
   * Seconds in which a replaced object does not exist: destroyed, not yet
   * re-created. This is the number `create_before_destroy` moves, and it
   * does not move the total at all — which is the whole lesson of it.
   */
  outage: number;
  /** the most objects in flight at once: the width of the graph */
  peak: number;
};

/** seconds a refresh of one existing object costs */
const REFRESH_S = 0.4;

const work = (
  res: Res,
  action: Action,
): { part: Slot["part"]; s: number }[] => {
  if (action === "read") return [{ part: "read", s: res.createS }];
  if (action === "create") return [{ part: "create", s: res.createS }];
  if (action === "update") return [{ part: "update", s: 3 }];
  if (action === "replace")
    return [
      { part: "destroy", s: res.destroyS },
      { part: "create", s: res.createS },
    ];
  return [];
};

/**
 * Walk the graph with a semaphore. An object may start when everything it
 * refers to has finished and a slot is free, which is exactly what
 * `-parallelism` limits and exactly why raising it past the width of the
 * graph buys nothing.
 */
export const buildSchedule = (opt: RunOptions = DEFAULTS): Schedule => {
  const actions = ACTIONS[opt.change];
  const slots: Slot[] = [];
  const done: Record<string, number> = {};
  const existing = opt.change !== "create";

  /* The refresh happens first, against what is already there. It is read-only
     and it is why `terraform plan` on a big estate is slow even when the
     answer turns out to be "no changes". */
  let clock = 0;
  if (opt.refresh && existing) {
    const managed = RESOURCES.filter(res => res.kind === "managed");
    let t = 0;
    managed.forEach((res, i) => {
      const lane = Math.floor(i / opt.parallelism);
      const start = lane * REFRESH_S;
      slots.push({
        addr: res.addr,
        action: "read",
        part: "refresh",
        start,
        end: start + REFRESH_S,
      });
      t = Math.max(t, start + REFRESH_S);
    });
    clock = t;
  }

  /* Then the walk itself. Times are continuous, so the queue is driven by
     the next moment anything finishes rather than by a tick. */
  const pending = new Set(
    RESOURCES.filter(res => (actions[res.addr] ?? "noop") !== "noop").map(
      res => res.addr,
    ),
  );
  for (const res of RESOURCES) {
    if (!pending.has(res.addr)) done[res.addr] = clock;
  }

  const inFlight: { addr: string; freeAt: number }[] = [];
  let now = clock;
  let guard = 0;

  while ((pending.size || inFlight.length) && guard++ < 10_000) {
    const ready = [...pending].filter(addr =>
      BY_ADDR[addr].deps.every(
        dep => done[dep] !== undefined && done[dep] <= now,
      ),
    );

    while (ready.length && inFlight.length < opt.parallelism) {
      const addr = ready.shift()!;
      pending.delete(addr);
      const res = BY_ADDR[addr];
      const action = actions[addr];
      const parts = work(res, action);

      /* create_before_destroy reverses a replacement: the new object exists
         before the old one is taken away, so whatever referred to it is
         never left pointing at nothing. */
      const ordered =
        action === "replace" && opt.cbd ? [...parts].reverse() : parts;

      let t = now;
      for (const piece of ordered) {
        slots.push({
          addr,
          action,
          part: piece.part,
          start: t,
          end: t + piece.s,
        });
        t += piece.s;
      }
      /* With create_before_destroy the dependents may move on as soon as the
         replacement exists, which is the whole point of it. */
      const readyAt = action === "replace" && opt.cbd ? now + ordered[0].s : t;
      done[addr] = readyAt;
      inFlight.push({ addr, freeAt: t });
    }

    if (!inFlight.length) {
      /* Nothing can start yet: jump to the next moment something lands. */
      const next = Math.min(
        ...[...pending]
          .flatMap(addr => BY_ADDR[addr].deps)
          .map(dep => done[dep] ?? Infinity)
          .filter(t => t > now),
      );
      if (!Number.isFinite(next)) break;
      now = next;
      continue;
    }

    inFlight.sort((a, b) => a.freeAt - b.freeAt);
    now = inFlight[0].freeAt;
    while (inFlight.length && inFlight[0].freeAt <= now) inFlight.shift();
  }

  const end = slots.reduce((max, slot) => Math.max(max, slot.end), 0);

  /* The critical path: walk backwards from whatever finished last, taking
     the dependency that held it up each time. It is the only chain whose
     length the knob cannot change. */
  const critical: string[] = [];
  let at = slots.reduce(
    (last, slot) => (slot.end >= (last?.end ?? -1) ? slot : last),
    undefined as Slot | undefined,
  )?.addr;
  const seen = new Set<string>();
  while (at && !seen.has(at)) {
    seen.add(at);
    critical.unshift(at);
    const deps = BY_ADDR[at].deps.filter(dep => done[dep] !== undefined);
    at = deps.sort((a, b) => (done[b] ?? 0) - (done[a] ?? 0))[0];
  }

  /* The window in which a replaced object is gone. Without
     create_before_destroy it is the length of the create that follows the
     destroy; with it there is no window at all. */
  let outage = 0;
  for (const res of RESOURCES) {
    if (actions[res.addr] !== "replace") continue;
    const mine = slots
      .filter(slot => slot.addr === res.addr)
      .sort((a, b) => a.start - b.start);
    const destroy = mine.find(slot => slot.part === "destroy");
    const create = mine.find(slot => slot.part === "create");
    if (destroy && create && create.start >= destroy.end) {
      outage += create.end - destroy.end;
    }
  }

  /* The widest the walk ever gets, refreshes left out: they are read-only
     and they would hide the shape of the graph behind twelve parallel
     reads of things that are already there. */
  const walked = slots.filter(slot => slot.part !== "refresh");
  const peak = walked
    .flatMap(slot => [slot.start, slot.end])
    .reduce((most, at) => {
      const live = new Set(
        walked.filter(s => s.start <= at && s.end > at).map(s => s.addr),
      );
      return Math.max(most, live.size);
    }, 0);

  return { slots, end, critical, outage, peak };
};

/** every combination the page precomputes, so the knobs are instant */
export const ALL_OPTIONS: RunOptions[] = PARALLELISMS.flatMap(parallelism =>
  (["create", "update", "replace"] as Change[]).flatMap(change =>
    [false, true].flatMap(cbd =>
      [true, false].map(refresh => ({ parallelism, change, cbd, refresh })),
    ),
  ),
);

export const optionKey = (opt: RunOptions) =>
  `${opt.parallelism}|${opt.change}|${opt.cbd ? "cbd" : "plain"}|${
    opt.refresh ? "refresh" : "norefresh"
  }`;

/* ── reference ─────────────────────────────────────────────────────────── */

/**
 * The four actions a plan can take, in the words the CLI uses. The plan
 * command's own table lists exactly these four symbols and no more, so the
 * page does not invent a fifth.
 */
export const SYMBOLS: {
  sign: string;
  name: string;
  what: string;
  note?: string;
}[] = [
  {
    sign: "+",
    name: "create",
    what: "The object does not exist yet. Terraform will make it.",
  },
  {
    sign: "~",
    name: "update in place",
    what: "The object exists and the API can change this argument without making a new one.",
  },
  {
    sign: "-",
    name: "destroy",
    what: "The object exists in state but is no longer in the configuration.",
    note: "This is what a deleted block means. Removing code is an instruction to remove infrastructure.",
  },
  {
    sign: "-/+",
    name: "replace",
    what: "The argument that changed cannot be changed on a live object, so Terraform destroys it and creates a new one.",
    note: "The plan prints `# forces replacement` beside the guilty line. With `create_before_destroy` the order reverses, and the plan says so.",
  },
];

/**
 * Terraform's own precedence list, highest first. Unlike Ansible's
 * twenty-two levels this one is short enough to remember, and the only
 * surprise is at the bottom: a default is a floor, not a value.
 */
export const PRECEDENCE: { n: number; source: string; note?: string }[] = [
  {
    n: 1,
    source: "-var and -var-file on the command line",
    note: "In the order given, so the last one wins. HCP Terraform's own variables sit here too.",
  },
  { n: 2, source: "*.auto.tfvars and *.auto.tfvars.json, in lexical order" },
  { n: 3, source: "terraform.tfvars.json" },
  {
    n: 4,
    source: "terraform.tfvars",
    note: "The file most repositories actually use, and the one people forget is beaten by anything on the command line.",
  },
  {
    n: 5,
    source: "Environment variables named TF_VAR_name",
    note: "How CI passes a secret in without writing it to a file.",
  },
  {
    n: 6,
    source: "the variable block's own default",
    note: "The lowest level there is. A default is what happens when nobody said anything.",
  },
];

/** The lifecycle block, which is where you argue with the plan. */
export const LIFECYCLE: { name: string; what: string }[] = [
  {
    name: "create_before_destroy",
    what: "On a replacement, make the new object before taking the old one away. The fix for an outage in the middle of an apply, and the reason a security group needs name_prefix rather than name.",
  },
  {
    name: "prevent_destroy",
    what: "Refuse any plan that would destroy this object. It does not stop you deleting the block — it stops the plan that would follow.",
  },
  {
    name: "ignore_changes",
    what: "Stop planning updates for these arguments. For the tag something else writes, or the image ID a deploy pipeline moves. `all` ignores every argument.",
  },
  {
    name: "replace_triggered_by",
    what: "Replace this object when something else changes, even though nothing about this one did.",
  },
  {
    name: "precondition / postcondition",
    what: "Check an assumption before the object is made, or a promise after. A failed postcondition stops everything downstream.",
  },
  {
    name: "destroy = false",
    what: "Take the object out of state and leave the real thing running.",
  },
  {
    name: "action_trigger",
    what: "Run a declared action before or after a create, update or destroy, with on_failure deciding whether a failure halts the run.",
  },
];

/** The commands that touch state, and what each is for. */
export const STATE_CMDS: { cmd: string; what: string }[] = [
  { cmd: "terraform state list", what: "every address Terraform is holding" },
  {
    cmd: "terraform state show aws_lb.app",
    what: "every attribute it recorded for one object",
  },
  {
    cmd: "terraform state mv A B",
    what: "rename in state without touching infrastructure — the manual form of a moved block",
  },
  {
    cmd: "terraform state rm aws_instance.web",
    what: "forget an object without destroying it; the next plan will want to create it again",
  },
  {
    cmd: "terraform plan -refresh-only",
    what: "show what drifted in the real world, and change nothing",
  },
  {
    cmd: "terraform force-unlock LOCK_ID",
    what: "the last resort when a run died holding the lock",
  },
];

/** Where the files go, and which of them you must never commit. */
export const LAYOUT: { path: string; depth: number; note: string }[] = [
  { path: "main.tf", depth: 0, note: "resources; the file this page builds" },
  { path: "variables.tf", depth: 0, note: "what this stack takes" },
  { path: "outputs.tf", depth: 0, note: "what it gives back" },
  {
    path: "versions.tf",
    depth: 0,
    note: "required_version and required_providers",
  },
  {
    path: "terraform.tfvars",
    depth: 0,
    note: "values for this copy of the stack — often git-ignored",
  },
  {
    path: ".terraform.lock.hcl",
    depth: 0,
    note: "the exact provider versions, with checksums. COMMIT this one",
  },
  {
    path: ".terraform/",
    depth: 0,
    note: "downloaded providers and modules. Never committed, always re-creatable with init",
  },
  {
    path: "terraform.tfstate",
    depth: 0,
    note: "local state. Fine alone, wrong in a team, and full of secrets either way",
  },
  {
    path: "modules/",
    depth: 0,
    note: 'your own, called with source = "./modules/x"',
  },
  { path: "network/", depth: 1, note: "one folder per module" },
  {
    path: "envs/",
    depth: 0,
    note: "the other common shape: one folder per environment",
  },
  { path: "production/", depth: 1, note: "its own backend, its own state" },
  { path: "staging/", depth: 1, note: "the same modules, different values" },
];

/** The three lines of an apply, as the CLI prints them. */
export const RECAP = {
  create: "Apply complete! Resources: 12 added, 0 changed, 0 destroyed.",
  update: "Apply complete! Resources: 0 added, 2 changed, 0 destroyed.",
  replace: "Apply complete! Resources: 2 added, 0 changed, 2 destroyed.",
};
