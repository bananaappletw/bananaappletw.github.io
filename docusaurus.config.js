const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

const mermaid = require("remark-mermaid");

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "bananaappletw's blog",
  tagline: "silver bullet",
  url: "https://bananaappletw.github.io",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "bananaappletw", // Usually your GitHub org/user name.
  projectName: "bananaappletw.github.io", // Usually your repo name.
  plugins: [
    "@docusaurus/theme-live-codeblock",
    [
      "@docusaurus/plugin-content-blog",
      {
        id: "archives",
        path: "archives",
        routeBasePath: "archives",
        editUrl:
          "https://github.com/banananappletw/blog/edit/master/blog/archives",
      },
    ],
    [
      "@docusaurus/plugin-content-blog",
      {
        id: "treasure",
        path: "treasure",
        routeBasePath: "treasure",
        editUrl:
          "https://github.com/banananappletw/blog/edit/master/blog/treasure",
      },
    ],
  ],
  themeConfig: {
    image: "img/profile.jpg",
    colorMode: {
      defaultMode: 'dark',
    },
    navbar: {
      title: "bananaappletw's blog",
      logo: {
        alt: "My Logo",
        src: "img/profile.jpg",
      },
      items: [
        { to: "/blog", label: "Blog", position: "left" },
        { to: "/archive", label: "Archive", position: "left" },
        { to: "/treasure", label: "Treasure", position: "left" },
        {
          href: "https://github.com/bananaappletw/blog",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {},
        {},
        {},
        {
          title: "Links",
          items: [
            {
              label: "slideshare",
              to: "https://www.slideshare.net/bananaappletw",
            },
            {
              label: "stackoverflow",
              to: "https://stackoverflow.com/users/4446356/bananaappletw",
            },
            {
              label: "Twitter",
              to: "https://twitter.com/bananaappletw",
            },
            {
              label: "LinkedIn",
              to: "https://www.linkedin.com/in/bananaappletw/",
            },
            {
              label: "GitHub",
              href: "https://github.com/bananaappletw",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} bananaappletw, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        blog: {
          routeBasePath: "/blog",
          path: "blog",
          remarkPlugins: [mermaid],
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: "https://github.com/bananaappletw/blog/edit/master/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
