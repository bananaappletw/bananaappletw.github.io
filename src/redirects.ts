/**
 * Where the old site's URLs went.
 *
 * Two migrations moved every post: Hexo-era `/archives/<Name>` and
 * `/treasure/<slug>`, then Docusaurus's `/blog/<slug>`, and now
 * `/posts/<slug>`. Every one of those old paths was returning 404 on the live
 * site — checked against the origin, not assumed — so any link, bookmark or
 * search result from 2016 to 2026 was dead.
 *
 * Astro's static output renders each of these as a small page carrying a
 * `<meta http-equiv="refresh">` and a canonical link, which is the most a
 * host that only serves files can do. GitHub Pages serves no redirect rules.
 *
 * Generated from the last Docusaurus build still in this repository's history
 * (388d7d2), so the list is what actually existed rather than what anyone
 * remembers publishing.
 *
 * Six old tag pages point at `/tags/` rather than at a tag: docusaurus,
 * facebook, hello, review, send-file and virtualization no longer exist,
 * because the migration collapsed most of the old tags into `archive`. A
 * redirect to a 404 is not a redirect.
 */
export const redirects = {
  // posts — the slug only changed case
  "/archives/I-don-t-know-c-language": "/posts/i-don-t-know-c-language/",
  "/archives/Javascript-function-paramter-default-value":
    "/posts/javascript-function-paramter-default-value/",
  "/archives/My-favorite-script": "/posts/my-favorite-script/",
  "/archives/N-1-issue": "/posts/n-1-issue/",
  "/archives/Preview-file-using-send-file":
    "/posts/preview-file-using-send-file/",
  "/archives/Rails-Best-practice": "/posts/rails-best-practice/",
  "/archives/Rails-on-Ubuntu": "/posts/rails-on-ubuntu/",
  "/archives/Rubocop-Ruby-static-code-analyzer":
    "/posts/rubocop-ruby-static-code-analyzer/",
  "/archives/Virtualization": "/posts/virtualization/",
  "/archives/alignment-and-round-number-using-and":
    "/posts/alignment-and-round-number-using-and/",
  "/archives/concurrency-vs-parallelism": "/posts/concurrency-vs-parallelism/",
  "/archives/db-seeds-for-carrierwave": "/posts/db-seeds-for-carrierwave/",
  "/archives/how-python-pass-argument-in-function":
    "/posts/how-python-pass-argument-in-function/",
  "/archives/official-website-review": "/posts/official-website-review/",
  "/archives/qira-introduction": "/posts/qira-introduction/",
  "/archives/review": "/posts/review/",
  "/archives/review-of-bamboofox-platform":
    "/posts/review-of-bamboofox-platform/",
  "/archives/symbolic-exection-introduction":
    "/posts/symbolic-exection-introduction/",
  "/archives/useful-tools": "/posts/useful-tools/",
  "/archives/welcome": "/archives/",
  "/blog/aws-resource-hierarchy": "/posts/aws-resource-hierarchy/",
  "/blog/gcp-resource-hierarchy": "/posts/gcp-resource-hierarchy/",
  "/blog/how-to-interview-security-engineer":
    "/posts/how-to-interview-security-engineer/",
  "/blog/kvm-gpu-passthrough-ubuntu-20-04":
    "/posts/kvm-gpu-passthrough-ubuntu-20-04/",
  "/blog/opsec": "/posts/opsec/",
  "/treasure/everything-you-do-is-ultimately-pointless":
    "/posts/everything-you-do-is-ultimately-pointless/",

  // tag pages
  "/archives/tags/c": "/tags/c/",
  "/archives/tags/carrierwave": "/tags/carrierwave/",
  "/archives/tags/ctf": "/tags/ctf/",
  "/archives/tags/database": "/tags/database/",
  "/archives/tags/docusaurus": "/tags/",
  "/archives/tags/facebook": "/tags/",
  "/archives/tags/hello": "/tags/",
  "/archives/tags/javascript": "/tags/javascript/",
  "/archives/tags/linux-kernel": "/tags/linux-kernel/",
  "/archives/tags/python": "/tags/python/",
  "/archives/tags/qira": "/tags/qira/",
  "/archives/tags/review": "/tags/",
  "/archives/tags/rubocop": "/tags/rubocop/",
  "/archives/tags/ruby-code-formatter": "/tags/ruby-code-formatter/",
  "/archives/tags/ruby-on-rails": "/tags/ruby-on-rails/",
  "/archives/tags/script": "/tags/script/",
  "/archives/tags/send-file": "/tags/",
  "/archives/tags/tool": "/tags/tool/",
  "/archives/tags/virtualization": "/tags/",
  "/blog/tags/aws": "/tags/aws/",
  "/blog/tags/cloud-init": "/tags/cloud-init/",
  "/blog/tags/gcp": "/tags/gcp/",
  "/blog/tags/gpu": "/tags/gpu/",
  "/blog/tags/kvm": "/tags/kvm/",
  "/blog/tags/security": "/tags/security/",
  "/blog/tags/vfio": "/tags/vfio/",
  "/treasure/tags/life": "/tags/life/",

  // section and archive indexes
  "/archive": "/archives/",
  "/archives/tags": "/tags/",
  "/blog": "/posts/",
  "/blog/archive": "/archives/",
  "/blog/tags": "/tags/",
  "/treasure": "/posts/",
  "/treasure/archive": "/archives/",
  "/treasure/tags": "/tags/",

  // feeds
  "/archives/atom.xml": "/rss.xml",
  "/archives/rss.xml": "/rss.xml",
  "/blog/atom.xml": "/rss.xml",
  "/blog/rss.xml": "/rss.xml",
  "/treasure/atom.xml": "/rss.xml",
  "/treasure/rss.xml": "/rss.xml",
};
