import { defineTorchlightConfig } from "./src/types/config";

export default defineTorchlightConfig({
  site: {
    url: "https://bananaappletw.github.io/",
    title: "Weibo's Home",
    // Search results and social cards print title and description together,
    // so this must not repeat the title — it read "Weibo's Home" twice.
    description:
      "Infrastructure, Kubernetes and security notes from Weibo Chen, a DevOps engineer in Tokyo.",
    author: "bananaappletw",
    profile: "https://github.com/bananaappletw",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Asia/Taipei",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    editPost: {
      enabled: true,
      url: "https://github.com/bananaappletw/bananaappletw.github.io/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/bananaappletw" },
    { name: "x", url: "https://x.com/bananaappletw" },
    { name: "linkedin", url: "https://www.linkedin.com/in/bananaappletw/" },
    { name: "mail", url: "mailto:bananaappletw@gmail.com" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
