# Astro 7 官方迁移与技术摘要（实测与权威文档版）

> 本文针对 Hexo 7 博客（https://ff66ccff.github.io）迁移至 Astro 的实际需求，基于 npm 官方源实测数据、docs.astro.build 官方文档原文以及 Astro 6/7 的 Release Notes 撰写，旨在提供一份**无过时心智、立即可照做**的权威迁移指南。
> 实测日期：2026-11-06。本地环境：Node v24.19.0，npm 11.17.0。

---

## 1. 版本事实与环境要求（命令行实测）

### 1.1 核心包发布事实
通过 `npm view astro version dist-tags time engines --json` 实测结果如下：
* **当前最新版本**：`astro@7.4.7`
* **发布时间**：`2026-11-05T19:59:28.083Z`（2026 年 11 月 5 日发布）
* **dist-tags 状态**：
  * `latest`: `7.4.7`
  * `legacy`: `4.16.19`（Astro 4 长期维护终点）
  * `rc`: `3.0.0-rc.11`
* **Node 运行环境要求**（`engines` 字段实测）：
  ```json
  {
    "node": ">=22.23.4",
    "npm": ">=9.6.5",
    "pnpm": ">=7.1.0"
  }
  ```
  > **实测结论**：当前本地环境为 Node v24.19.0，完全满足 Astro 7.4.7（>=22.23.4）要求。Node 18 与 Node 20 均已在 Astro 6 被官方彻底放弃支持。

### 1.2 官方集成与常用插件版本（实测矩阵）

| 包名 | 最新版本 | 兼容说明与官方指引 |
| :--- | :--- | :--- |
| `astro` | **7.4.7** | 核心框架，基于 Vite 8 与 Rust 编译器。 |
| `@astrojs/rss` | **4.0.19** | 官方 RSS 生成库，用于构建 `rss.xml`。 |
| `@astrojs/sitemap` | **3.7.4** | 官方站点地图库，自动生成 `sitemap-index.xml`。 |
| `@astrojs/mdx` | **8.1.3** | 官方 MDX 支持库。 |
| `@astrojs/check` | **0.9.12** | 官方类型检查与代码诊断工具。 |
| `@astrojs/markdown-remark` | **7.3.0** | **重点注意**：Astro 7 默认使用原生 Rust 引擎 Sätteri，不再预装此包。如需使用 remark/rehype 插件生态，必须手动安装并显式声明。 |
| `@astrojs/tailwind` | **6.0.2** | **官方状态：已废弃（Deprecated）**。Tailwind 4 官方推荐使用 `@tailwindcss/vite` 插件，不再推荐使用 Astro 集成。 |
| `tailwindcss` | **4.3.4** | Tailwind CSS v4 现代引擎。 |
| `remark-gfm` | **4.0.1** | GFM 插件（表格、删除线、任务列表等）。 |
| `rehype-slug` | **6.0.0** | 为标题自动生成 ID。 |
| `rehype-autolink-headings` | **7.1.0** | 为标题生成永久锚点链接。 |

---

## 2. Astro 7 的项目结构与 Content Collections (Content Layer)

### 2.1 目录结构与配置文件命名
* **强制规范**：必须使用 **`src/content.config.ts`**（位于 `src/` 根目录下），**严禁**使用旧版的 `src/content/config.ts`。
* **原因**：Astro 6 彻底移除了遗留的 `src/content/config.ts` 解析逻辑，保留旧路径会在启动时直接抛出 `LegacyContentConfigError`。

### 2.2 `glob` Loader 的准确导入与声明规范
在 Astro 7 中，定义内容集合的标准写法如下：

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod'; // 必须从 astro/zod 导入，底层为 Zod 4

const posts = defineCollection({
  // 1. 必须使用 glob() loader，指定 base 与 pattern
  loader: glob({
    base: './src/content/posts',
    pattern: '**/*.{md,mdx}',
  }),
  // 2. 严禁配置 type: 'content' 或 type: 'data'（会导致 ContentCollectionInvalidTypeError）
  // 3. Schema 校验（Zod 4 规范）
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    description: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
```

> **关键变化速查**：
> 1. **严禁 `type: 'content'`**：Content Layer API 统一了内容集合，集合类型不再区分 content 或 data。
> 2. **导入来源**：`z` 从 `astro:content` 或 `astro:schema` 导出已被官方废弃，统一规范为 `import { z } from 'astro/zod';`。

### 2.3 数据查询与渲染 API（getCollection / getEntry / render）
* **获取数据**：
  ```ts
  import { getCollection, getEntry } from 'astro:content';

  // 获取全部非草稿文章
  const allPosts = await getCollection('posts', ({ data }) => !data.draft);

  // 按 ID 获取单篇文章
  const singlePost = await getEntry('posts', 'welcome-to-the-blog');
  ```
* **ID 与 Slug 属性变更**：
  * 在 Content Layer 中，集合条目**不再具有 `post.slug` 属性**！旧代码中的 `post.slug` 会报 `undefined`。
  * 现在条目的标识符统一是 **`post.id`**（对于 `glob` loader，`id` 默认就是相对路径去除扩展名后的字符串）。
  * 若需要读取文件原始相对路径，使用 `post.filePath`。
* **渲染文章 HTML**：
  * **`post.render()` 已被彻底移除**！调用 `await post.render()` 会直接抛出 `TypeError`。
  * 必须使用独立函数 `render()`：
  ```astro
  ---
  import { render } from 'astro:content';

  const { post } = Astro.props;
  // 正确：从 astro:content 导入 render 并传入 entry
  const { Content, headings, remarkPluginFrontmatter } = await render(post);
  ---
  <Content />
  ```

---

### 2.4 Astro 7 相对 Astro 5 的破坏性变更逐条列表

Astro 从 5 到 7 经历了两次大版本迭代，以下为逐条溯源的破坏性变更：

#### 一、Astro 5 -> Astro 6 破坏性变更（来源：docs.astro.build/en/guides/upgrade-to/v6/）
1. **彻底移除旧版内容集合（PR #14407）**：彻底移除了 Astro 2.0 时代的旧 Content Collections 兼容层（包含 `legacy.collections` 配置项、`src/content/config.ts` 路径、`type: 'content'`、`getDataEntryById()` 与 `getEntryBySlug()`）。
2. **彻底移除 `entry.render()` 与 `entry.slug`**：必须改用 `import { render } from 'astro:content'; render(entry)`，必须使用 `entry.id` 代替 `entry.slug`。
3. **彻底移除 `<ViewTransitions />` 组件（PR #14400）**：组件名完全重命名为 `<ClientRouter />`，旧组件标签已不可用。
4. **彻底移除 `Astro.glob()`**：页面与组件中禁止直接使用 `Astro.glob()`，推荐迁移至 `getCollection()` 或原生 `import.meta.glob()`。
5. **废弃从 `astro:content` 导入 `z`（PR #14923）**：`astro:schema` 与 `astro:content` 的 `z` 导出已废弃，统一收归 `astro/zod`。
6. **Zod 4 升级**：底层 Zod 升级为 v4，部分格式化方法如 `z.string().email()` 改为顶层 `z.email()`，`.default()` 针对转换后类型生效。
7. **脚本与样式渲染顺序反转（PR #14480）**：在生成的 HTML 中，多个 `<script>` 与 `<style>` 改为严格按照代码中声明的先后顺序输出（Astro 5 及之前是逆序倒插）。
8. **Markdown 标题 ID 生成逻辑调整（PR #14494）**：全面对齐 GitHub 规范（基于 `github-slugger`），标题末尾特殊字符的连字符 `-` 不再被静默删除。
9. **图片服务默认行为变更**：默认图片服务默认开启裁剪（Cropping），且绝对禁止放大较小尺寸的图片（Never upscale）。
10. **运行时与环境**：最低要求 Node 22.12.0；禁止在客户端调用 `getImage()`；动态路由禁止返回数字类型的 params。

#### 二、Astro 6 -> Astro 7 破坏性变更（来源：docs.astro.build/en/guides/upgrade-to/v7/）
1. **默认 Markdown 处理器切换为 Sätteri（PR #16966）**：
   * 原生采用 Rust Markdown 管道 Sätteri 替代传统的 remark/rehype 管道。
   * **`@astrojs/markdown-remark` 不再预装**。若项目配置了 `remarkPlugins` 或 `rehypePlugins`，必须手动安装 `@astrojs/markdown-remark` 并显式设置 `markdown: { processor: unified() }`，否则插件无法生效。
2. **编译器全面切换为 Rust 编译器（PR #16462）**：
   * 彻底移除原有的 Go 编译器，启用 `@astrojs/compiler-rs`。
   * **严格 HTML 语法校验**：非 void 标签（如 `<p>`, `<div>` 等）必须正确闭合，未闭合标签直接导致编译报错（Build Error）。
   * **不再容忍非法嵌套**：以往 Go 编译器会尝试对非法 DOM（如在 `<p>` 内放置 `<div>`）进行静默修正；Rust 编译器不再修正，原样输出到浏览器，需确保模板嵌套合法。
3. **空白压缩默认行为变更：`compressHTML: 'jsx'`（PR #16965）**：
   * 默认对行内元素应用类似 React JSX 的空白剥离规则。
   * 例如 `<span>hello</span> <em>world</em>` 在 Astro 7 默认压缩下会连接为 `helloworld`（缺少中间空格）。若需保留空格，模板中需显式书写 `{" "}`，或在配置中设置 `compressHTML: true`（保持 HTML 规范单空格）或 `false`。
4. **保留文件名：`src/fetch.ts`**：
   * Astro 7 引入的高级路由系统占用了 `src/fetch.ts` / `src/fetch.js` 作为专属配置文件。
   * 普通业务代码若以此命名，会被 Astro 误作为路由中间件接管。如需关闭高级路由，可在配置中声明 `fetchFile: null`。
5. **彻底移除 `astro:transitions` 内部导出常量（PR #16725）**：
   * 移除了 `TRANSITION_PAGE_LOAD`、`TRANSITION_AFTER_SWAP`、`isTransitionBeforeSwapEvent()`、`createAnimationScope()` 等历史遗留导出。
   * 必须直接使用标准事件字符串名：`'astro:page-load'`、`'astro:before-swap'`、`'astro:after-swap'`。
6. **彻底移除 `@astrojs/db`**：
   * 官方不再维护该包，本地开发推荐直接使用 Node.js 22.5+ 原生内置的 `node:sqlite` 或使用 Drizzle ORM。
7. **依赖底层升级**：
   * 开发与打包器升级至 **Vite 8**。
   * Node 最低版本要求提升至 **`>=22.23.4`**。
8. **集成根路径导出废弃**：
   * Container API 的 `getContainerRenderer()` 不再允许从集成包根路径导入，必须改为从子路径 `@astrojs/<renderer>/container-renderer` 导入。

---

## 3. 权威配置：astro.config.mjs 与 package.json

基于当前博客现状（需要保留 `remark-gfm`、`rehype-slug`、`rehype-autolink-headings`、Sitemap、GitHub Pages 部署与双主题 Shiki），最稳定、规范的配置如下：

### 3.1 `astro.config.mjs`

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark'; // Astro 7 必须显式引入 unified
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import tailwindcss from '@tailwindcss/vite'; // Tailwind 4 官方推荐 Vite 插件模式

export default defineConfig({
  // 1. 站点基础信息（用户主页仓库，禁止带二级子路径）
  site: 'https://ff66ccff.github.io',
  trailingSlash: 'always', // 与 Hexo 原生目录模式完全一致

  // 2. 预取配置
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  // 3. 官方集成
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],

  // 4. Markdown 与语法高亮
  markdown: {
    // Astro 7 核心设置：声明使用 unified 管道以兼容现有的 remark/rehype 插件生态
    processor: unified(),
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            class: 'heading-anchor',
            ariaLabel: '永久链接',
            tabIndex: -1,
          },
          content: {
            type: 'element',
            tagName: 'span',
            properties: { class: 'heading-anchor-icon', 'aria-hidden': 'true' },
            children: [{ type: 'text', value: '#' }],
          },
        },
      ],
    ],
    // Shiki 双主题配置
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
      defaultColor: false, // 禁用默认行内色彩，交由 CSS 变量控制，防闪烁
    },
  },

  // 5. 空白压缩策略（推荐设为 true 以免丢失中文与英文混排空格）
  compressHTML: true,

  // 6. Vite 插件配置
  vite: {
    plugins: [
      tailwindcss(), // 加载 Tailwind 4 插件
    ],
  },
});
```

### 3.2 配套 Shiki 双主题 CSS（在全局样式中引入）
在 `astro.config.mjs` 设置 `defaultColor: false` 后，Shiki 会为每个 token 输出 `--shiki-light` 与 `--shiki-dark` CSS 变量。需在全局 CSS（如 `src/styles/global.css`）中加入如下变量映射：

```css
/* 默认亮色模式 */
.astro-code,
.astro-code span {
  color: var(--shiki-light) !important;
  background-color: var(--shiki-light-bg) !important;
}

/* 暗色模式（跟随媒体查询或跟随 html[data-theme="dark"]） */
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) .astro-code,
  html:not([data-theme="light"]) .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
  }
}

html[data-theme="dark"] .astro-code,
html[data-theme="dark"] .astro-code span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
}
```

### 3.3 `package.json` 推荐依赖与脚本
```json
{
  "name": "ff66ccff-blog",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "sync": "astro sync"
  },
  "dependencies": {
    "astro": "^7.4.7",
    "@astrojs/markdown-remark": "^7.3.0",
    "@astrojs/rss": "^4.0.19",
    "@astrojs/sitemap": "^3.7.4",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "remark-gfm": "^4.0.1",
    "rehype-slug": "^6.0.0",
    "rehype-autolink-headings": "^7.1.0",
    "markdown-it": "^14.1.0",
    "sanitize-html": "^2.14.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.12",
    "@types/markdown-it": "^14.1.2",
    "@types/sanitize-html": "^2.13.0",
    "typescript": "^5.9.0"
  }
}
```

---

## 4. 博客核心能力准确实现示例

### 4.1 动态文章路由：`src/pages/[year]/[month]/[day]/[...slug].astro`
为保持 Hexo 既有链接（如 `/2026/09/08/速成路线/`）不被破坏，同时支持自定义 slug：

```astro
---
// src/pages/[year]/[month]/[day]/[...slug].astro
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  return posts.map((post) => {
    const d = new Date(post.data.date);
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return {
      params: {
        year,
        month,
        day,
        slug: post.id, // Content Layer 中 post.id 即文件名 slug
      },
      props: { post },
    };
  });
}

const { post } = Astro.props;
// Astro 7 规范：从 render(post) 解构 Content 与 headings
const { Content, headings } = await render(post);
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article class="prose dark:prose-invert max-w-none">
    <h1>{post.data.title}</h1>
    <div class="text-sm text-gray-500">
      发布于：{post.data.date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    </div>
    <Content />
  </article>
</BaseLayout>
```

---

### 4.2 分页：`paginate()` 与 `src/pages/page/[page].astro`

```astro
---
// src/pages/page/[page].astro
import type { GetStaticPathsOptions, Page } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths({ paginate }: GetStaticPathsOptions) {
  const allPosts = await getCollection('posts', ({ data }) => !data.draft);
  // 按日期倒序排序
  allPosts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  // 对应 Hexo per_page: 10
  return paginate(allPosts, { pageSize: 10 });
}

interface Props {
  page: Page<CollectionEntry<'posts'>>;
}

const { page } = Astro.props;
---

<BaseLayout title={`文章列表 - 第 ${page.currentPage} 页`}>
  <div class="space-y-6">
    {page.data.map((post) => (
      <article class="border-b pb-4">
        <h2 class="text-xl font-bold">
          <a href={`/posts/${post.id}/`}>{post.data.title}</a>
        </h2>
        <p class="text-gray-600">{post.data.description}</p>
      </article>
    ))}
  </div>

  <!-- 分页导航条 -->
  <nav class="flex justify-between mt-8">
    {page.url.prev ? <a href={page.url.prev}>上一页</a> : <span />}
    <span>{page.currentPage} / {page.lastPage}</span>
    {page.url.next ? <a href={page.url.next}>下一页</a> : <span />}
  </nav>
</BaseLayout>
```

---

### 4.3 权威 RSS 实现：`src/pages/rss.xml.ts`

> **疑难解答：在 Astro 7 的 RSS 端点中，为什么不能把 `render(post)` 的组件渲染成 HTML？**
> * `render(post)` 返回的 `Content` 是一个 **Astro 组件（Component）**，不是 HTML 字符串。Astro 的 API 端点（.ts）运行在纯 JS 运行时中，无法像函数一样直接执行 `Content()`。除非引入复杂的实验性 Container API，否则无法直接把组件转换成字符串。
> * **官方规范解法**：Content Collections 条目保留了原始文章正文字符串 **`post.body`**。官方 RSS 文档（Recipes/RSS）明确指导：使用轻量 Markdown 解析器（如 `markdown-it`）解析 `post.body`，并用 `sanitize-html` 过滤后，赋值给 RSS item 的 `content` 字段。

```typescript
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const parser = new MarkdownIt();

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'ff66ccff 的个人主页',
    description: 'ff66ccff 的技术与生活手记',
    site: context.site!,
    trailingSlash: true,
    items: posts.map((post) => {
      const d = new Date(post.data.date);
      const year = String(d.getFullYear());
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const permalink = `/${year}/${month}/${day}/${post.id}/`;

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description ?? '',
        link: permalink,
        // 全文 RSS 关键字段：使用 markdown-it 转换原始 body 并安全过滤
        content: sanitizeHtml(parser.render(post.body ?? ''), {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        }),
      };
    }),
  });
}
```

---

### 4.4 Sitemap 与 Robots.txt
1. **Sitemap**：配置好 `@astrojs/sitemap` 后，执行 `astro build` 会在 `dist/` 根目录下自动生成 `sitemap-index.xml` 与 `sitemap-0.xml`。
2. **Robots.txt**：推荐在 `public/robots.txt` 放置静态文件，或创建动态端点 `src/pages/robots.txt.ts`：
   ```typescript
   // src/pages/robots.txt.ts
   import type { APIRoute } from 'astro';

   export const GET: APIRoute = ({ site }) => {
     const sitemapURL = new URL('sitemap-index.xml', site);
     return new Response(
       `User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL.href}\n`,
       {
         headers: { 'Content-Type': 'text/plain; charset=utf-8' },
       }
     );
   };
   ```

---

### 4.5 View Transitions：`<ClientRouter />` 现状与正确接入
* **现状**：
  * 旧版 `<ViewTransitions />` 在 Astro 6 已完全移除。
  * Astro 7 稳定支持无刷新路由过渡，组件名为 **`<ClientRouter />`**，导入路径为 **`astro:transitions`**。
  * Astro 7 彻底删除了 `TRANSITION_*` 内部常量导出，必须直接使用事件名。
* **基本接入方式**：
  ```astro
  ---
  // src/layouts/BaseLayout.astro
  import { ClientRouter } from 'astro:transitions';
  interface Props {
    title: string;
    description?: string;
  }
  const { title, description } = Astro.props;
  ---
  <html lang="zh-CN">
    <head>
      <meta charset="utf-8" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <!-- 在 head 中声明路由过渡引擎 -->
      <ClientRouter />
    </head>
    <body>
      <slot />
    </body>
  </html>
  ```

---

### 4.6 TOC（文章目录）数据获取
通过 `await render(post)` 返回的 `headings` 数组，其类型为：
```ts
interface MarkdownHeading {
  depth: number; // 标题层级 1..6
  slug: string;  // 对应 HTML id，例如 "一什么是-vibe-coding"
  text: string;  // 文本内容
}
```

**TOC 组件实现示例**：
```astro
---
// src/components/TableOfContents.astro
import type { MarkdownHeading } from 'astro';

interface Props {
  headings: MarkdownHeading[];
}

const { headings } = Astro.props;
// 仅提取 h2 和 h3 作为目录
const toc = headings.filter((h) => h.depth > 1 && h.depth <= 3);
---

{toc.length > 0 && (
  <nav class="toc-container p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div class="font-bold mb-2">文章目录</div>
    <ul class="space-y-1 text-sm">
      {toc.map((heading) => (
        <li style={{ paddingLeft: `${(heading.depth - 2) * 1}rem` }}>
          <a
            href={`#${heading.slug}`}
            class="text-gray-600 dark:text-gray-300 hover:text-blue-500"
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

---

### 4.7 图片方案：`astro:assets` vs `public/` 取舍分析

| 对比项 | `src/assets/` + `<Image />` | `public/` + 原生 `<img>` |
| :--- | :--- | :--- |
| **存储路径** | `src/assets/...` 或跟随 Markdown 存放 | 静态资源放在 `public/images/...` |
| **构建期优化** | **支持**：自动转换 WebP/AVIF、尺寸压缩、质量压缩。 | **不支持**：构建时原样拷贝，无任何转码压缩。 |
| **CLS（累积布局偏移）** | **防 CLS**：构建期自动提取宽高等比属性，预留占位。 | 需手动声明 `width` / `height`，否则易导致布局跳动。 |
| **Markdown 内相对引用** | 在 Markdown 中写 `![](./cover.png)`，Astro 会自动优化。 | 在 Markdown 中写 `![](/images/cover.png)`，原样输出。 |
| **Hexo 迁移改造成本** | **高**：需要将 Hexo 的旧静态图转移至 `src/` 并逐一修正 Markdown 相对路径。 | **极低**：直接把 Hexo 的 `source/images/` 拷贝到 `public/images/`，历史路径完全不变。 |

> **Hexo 迁移最佳实践建议**：
> 1. **历史文章存量图片**：全部保留在 `public/`，Markdown 保持 `![](/images/...)` 引用，保障迁移工作量最小化且零断链。
> 2. **网站关键 UI 与封面图（Cover）**：放置在 `src/assets/`，在 Frontmatter 中声明并结合 `astro:assets` 的 `<Image />` 组件，最大化首屏加载体验与 Core Web Vitals 得分。

---

## 5. GitHub Pages 部署与 CI/CD

### 5.1 `withastro/action@v3` 在 2026 年现状分析
* **结论：强烈不再推荐使用 `withastro/action@v3`**。
* **原因**：`v3` 发布于 Astro 3/4 早期，默认绑定了过时的 Node 运行时环境，且无法适配 Astro 7 对 Node >=22.23.4 的严格校验。
* **官方现状**：在 2026 年，官方部署文档推荐的标准是 **`withastro/action@v6`**（配合 `actions/checkout@v7` 与 `actions/deploy-pages@v5`）。

### 5.2 完整可用的 GitHub Actions 工作流文件

针对本博客（`https://ff66ccff.github.io`，pnpm 包管理），创建 **`.github/workflows/deploy.yml`**：

#### 方案 A：官方推荐模式（采用最新 `withastro/action@v6`）
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v7

      - name: Install, build, and upload site
        uses: withastro/action@v6
        with:
          node-version: 24 # 明确指定 Node 24
          package-manager: pnpm@latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

#### 方案 B：透明原生步骤模式（无黑盒，可定制构建细节）
```yaml
name: Deploy to GitHub Pages (Custom Pipeline)

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v7

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: 'pnpm'

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Astro site
        run: pnpm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

### 5.3 仓库类型与 `base` 配置关键注意点
* **仓库特征**：本仓库名为 **`ff66ccff.github.io`**，是 GitHub 规范的 **User Page（用户主页根仓库）**。
* **致命陷阱**：在 `astro.config.mjs` 中，**绝对不要设置 `base`**（或者显式配置 `base: '/'`）！
* **说明**：只有 Project Page（形如 `username.github.io/my-blog/`）才必须配置 `base: '/my-blog'`。若用户主页误配了 `base`，会导致所有 CSS、JS 与图片资源前缀错位，直接引发整站 404 与样式丢失。

---

## 6. 避坑指南与工程细节

### 6.1 中文路径与 URL 编码
* **问题**：Hexo 允许文章文件名包含中文，例如 `source/_posts/速成路线.md`。在 Astro 7 的 Content Layer 中，`post.id` 会直接保留中文字符串（`"速成路线"`）。
* **陷阱**：在现代浏览器中，访问 `/2026/09/08/速成路线/` 会被浏览器自动转义为 `%E9%80%9F%E6%88%90...`。
* **解法**：在 `getStaticPaths` 映射时，直接将 `post.id` 赋值给路由 param（如 `slug: post.id`）。Astro 内部会自动对 param 做 Unicode 规范化匹配，无需手动二次 `encodeURI`。同时保证所有站内链接（如列表页跳转链接）使用原始中文字符串拼接，避免因二次转义导致双重编码。

### 6.2 日期与 GitHub Actions 时区漂移
* **问题**：在本地开发时，机器处于 `Asia/Shanghai`（UTC+8）时区，而在 GitHub Actions Runner（`ubuntu-latest`）上运行容器时，系统默认时区为 **UTC+0**。
* **陷阱**：如果文章 Frontmatter 的日期格式为 `date: "2026-09-08 02:00:00"`（不带时区偏移），Node 在 UTC 环境下解析为凌晨 2 点，而在 UTC+8 下可能解析为昨天或偏移 8 小时，导致生成的年份、月份路由（`/[year]/[month]/[day]/`）与 Hexo 历史路径产生一天之差！
* **对策**：
  1. Frontmatter 中的日期尽量符合 ISO 8601 规范并标有时区偏移，如 `"2026-09-08T22:35:00+08:00"`。
  2. 格式化日期输出与生成年/月/日路径时，统一显式指定时区：
     ```ts
     export function dateParts(date: Date) {
       const formatter = new Intl.DateTimeFormat('zh-CN', {
         timeZone: 'Asia/Shanghai',
         year: 'numeric',
         month: '2-digit',
         day: '2-digit',
       });
       // 强制以东八区计算 year/month/day
     }
     ```

### 6.3 Giscus 评论组件在 `<ClientRouter />` 下的状态维护
* **问题**：启用 `<ClientRouter />` 后，页面跳转为前端无刷新 DOM 替换。普通的外部脚本注入只会在初次打开网站时执行一次。用户点击跳转到另一篇文章时，评论区不会重新初始化，或者残留上一篇文章的讨论。
* **对策**：编写专门的 Giscus 宿主组件，监听 Astro 的生命周期事件 `astro:page-load` 与 `astro:before-swap`：

```astro
<!-- src/components/Comments.astro -->
<div id="giscus-container" class="mt-12"></div>

<script>
  function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    // 清空现有 iframe，防止重复挂载
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'ff66ccff/ff66ccff.github.io');
    script.setAttribute('data-repo-id', '...');
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-category-id', '...');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    // 根据当前暗色主题状态选择
    const isDark = document.documentElement.classList.contains('dark') ||
                   document.documentElement.getAttribute('data-theme') === 'dark';
    script.setAttribute('data-theme', isDark ? 'dark' : 'light');
    script.setAttribute('data-lang', 'zh-CN');
    script.crossOrigin = 'anonymous';
    script.async = true;

    container.appendChild(script);
  }

  // 1. 初次加载及无刷新跳转后均执行
  document.addEventListener('astro:page-load', loadGiscus);

  // 2. 页面即将替换前清理 DOM
  document.addEventListener('astro:before-swap', () => {
    const container = document.getElementById('giscus-container');
    if (container) container.innerHTML = '';
  });
</script>
```

### 6.4 脚本执行顺序与 Rust 编译器的 HTML 语法约束
1. **脚本执行顺序**：Astro 6 已经将 `<script>` 与 `<style>` 改为按照源码书写顺序正序渲染。若使用第三方统计脚本（如 Busuanzi 不蒜子、Google Analytics），需将其置于 `<head>` 中或页面最顶部。
2. **强制闭合标签**：在 Markdown 或 Astro 模板中，不能再书写类似 `<p>第一行<br>第二行` 或未闭合的 `<div>`。在 Astro 7 Rust 编译器下，任何未闭合的非 void 标签均会中断构建并抛出语法错误。
3. **`compressHTML: 'jsx'` 导致的文字粘连**：若发现页面中的中英文标点、链接标签与文字粘在一起，应检查模板中行内元素（如 `<a>`、`<span>`）之间是否有无意剥离的空格，必要时配置 `compressHTML: true`。
