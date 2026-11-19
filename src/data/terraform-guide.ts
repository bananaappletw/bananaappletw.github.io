/**
 * /terraform Part I — one file, written in front of the reader.
 *
 * The same shape as the Ansible page's guide, for the same reason: a page
 * that opens on a finished stack teaches nothing about how anyone arrives
 * at one. So `main.tf` starts empty, grows by a few lines per step, and
 * ends as exactly the stack Part II then applies — which
 * `tests/terraform-guide.test.ts` asserts rather than trusts.
 *
 * Every transcript here is the shape Terraform actually prints: the plan
 * header, the `# forces replacement` comment, the `Plan: a to add, b to
 * change, c to destroy` line, the apply footer. The numbers in them are
 * checked against the file's own contents by the tests, because a
 * transcript that disagrees with the file beside it is worse than no
 * transcript at all.
 */

import { RESOURCES } from "./terraform-apply";

/* ── the file ──────────────────────────────────────────────────────────── */

export type Line = {
  text: string;
  /** the step at which this line appears */
  step: number;
  /** syntax class, for the pane on the left */
  kind?: "block" | "arg" | "comment" | "string" | "ref";
};

const l = (step: number, text: string, kind?: Line["kind"]): Line => ({
  step,
  text,
  kind,
});

/**
 * `main.tf`, line for line, with the step each line arrives at. The order
 * here is the order in the file; the step numbers are what make it grow.
 */
export const FILE: Line[] = [
  l(2, "terraform {", "block"),
  l(2, '  required_version = ">= 1.9"'),
  l(2, "  required_providers {", "block"),
  l(2, "    aws = {"),
  l(2, '      source  = "hashicorp/aws"'),
  l(2, '      version = "~> 5.60"'),
  l(2, "    }"),
  l(2, "  }"),
  l(12, '  backend "s3" {', "block"),
  l(12, '    bucket       = "example-tfstate"'),
  l(12, '    key          = "app/terraform.tfstate"'),
  l(12, '    region       = "eu-west-1"'),
  l(12, "    use_lockfile = true"),
  l(12, "  }"),
  l(2, "}"),
  l(2, ""),
  l(2, 'provider "aws" {', "block"),
  l(7, "  region = var.region", "ref"),
  l(2, "}"),
  l(2, ""),

  l(7, 'variable "region" {', "block"),
  l(7, "  type    = string"),
  l(7, '  default = "eu-west-1"'),
  l(7, "}"),
  l(7, ""),
  l(7, 'variable "instance_type" {', "block"),
  l(7, "  type    = string"),
  l(7, '  default = "t3.micro"'),
  l(7, "}"),
  l(7, ""),
  l(8, 'variable "zones" {', "block"),
  l(8, "  type = map(string)"),
  l(8, "  default = {"),
  l(8, '    "eu-west-1a" = "10.0.1.0/24"'),
  l(8, '    "eu-west-1b" = "10.0.2.0/24"'),
  l(8, "  }"),
  l(8, "}"),
  l(8, ""),
  l(10, 'variable "zone_id" {', "block"),
  l(10, "  type        = string"),
  l(10, '  description = "the Route 53 zone the record goes in"'),
  l(10, "}"),
  l(10, ""),

  l(2, 'resource "aws_vpc" "main" {', "block"),
  l(2, '  cidr_block           = "10.0.0.0/16"'),
  l(2, "  enable_dns_hostnames = true"),
  l(3, '  tags = { Name = "app" }'),
  l(2, "}"),
  l(2, ""),

  l(6, 'resource "aws_internet_gateway" "gw" {', "block"),
  l(6, "  vpc_id = aws_vpc.main.id", "ref"),
  l(6, "}"),
  l(6, ""),
  l(6, 'resource "aws_route_table" "public" {', "block"),
  l(6, "  vpc_id = aws_vpc.main.id", "ref"),
  l(6, "  route {"),
  l(6, '    cidr_block = "0.0.0.0/0"'),
  l(6, "    gateway_id = aws_internet_gateway.gw.id", "ref"),
  l(6, "  }"),
  l(6, "}"),
  l(6, ""),

  l(8, 'resource "aws_subnet" "public" {', "block"),
  l(8, "  for_each          = var.zones", "ref"),
  l(8, "  vpc_id            = aws_vpc.main.id", "ref"),
  l(8, "  cidr_block        = each.value", "ref"),
  l(8, "  availability_zone = each.key", "ref"),
  l(8, "}"),
  l(8, ""),
  l(8, 'resource "aws_route_table_association" "public" {', "block"),
  l(8, "  for_each       = aws_subnet.public", "ref"),
  l(8, "  subnet_id      = each.value.id", "ref"),
  l(8, "  route_table_id = aws_route_table.public.id", "ref"),
  l(8, "}"),
  l(8, ""),
  l(8, 'resource "aws_security_group" "web" {', "block"),
  l(8, '  name_prefix = "web-"'),
  l(8, "  vpc_id      = aws_vpc.main.id", "ref"),
  l(8, "  ingress {"),
  l(8, "    from_port   = 443"),
  l(8, "    to_port     = 443"),
  l(8, '    protocol    = "tcp"'),
  l(8, '    cidr_blocks = ["0.0.0.0/0"]'),
  l(8, "  }"),
  l(9, "  lifecycle {", "block"),
  l(9, "    create_before_destroy = true"),
  l(9, "  }"),
  l(8, "}"),
  l(8, ""),

  l(8, 'data "aws_ami" "ubuntu" {', "block"),
  l(8, "  most_recent = true"),
  l(8, '  owners      = ["099720109477"]'),
  l(8, "  filter {"),
  l(8, '    name   = "name"'),
  l(8, '    values = ["ubuntu/images/hvm-ssd/*24.04-amd64-server-*"]'),
  l(8, "  }"),
  l(8, "}"),
  l(8, ""),
  l(8, 'resource "aws_instance" "web" {', "block"),
  l(8, "  for_each               = aws_subnet.public", "ref"),
  l(8, "  ami                    = data.aws_ami.ubuntu.id", "ref"),
  l(8, "  instance_type          = var.instance_type", "ref"),
  l(8, "  subnet_id              = each.value.id", "ref"),
  l(8, "  vpc_security_group_ids = [aws_security_group.web.id]", "ref"),
  l(8, "}"),
  l(8, ""),

  l(10, 'resource "aws_lb" "app" {', "block"),
  l(10, '  name               = "app"'),
  l(10, '  load_balancer_type = "application"'),
  l(10, "  subnets            = [for s in aws_subnet.public : s.id]", "ref"),
  l(10, "  security_groups    = [aws_security_group.web.id]", "ref"),
  l(10, "}"),
  l(10, ""),
  l(10, 'resource "aws_route53_record" "app" {', "block"),
  l(10, "  zone_id = var.zone_id", "ref"),
  l(10, '  name    = "app.example.com"'),
  l(10, '  type    = "A"'),
  l(10, "  alias {"),
  l(10, "    name                   = aws_lb.app.dns_name", "ref"),
  l(10, "    zone_id                = aws_lb.app.zone_id", "ref"),
  l(10, "    evaluate_target_health = true"),
  l(10, "  }"),
  l(10, "}"),
  l(10, ""),

  l(7, 'output "vpc_id" {', "block"),
  l(7, "  value = aws_vpc.main.id", "ref"),
  l(7, "}"),
];

export const LAST_STEP = 14;

/** the file as it stands at the end of a given step */
export const fileAt = (step: number): (Line & { fresh: boolean })[] =>
  FILE.filter(line => line.step <= step).map(line => ({
    ...line,
    fresh: line.step === step,
  }));

/** which resource addresses exist in the file by this step */
const ADDR_STEP: Record<string, number> = {
  "aws_vpc.main": 2,
  "aws_internet_gateway.gw": 6,
  "aws_route_table.public": 6,
  'aws_subnet.public["a"]': 8,
  'aws_subnet.public["b"]': 8,
  'aws_route_table_association.public["a"]': 8,
  'aws_route_table_association.public["b"]': 8,
  "aws_security_group.web": 8,
  "data.aws_ami.ubuntu": 8,
  'aws_instance.web["a"]': 8,
  'aws_instance.web["b"]': 8,
  "aws_lb.app": 10,
  "aws_route53_record.app": 10,
};

export const addrStep = (addr: string) => ADDR_STEP[addr] ?? Infinity;

export const resourcesAt = (step: number) =>
  RESOURCES.filter(res => addrStep(res.addr) <= step);

/* ── what it prints ────────────────────────────────────────────────────── */

export type OutLine = {
  text: string;
  kind: "plain" | "create" | "update" | "destroy" | "head" | "note" | "ok";
};

const o = (kind: OutLine["kind"], text: string): OutLine => ({ kind, text });

/**
 * The transcript for a step. These are written out rather than generated,
 * because the thing being taught IS the shape of the output, and a
 * generator would quietly smooth over the parts that are strange — the
 * blank line before `Plan:`, the `(known after apply)`, the comment that
 * marks the argument that forces a replacement.
 */
const TRANSCRIPT: Record<number, OutLine[]> = {
  2: [
    o("head", "Terraform will perform the following actions:"),
    o("plain", ""),
    o("create", "  # aws_vpc.main will be created"),
    o("create", '  + resource "aws_vpc" "main" {'),
    o("create", '      + cidr_block           = "10.0.0.0/16"'),
    o("create", "      + enable_dns_hostnames = true"),
    o("create", "      + id                   = (known after apply)"),
    o("create", "      + arn                  = (known after apply)"),
    o("create", "    }"),
    o("plain", ""),
    o("head", "Plan: 1 to add, 0 to change, 0 to destroy."),
    o("plain", ""),
    o("ok", "aws_vpc.main: Creating..."),
    o("ok", "aws_vpc.main: Creation complete after 2s [id=vpc-0a1b2c3d]"),
    o("plain", ""),
    o("ok", "Apply complete! Resources: 1 added, 0 changed, 0 destroyed."),
  ],
  3: [
    o("head", "Terraform will perform the following actions:"),
    o("plain", ""),
    o("update", "  # aws_vpc.main will be updated in-place"),
    o("update", '  ~ resource "aws_vpc" "main" {'),
    o("update", '        id   = "vpc-0a1b2c3d"'),
    o("update", "      + tags = {"),
    o("update", '          + "Name" = "app"'),
    o("update", "        }"),
    o("update", "    }"),
    o("plain", ""),
    o("head", "Plan: 0 to add, 1 to change, 0 to destroy."),
  ],
  4: [
    o("ok", "aws_vpc.main: Refreshing state... [id=vpc-0a1b2c3d]"),
    o("plain", ""),
    o("head", "No changes. Your infrastructure matches the configuration."),
    o(
      "note",
      "Terraform has compared your real infrastructure against your configuration",
    ),
    o("note", "and found no differences, so no changes are needed."),
  ],
  5: [
    o("plain", "aws_vpc.main"),
    o("plain", ""),
    o("note", "# terraform state show aws_vpc.main"),
    o("plain", "# aws_vpc.main:"),
    o("plain", 'resource "aws_vpc" "main" {'),
    o(
      "plain",
      '    arn                  = "arn:aws:ec2:eu-west-1:…:vpc/vpc-0a1b2c3d"',
    ),
    o("plain", '    cidr_block           = "10.0.0.0/16"'),
    o("plain", "    enable_dns_hostnames = true"),
    o("plain", '    id                   = "vpc-0a1b2c3d"'),
    o("plain", '    main_route_table_id  = "rtb-07f1…"'),
    o("plain", "}"),
  ],
  6: [
    o("head", "Terraform will perform the following actions:"),
    o("plain", ""),
    o("create", "  # aws_internet_gateway.gw will be created"),
    o("create", '  + resource "aws_internet_gateway" "gw" {'),
    o("create", '      + vpc_id = "vpc-0a1b2c3d"'),
    o("create", "    }"),
    o("plain", ""),
    o("create", "  # aws_route_table.public will be created"),
    o("create", '  + resource "aws_route_table" "public" {'),
    o("create", "      + route  = ["),
    o("create", "          + {"),
    o("create", '              + cidr_block = "0.0.0.0/0"'),
    o("create", "              + gateway_id = (known after apply)"),
    o("create", "            },"),
    o("create", "        ]"),
    o("create", "    }"),
    o("plain", ""),
    o("head", "Plan: 2 to add, 0 to change, 0 to destroy."),
    o("plain", ""),
    o("ok", "aws_internet_gateway.gw: Creating..."),
    o(
      "ok",
      "aws_internet_gateway.gw: Creation complete after 3s [id=igw-0d4e…]",
    ),
    o("ok", "aws_route_table.public: Creating..."),
    o(
      "ok",
      "aws_route_table.public: Creation complete after 1s [id=rtb-0b9c…]",
    ),
  ],
  7: [
    o("note", "$ terraform apply -var instance_type=t3.small"),
    o("plain", ""),
    o("head", "No changes. Your infrastructure matches the configuration."),
    o("plain", ""),
    o("ok", "Outputs:"),
    o("plain", ""),
    o("ok", 'vpc_id = "vpc-0a1b2c3d"'),
  ],
  8: [
    o("head", "Terraform will perform the following actions:"),
    o("plain", ""),
    o("create", '  # aws_subnet.public["eu-west-1a"] will be created'),
    o("create", '  + resource "aws_subnet" "public" {'),
    o("create", '      + availability_zone = "eu-west-1a"'),
    o("create", '      + cidr_block        = "10.0.1.0/24"'),
    o("create", "    }"),
    o("plain", ""),
    o("create", '  # aws_subnet.public["eu-west-1b"] will be created'),
    o("create", "    … one more, from the same block"),
    o("plain", ""),
    o("create", '  # aws_instance.web["eu-west-1a"] will be created'),
    o("create", '  + resource "aws_instance" "web" {'),
    o("create", "      + ami           = (known after apply)"),
    o("create", '      + instance_type = "t3.micro"'),
    o("create", "      + subnet_id     = (known after apply)"),
    o("create", "    }"),
    o("plain", ""),
    o("head", "Plan: 7 to add, 0 to change, 0 to destroy."),
  ],
  9: [
    o("note", "# changing instance_type only"),
    o("update", '  # aws_instance.web["eu-west-1a"] will be updated in-place'),
    o("update", '  ~ resource "aws_instance" "web" {'),
    o("update", '      ~ instance_type = "t3.micro" -> "t3.small"'),
    o("update", "    }"),
    o("plain", ""),
    o("head", "Plan: 0 to add, 2 to change, 0 to destroy."),
    o("plain", ""),
    o("note", "# changing the subnet instead"),
    o("destroy", '  # aws_instance.web["eu-west-1a"] must be replaced'),
    o("destroy", '-/+ resource "aws_instance" "web" {'),
    o(
      "destroy",
      '      ~ subnet_id     = "subnet-0a1…" -> (known after apply) # forces replacement',
    ),
    o("destroy", "    }"),
    o("plain", ""),
    o("head", "Plan: 2 to add, 0 to change, 2 to destroy."),
  ],
  10: [
    o("head", "Terraform will perform the following actions:"),
    o("plain", ""),
    o("create", "  # aws_lb.app will be created"),
    o("create", '  + resource "aws_lb" "app" {'),
    o("create", '      + name               = "app"'),
    o("create", '      + load_balancer_type = "application"'),
    o("create", "      + dns_name           = (known after apply)"),
    o("create", "    }"),
    o("plain", ""),
    o("create", "  # aws_route53_record.app will be created"),
    o("create", '  + resource "aws_route53_record" "app" {'),
    o("create", '      + name    = "app.example.com"'),
    o("create", "    }"),
    o("plain", ""),
    o("head", "Plan: 2 to add, 0 to change, 0 to destroy."),
    o("plain", ""),
    o("ok", "aws_lb.app: Creating..."),
    o("ok", "aws_lb.app: Still creating... [30s elapsed]"),
    o("ok", "aws_lb.app: Still creating... [1m30s elapsed]"),
    o("ok", "aws_lb.app: Creation complete after 1m32s [id=arn:aws:…]"),
    o("ok", "aws_route53_record.app: Creating..."),
    o("ok", "aws_route53_record.app: Still creating... [30s elapsed]"),
    o("ok", "aws_route53_record.app: Creation complete after 31s"),
    o("plain", ""),
    o("ok", "Apply complete! Resources: 12 added, 0 changed, 0 destroyed."),
  ],
  11: [
    o("note", "$ terraform init"),
    o("plain", ""),
    o("ok", "Initializing modules..."),
    o(
      "ok",
      "Downloading registry.terraform.io/terraform-aws-modules/vpc/aws 5.8.1",
    ),
    o("ok", "- network in .terraform/modules/network"),
    o("plain", ""),
    o("head", "Terraform has been successfully initialized!"),
    o("plain", ""),
    o("create", "  # module.network.aws_vpc.this[0] will be created"),
    o(
      "note",
      "  the address gains a module. prefix, and that is the whole difference",
    ),
  ],
  12: [
    o("note", "$ terraform init -migrate-state"),
    o("plain", ""),
    o("head", "Initializing the backend..."),
    o(
      "note",
      'Terraform detected that the backend type changed from "local" to "s3".',
    ),
    o("ok", "Do you want to copy existing state to the new backend? yes"),
    o("plain", ""),
    o("ok", 'Successfully configured the backend "s3"!'),
    o("plain", ""),
    o("note", "# and when somebody else is already running"),
    o("destroy", "Error: Error acquiring the state lock"),
    o("destroy", "  Lock Info:"),
    o("destroy", "    ID:        9f1c7e2a-…"),
    o("destroy", "    Who:       ci@runner-7"),
    o("destroy", "    Created:   2026-11-19 09:14:02 UTC"),
  ],
  13: [
    o("note", "$ terraform plan -refresh-only"),
    o("plain", ""),
    o("update", "  # aws_security_group.web has changed"),
    o("update", '  ~ resource "aws_security_group" "web" {'),
    o("update", "      ~ ingress = ["),
    o("update", '          + { from_port = 22, cidr_blocks = ["0.0.0.0/0"] },'),
    o("update", "        ]"),
    o("update", "    }"),
    o("plain", ""),
    o(
      "note",
      "This is a refresh-only plan, so Terraform will not take any actions.",
    ),
    o("plain", ""),
    o("note", "$ terraform plan   # the ordinary one, right after"),
    o("destroy", "  ~ ingress = [ - { from_port = 22 … } ]"),
    o(
      "note",
      "  the file is the truth: the next apply takes the rule away again",
    ),
  ],
  14: [
    o("destroy", "Error: creating EC2 Instance: InvalidSubnetID.NotFound:"),
    o("destroy", "The subnet ID 'subnet-0a1b2c3d' does not exist"),
    o("plain", ""),
    o("destroy", '  with aws_instance.web["eu-west-1a"],'),
    o("destroy", '  on main.tf line 61, in resource "aws_instance" "web":'),
    o("destroy", '  61: resource "aws_instance" "web" {'),
    o("plain", ""),
    o("ok", "aws_lb.app: Creation complete after 1m32s"),
    o("plain", ""),
    o("head", "Apply complete! Resources: 11 added, 0 changed, 0 destroyed."),
    o(
      "note",
      "eleven of twelve: what succeeded is in state, and the next apply does the rest",
    ),
    o("plain", ""),
    o("note", "$ terraform destroy   # when the whole thing should go"),
    o("destroy", "  # aws_route53_record.app will be destroyed"),
    o("destroy", '  - resource "aws_route53_record" "app" {'),
    o("destroy", '      - name    = "app.example.com" -> null'),
    o("destroy", "    }"),
    o("plain", ""),
    o("head", "Plan: 0 to add, 0 to change, 12 to destroy."),
    o(
      "note",
      "reverse dependency order: the record goes before the thing it points at",
    ),
  ],
};

export const outputAt = (step: number): OutLine[] => TRANSCRIPT[step] ?? [];

/* ── the steps ─────────────────────────────────────────────────────────── */

export type Keyword = {
  word: string;
  what: string;
  /** the sentence about what happens when you leave it out */
  without?: string;
};

export type Shell = { text: string; note?: string; out?: boolean };

export type Inset = {
  title: string;
  hcl: string[];
  out?: string[];
  note: string;
};

export type Step = {
  n: number;
  title: string;
  lead: string;
  shell?: Shell[];
  keywords?: Keyword[];
  insets?: Inset[];
  /** draw the graph as it stands at this step */
  graph?: boolean;
  takeaway: string;
};

export const STEPS: Step[] = [
  {
    n: 1,
    title: "The problem",
    lead: "You need a network, two machines, a firewall rule, a load balancer and a DNS record. You can click all of it into existence in twenty minutes. Then you need the same thing in a second region, and a colleague needs to know what you did, and six months later something is wrong and nobody can say what changed. Terraform is that click-through written down as a file, so the file is the answer to all three.",
    takeaway:
      "You describe what should exist. Terraform works out what to do about it.",
  },
  {
    n: 2,
    title: "One resource, one file",
    lead: "Start with the smallest thing that is still real: a network. Three blocks — which provider, how to reach it, and what you want. Then three commands, which are the only three you will type for the rest of your life.",
    shell: [
      {
        text: "$ terraform init",
        note: "downloads the AWS provider into .terraform/ and writes .terraform.lock.hcl",
      },
      {
        text: "$ terraform plan",
        note: "works out what it would do, and changes nothing",
      },
      {
        text: "$ terraform apply",
        note: "shows the same plan, asks once, then does it",
      },
    ],
    keywords: [
      {
        word: "terraform { }",
        what: "Settings for Terraform itself, not for your infrastructure. `required_version` stops a colleague on an older CLI from writing a state file yours cannot read.",
      },
      {
        word: "required_providers",
        what: "Where a provider comes from and which versions are acceptable. `~> 5.60` means 5.60 and up, but not 6.0 — the version that is allowed to break things.",
        without:
          "Leave it out and Terraform takes the newest provider there is, which is a different stack on a different day.",
      },
      {
        word: 'provider "aws"',
        what: "How to reach the API: region, and credentials it finds from the environment. Never write a key in here.",
      },
      {
        word: 'resource "aws_vpc" "main"',
        what: "Type, then name. Together they make the ADDRESS `aws_vpc.main`, which is what Terraform calls this object everywhere — in the plan, in state, on the command line.",
      },
      {
        word: "terraform init",
        what: "Run it once per directory, and again whenever you change a provider or module. It is the only command that touches the network before a plan.",
      },
    ],
    takeaway:
      "A resource block is a noun, not a verb. It says what should exist, not what to do.",
  },
  {
    n: 3,
    title: "Read the plan",
    lead: "Add a tag to the network and run `terraform plan` again. Nothing is created this time — the object already exists, and a tag is something the API can change where it stands. That is the difference the plan's symbols carry, and reading them is most of the skill.",
    keywords: [
      {
        word: "+",
        what: "Create. The object is in your file and not in state.",
      },
      {
        word: "~",
        what: "Update in place. It exists, and this argument can be changed without making a new one.",
      },
      {
        word: "-",
        what: "Destroy. It is in state and no longer in your file. Deleting code is an instruction to delete infrastructure.",
      },
      {
        word: "-/+",
        what: "Replace: destroy, then create. The plan prints `# forces replacement` beside the argument that caused it.",
      },
      {
        word: "(known after apply)",
        what: "A value that does not exist yet, because the API has not handed it out. Half a first plan is this, and it is not an error.",
      },
      {
        word: "Plan: 0 to add, 1 to change, 0 to destroy.",
        what: "The line to read first. If the numbers surprise you, stop and find out why before you type yes.",
      },
    ],
    takeaway:
      "Four symbols. Everything Terraform can do to one object is one of them.",
  },
  {
    n: 4,
    title: "Run it twice",
    lead: "Apply the same file again, immediately. Nothing happens, and the reason is worth saying carefully: Terraform does not remember that it already ran. It asks the API what is there, compares that with your file, and finds nothing to do.",
    shell: [
      {
        text: "$ terraform apply",
        note: "the same file, a second time",
      },
    ],
    keywords: [
      {
        word: "refresh",
        what: "Before planning, Terraform reads every object it is holding and updates its own record of them. That is the `Refreshing state...` line, and on a big stack it is most of the wait.",
      },
      {
        word: "convergence",
        what: "The file is a destination, not a journey. Run it ten times from ten different starting points and you land in the same place.",
      },
      {
        word: "No changes.",
        what: "The sentence you want in CI. It is also how you prove the thing in front of you really is what the file says.",
      },
    ],
    takeaway:
      "Applying twice is safe, because the second run compares rather than repeats.",
  },
  {
    n: 5,
    title: "Where it remembers",
    lead: "Terraform needs to know which real object belongs to `aws_vpc.main`, and no API will tell it. So it writes that down in STATE: a JSON file mapping every address in your file to an ID at the provider. State is the reason the second run knew it had nothing to do, and the reason losing it hurts.",
    shell: [
      { text: "$ terraform state list", note: "every address it is holding" },
      {
        text: "$ terraform state show aws_vpc.main",
        note: "everything it recorded about one object",
      },
    ],
    keywords: [
      {
        word: "terraform.tfstate",
        what: "The file. JSON, readable, and containing every attribute of every object — including the ones a database password lands in. Treat it like a secret, because it is one.",
        without:
          "Delete it and Terraform forgets everything it made. The infrastructure is still there; it just no longer belongs to anybody.",
      },
      {
        word: "terraform state mv",
        what: "Rename an address in state without touching anything real. The hand-operated version of the `moved` block in step 13.",
      },
      {
        word: "terraform state rm",
        what: "Forget an object without destroying it. The next plan will want to create it again, because as far as the file is concerned it is missing.",
      },
      {
        word: "never edit it by hand",
        what: "Every unhappy Terraform story starts here. Use the state commands, which keep the serial number and the lock honest.",
      },
    ],
    takeaway:
      "Three things must agree: your file, the state, and the real world. Terraform's whole job is noticing when they do not.",
  },
  {
    n: 6,
    title: "One thing refers to another",
    lead: "Add a gateway and a route table. Neither says `depends_on`, and yet Terraform will not try to make the route table before the gateway exists — because the route table's configuration contains `aws_internet_gateway.gw.id`, and a reference IS a dependency. Write enough of them and you have a graph, which is the thing Part II walks.",
    graph: true,
    shell: [
      {
        text: "$ terraform graph | dot -Tsvg > graph.svg",
        note: "draw your own; it is the same picture as the one below",
      },
      {
        text: "$ terraform apply -parallelism=20",
        note: "ten at once by default, and raising it past the width of the graph buys nothing",
      },
    ],
    insets: [
      {
        title: "the rare case for depends_on",
        hcl: [
          'resource "aws_instance" "app" {',
          "  # nothing here mentions the policy…",
          "  ami           = data.aws_ami.ubuntu.id",
          "  instance_type = var.instance_type",
          "",
          "  depends_on = [aws_iam_role_policy.app]",
          "}",
        ],
        note: "…but the software on the machine will fail at boot without it. A dependency the arguments cannot express is the only kind `depends_on` is for. Every other use of it is a reference somebody did not write.",
      },
    ],
    keywords: [
      {
        word: "aws_vpc.main.id",
        what: "A reference to another resource's attribute. Terraform cannot know this value until the VPC exists, so it orders the work accordingly.",
      },
      {
        word: "depends_on",
        what: "For the dependency you cannot express as a reference — an IAM policy that must exist before a service can assume a role, say. Needing it often means a reference was available and went unused.",
      },
      {
        word: "the graph",
        what: "Every reference is an edge. Terraform builds it, checks it for cycles, and walks it. `terraform graph | dot -Tsvg` draws it, if you want to see yours.",
      },
      {
        word: "-parallelism=10",
        what: "How many objects may be worked on at once. Ten by default, and raising it does nothing at all when your graph is a chain.",
      },
    ],
    takeaway:
      "You never write the order. You write the references, and the order falls out of them.",
  },
  {
    n: 7,
    title: "Variables and outputs",
    lead: "The file has a region and an instance size baked into it, which means a second copy of this stack means a second copy of the file. Pull them out into variables. Then publish the things other people need to know with outputs.",
    shell: [
      {
        text: "$ terraform apply -var instance_type=t3.small",
        note: "highest precedence of all: the command line wins",
      },
      {
        text: "$ TF_VAR_region=eu-central-1 terraform plan",
        note: "how CI passes a value in without writing a file",
      },
      {
        text: "$ terraform output vpc_id",
        note: "read one output back, for a script",
      },
    ],
    keywords: [
      {
        word: "variable",
        what: "An input. `type` is worth writing — `map(string)` catches at plan time what would otherwise be a confusing API error.",
      },
      {
        word: "default",
        what: "The lowest level of precedence there is. It is what happens when nobody says anything, not a value you can rely on.",
      },
      {
        word: "terraform.tfvars",
        what: "Values for this copy of the stack, loaded automatically. Anything on the command line beats it.",
      },
      {
        word: "TF_VAR_name",
        what: "An environment variable for `name`. Above the tfvars files is a common misreading — it is below them, and below the command line.",
      },
      {
        word: "output",
        what: "A value this stack publishes: to you on screen, to a script through `terraform output -json`, and to another stack through its remote state.",
      },
      {
        word: "locals",
        what: "A name for an expression you use more than once. Not an input — nobody can set it from outside.",
      },
    ],
    takeaway:
      "Variables in, outputs out. The file stops describing one stack and starts describing a kind of stack.",
  },
  {
    n: 8,
    title: "Many from one",
    lead: 'Two subnets, two machines, one of each per availability zone — and one block each. `for_each` makes one object per entry of a map, and the key goes into the address: `aws_subnet.public["eu-west-1a"]`. That addressing is the reason to prefer it over `count`.',
    keywords: [
      {
        word: "for_each",
        what: "One object per key of a map or set. `each.key` and `each.value` are that entry.",
      },
      {
        word: "count",
        what: "One object per number, addressed `[0]`, `[1]`. Remove the middle one and everything after it shifts down a slot — which Terraform reads as four replacements rather than one deletion.",
        without:
          "`for_each` keys do not shift, so removing a key removes exactly that object.",
      },
      {
        word: "each.value.id",
        what: "`for_each = aws_subnet.public` iterates over the objects made by another block, which is how the instances line up one per subnet without anybody writing the pairing down.",
      },
      {
        word: "data",
        what: "A read, not a resource. It asks the provider a question — here, the newest Ubuntu image — and nothing is created or destroyed by it.",
      },
    ],
    takeaway:
      "One block, many objects, each with an address of its own. The key you choose becomes part of that address, so choose a stable one.",
  },
  {
    n: 9,
    title: "Change, update, replace",
    lead: "Now edit something. Which of the four symbols you get depends entirely on what the API will let the provider do. Change the instance size and it is an update in place. Change the subnet and the same machine cannot follow — so Terraform destroys it and makes another, which on a live system is an outage you did not ask for.",
    shell: [
      {
        text: "$ terraform apply -replace='aws_instance.web[\"eu-west-1a\"]'",
        note: "replace one object on purpose, because it is sick rather than because the file changed",
      },
    ],
    insets: [
      {
        title: "arguing with the plan",
        hcl: [
          'resource "aws_db_instance" "main" {',
          "  # …",
          "  lifecycle {",
          "    prevent_destroy = true",
          '    ignore_changes  = [tags["LastSeen"]]',
          "  }",
          "}",
          "",
          'resource "aws_instance" "web" {',
          "  # …",
          "  lifecycle {",
          "    create_before_destroy = true",
          "    replace_triggered_by  = [aws_launch_template.web.latest_version]",
          "  }",
          "}",
        ],
        note: "`prevent_destroy` makes the plan fail rather than the database disappear. `ignore_changes` hands one argument over to whatever else writes it. `replace_triggered_by` replaces this object when something else moves, which is how a machine picks up a new launch template.",
      },
    ],
    keywords: [
      {
        word: "# forces replacement",
        what: "The comment beside the guilty argument. It is the single most important thing in a plan, and the reason to read a plan to the end rather than count the numbers at the bottom.",
      },
      {
        word: "create_before_destroy",
        what: "Make the new object before taking the old one away. It does not make the apply faster — it removes the window in which nothing is serving.",
        without:
          "A security group also needs `name_prefix` rather than `name` for this to work, because two of them cannot hold the same name at once.",
      },
      {
        word: "prevent_destroy",
        what: "Refuse any plan that would destroy this object. The guard rail for a database. It errors at plan time, which is exactly where you want to find out.",
      },
      {
        word: "ignore_changes",
        what: "Stop planning updates for an argument something else owns — a tag a cost tool writes, an image ID a deploy pipeline moves.",
      },
      {
        word: "replace_triggered_by",
        what: "Replace this object when another one changes, even though nothing about this one did.",
      },
      {
        word: "terraform apply -replace=ADDRESS",
        what: "Replace one object on purpose, because it is sick rather than because its configuration changed. This is what `terraform taint` used to be.",
      },
    ],
    takeaway:
      "You do not choose update or replace. The provider does, and the plan tells you which before anything happens.",
  },
  {
    n: 10,
    title: "The slow ones",
    lead: "The last two objects are the load balancer and the DNS record that points at it. They are also, between them, nearly all of the time this stack takes: ninety-two seconds and thirty-one, one after the other, because the record cannot be written until the balancer has a name. Everything else happens while they wait.",
    graph: true,
    shell: [
      {
        text: "$ terraform apply -target=aws_lb.app",
        note: "apply one corner of the graph; for emergencies, and the docs say so themselves",
      },
      {
        text: "$ terraform plan -out=tfplan && terraform apply tfplan",
        note: "the CI shape: plan once, review the file, apply exactly that plan and nothing newer",
      },
    ],
    keywords: [
      {
        word: "[for s in aws_subnet.public : s.id]",
        what: "A `for` expression: a list built from a collection. The load balancer takes every subnet the other block made, however many that turns out to be.",
      },
      {
        word: "the critical path",
        what: "The longest chain of references in the graph. It sets the length of the apply, and no amount of parallelism shortens it.",
      },
      {
        word: "Still creating... [1m30s elapsed]",
        what: "Terraform printing every ten seconds so you know it has not hung. Some objects really do take minutes.",
      },
      {
        word: "alias",
        what: "A Route 53 record pointing at an AWS object rather than an address. It takes `aws_lb.app.dns_name`, which is the reference that makes it last in the graph.",
      },
      {
        word: "-target=ADDRESS",
        what: "Apply part of the graph. It exists for emergencies and it lies to you about the rest of the plan — the docs say as much.",
      },
    ],
    takeaway:
      "The shape of the graph decides how long an apply takes. The knobs only decide how much of that shape you use.",
  },
  {
    n: 11,
    title: "Reuse: modules",
    lead: "Every stack after your first one wants the same network, the same tagging, the same opinions. A MODULE is a folder of `.tf` files called from another one, with variables as its inputs and outputs as its returns. The file you have been writing is already a module — the ROOT module — so there is less to learn here than it looks.",
    insets: [
      {
        title: "calling one",
        hcl: [
          'module "network" {',
          '  source  = "terraform-aws-modules/vpc/aws"',
          '  version = "5.8.1"',
          "",
          '  name = "app"',
          '  cidr = "10.0.0.0/16"',
          "}",
          "",
          "# and your own, from a path",
          'module "service" {',
          '  source = "./modules/service"',
          "  subnet_ids = module.network.public_subnets",
          "}",
        ],
        out: [
          "module.network.aws_vpc.this[0]",
          "module.network.aws_subnet.public[0]",
          "module.service.aws_instance.web",
        ],
        note: "A module's objects keep their own addresses under a `module.` prefix. That is the whole difference: the same resources, named one level deeper.",
      },
    ],
    keywords: [
      {
        word: "source",
        what: "Where the module is: a local path, a registry name, a Git URL. A local path is re-read every init; a registry module is downloaded and pinned.",
      },
      {
        word: "version",
        what: "Only works for registry modules, and leaving it off means a stranger can change your infrastructure. Pin it.",
      },
      {
        word: "module.network.public_subnets",
        what: "An output of the module, which is the only way to read anything out of it. A module's internals are not addressable from outside.",
      },
      {
        word: "terraform init",
        what: "Also what fetches modules. Change a `source` or a `version` and you must init again before plan will work.",
      },
    ],
    takeaway:
      "A module is a folder with inputs and outputs. Your root directory is one already.",
  },
  {
    n: 12,
    title: "A team, and the lock",
    lead: "Local state works until the second person runs apply. Then two runs read the same state, each plans against a world the other is changing, and the loser's work disappears. A remote backend fixes both halves: one copy of state everybody shares, and a lock so only one run holds it at a time.",
    insets: [
      {
        title: "one stack reading another",
        hcl: [
          'data "terraform_remote_state" "network" {',
          '  backend = "s3"',
          "  config = {",
          '    bucket = "example-tfstate"',
          '    key    = "network/terraform.tfstate"',
          '    region = "eu-west-1"',
          "  }",
          "}",
          "",
          'resource "aws_instance" "app" {',
          "  subnet_id = data.terraform_remote_state.network.outputs.subnet_ids[0]",
          "}",
          "",
          "# one state per environment, side by side",
          "# envs/production/   its own backend key, its own lock",
          "# envs/staging/      the same modules, different values",
        ],
        note: "Only OUTPUTS cross the boundary, which is what keeps two stacks from becoming one. The network team can rebuild everything behind `subnet_ids` without the application stack noticing.",
      },
    ],
    keywords: [
      {
        word: 'backend "s3"',
        what: "State in a bucket instead of beside the file. Versioning on the bucket is your undo.",
      },
      {
        word: "use_lockfile = true",
        what: "Locking through S3 itself, with a small `.tflock` object beside the state. This is the current way.",
        without:
          "`dynamodb_table` is the old way, and the backend's documentation now marks DynamoDB-based locking deprecated and due for removal.",
      },
      {
        word: "terraform init -migrate-state",
        what: "What you run after adding a backend block. It offers to copy your existing local state up, once.",
      },
      {
        word: "Error acquiring the state lock",
        what: "Somebody else is applying. The message names who and since when. Wait — `force-unlock` is for a run that died, not a run that is slow.",
      },
      {
        word: "terraform_remote_state",
        what: "A data source that reads another stack's outputs. How a service stack finds the network stack's subnet IDs without either one owning the other.",
      },
      {
        word: "one state per environment",
        what: "Separate directories, separate backends, separate blast radius. Workspaces share a backend and a configuration, which makes them a poor fit for production versus staging.",
      },
    ],
    takeaway:
      "Shared state and a lock are what turn a personal tool into a team one.",
  },
  {
    n: 13,
    title: "Drift, import and moved",
    lead: "Somebody opened port 22 in the console at three in the morning. The world no longer matches the file, and the next plan will quietly put it back — which is right, but you want to see it first. These are the three commands for when reality and the file have come apart.",
    insets: [
      {
        title: "adopting something that already exists",
        hcl: [
          "import {",
          "  to = aws_vpc.main",
          '  id = "vpc-0a1b2c3d"',
          "}",
          "",
          "# then, if you do not want to write the resource block yourself:",
          "# terraform plan -generate-config-out=generated.tf",
        ],
        note: "An `import` block adopts a real object into state. The flag that writes the matching configuration for you is still marked experimental.",
      },
      {
        title: "renaming without destroying",
        hcl: [
          "moved {",
          "  from = aws_instance.web",
          '  to   = aws_instance.web["eu-west-1a"]',
          "}",
        ],
        note: "Rename a resource and Terraform sees one object gone from the file and one new one: a destroy and a create. A `moved` block tells it the truth — same object, new address — and nothing is destroyed.",
      },
    ],
    keywords: [
      {
        word: "drift",
        what: "The real world changing underneath you. Terraform notices on the next refresh, and the plan that follows pulls it back to what the file says.",
      },
      {
        word: "terraform plan -refresh-only",
        what: "Show what drifted and do nothing about it. The safe thing to run first thing on a Monday.",
      },
      {
        word: "import",
        what: "Adopt an existing object into state. The block form is reviewable and goes in the repository; the old `terraform import` command did it invisibly from the shell.",
      },
      {
        word: "moved",
        what: "Rename an address in state as part of an ordinary plan, so a refactor costs nothing.",
      },
      {
        word: "removed",
        what: "The opposite: take something out of the file and out of state while leaving the real object alone.",
      },
    ],
    takeaway:
      "The file is the truth. These three blocks are how you tell it about a world that moved on without it.",
  },
  {
    n: 14,
    title: "When it fails",
    lead: "An apply is not a transaction. It is a walk over a graph, and when one object fails the objects already made stay made — they are in state, they are real, and the run stops wherever it got to. That is better than it sounds, because the next apply picks up from there.",
    keywords: [
      {
        word: "Error: creating …",
        what: "The provider's own words, with the address and the file line beneath them. Read the second line: it says which object, and that is usually the whole answer.",
      },
      {
        word: "a partial apply",
        what: "What succeeded is in state. Fix the file and run again; Terraform plans only what is still missing.",
      },
      {
        word: "terraform apply -replace=ADDRESS",
        what: "For an object that exists but is wrong — a machine that came up broken. Replaces exactly that one.",
      },
      {
        word: "terraform destroy",
        what: "Everything in state, in reverse dependency order. In a review environment this is a feature; in production it is why `prevent_destroy` exists.",
      },
      {
        word: "TF_LOG=DEBUG",
        what: "Every API call and response. Noisy, and the only way to see what the provider actually sent when its error message is not enough.",
      },
      {
        word: "Error: Cycle",
        what: "Two objects refer to each other. Terraform cannot order them, so it refuses to plan at all. Break it by referring to one attribute rather than the whole object, or by splitting the resource.",
      },
    ],
    takeaway:
      "Read the address in the error, fix the file, run it again. The state remembers what already worked.",
  },
];

export const STEP = (n: number) => STEPS.find(step => step.n === n)!;
