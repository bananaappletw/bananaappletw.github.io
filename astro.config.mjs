import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';

// Remark plugin for admonitions
function remarkAdmonitions() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      const type = node.name;
      if (['info', 'warning', 'caution'].includes(type)) {
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        node.data.hName = 'div';
        node.data.hProperties.class = `admonition admonition-${type}`;
      }
    });
  };
}

export default defineConfig({
  site: 'https://bananaapple.tw',
  base: '/',
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkDirective, remarkAdmonitions],
  },
});
