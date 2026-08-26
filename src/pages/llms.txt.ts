import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import config from "@/config";

/**
 * /llms.txt — the site, as one page an agent can read before it crawls.
 *
 * The format is llmstxt.org's: an H1 for the name, a blockquote summary, then
 * sections of markdown links. It is a map, not a mirror — every entry is a
 * link out, so the file stays small enough to be read whole and the pages
 * stay the source of truth.
 *
 * Sorted newest-first, and built from the same helpers the RSS feed uses, so
 * drafts and scheduled posts are excluded here exactly as they are everywhere
 * else. If those two ever disagree it is a bug in one of them.
 */

const abs = (path: string, site: URL | undefined) =>
  new URL(path, site ?? config.site.url).href;

/** Every post carries a description, and on this site most of them repeat the
 *  title verbatim. Printing both would spend a line saying nothing twice. */
const note = (title: string, description: string) =>
  description.trim() && description.trim() !== title.trim()
    ? `: ${description.trim().replace(/\s+/g, " ")}`
    : "";

const day = (date: Date) => date.toISOString().slice(0, 10);

export const GET: APIRoute = async ({ site }) => {
  const posts = getSortedPosts(await getCollection("posts"));
  const pages = await getCollection("pages");

  const lines = [
    `# ${config.site.title}`,
    "",
    `> ${config.site.description}`,
    "",
    `Written by ${config.site.author} (${config.site.profile}). ${posts.length} posts, ` +
      `newest first; each line is title, date, tags, then the summary where it adds anything.`,
    "",
    "## Posts",
    "",
    ...posts.map(({ data, id, filePath }) => {
      const url = abs(getPostUrl(id, filePath, config.site.lang), site);
      const date = day(new Date(data.pubDatetime));
      const tags = data.tags.join(", ");
      return `- [${data.title}](${url}) — ${date}, ${tags}${note(data.title, data.description)}`;
    }),
    "",
    "## Pages",
    "",
    ...pages.map(({ data, id }) => {
      const url = abs(`/${id}/`, site);
      return `- [${data.title}](${url})${note(data.title, data.description ?? "")}`;
    }),
    `- [Archives](${abs("/archives/", site)}): every post by year and month`,
    `- [Tags](${abs("/tags/", site)}): every tag in use`,
    "",
    "## Optional",
    "",
    `- [RSS feed](${abs("/rss.xml", site)}): the same posts as XML`,
    `- [Sitemap](${abs("/sitemap-index.xml", site)}): every indexable URL`,
    `- [Search](${abs("/search/", site)}): full-text, built at deploy time`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
