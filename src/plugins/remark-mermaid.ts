import { visit } from "unist-util-visit";
import type { Root, Code, Parent } from "mdast";

/**
 * ```mermaid fences become the div mermaid renders into.
 *
 * This has to be a REMARK plugin, and it has to emit a raw `html` node, for a
 * reason that cost three broken diagrams on the live site: the two posts that
 * carried a hand-written `<div class="mermaid">` had their diagram source read
 * as markdown *text*, and smartypants rewrote every `-->` into an em dash.
 * `graph LR\nA —> B` is not a graph, so mermaid drew its "Syntax error in
 * text" bomb on every one of them.
 *
 * A fence is never smartypants'd, and an `html` node is passed through
 * untouched, so the arrows survive. Running before Shiki also means the
 * diagram never becomes a tokenised code block that would have to be
 * un-highlighted afterwards.
 */

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function remarkMermaid() {
  return (tree: Root) => {
    visit(
      tree,
      "code",
      (node: Code, index: number | undefined, parent: Parent | undefined) => {
        if (node.lang !== "mermaid" || !parent || index === undefined) return;
        parent.children[index] = {
          type: "html",
          value: `<div class="mermaid">${escape(node.value)}</div>`,
        };
      },
    );
  };
}
