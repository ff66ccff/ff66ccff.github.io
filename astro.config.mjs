import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';
import remarkRemoveLeadingH1 from './src/lib/remark-remove-leading-h1.mjs';
import rehypeIframeTitle from './src/lib/rehype-iframe-title.mjs';

import { SITE } from './src/consts';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],
  markdown: {
    // Astro 7 默认使用 Rust 版 Sätteri；此处显式选择 unified 管道以继续使用 remark/rehype 生态。
    processor: unified({
      remarkPlugins: [remarkGfm, remarkRemoveLeadingH1],
      rehypePlugins: [rehypeIframeTitle],
    }),
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid', 'math'],
    },
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
      defaultColor: false,
    },
  },
});
