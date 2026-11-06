# ff66ccff.github.io

ff66ccff 的个人主页：技术手记、生活随想、中文 VOCALOID 与科幻。

线上地址：<https://ff66ccff.github.io>

2026 年从 **Hexo 7 + Volantis** 迁移到 **Astro 7**：文章、个人资料、友链与一言数据全部保留，URL 兼容旧站。

![首页（亮色）](docs/screenshots/home-light.webp)

## 技术栈

| 能力 | 实现 |
| --- | --- |
| 框架 | [Astro 7](https://astro.build)（Content Collections、ClientRouter 视图过渡） |
| 语言 | TypeScript（strict） |
| 样式 | 手写 CSS 设计系统，亮 / 暗双主题，无 CSS 框架 |
| 代码高亮 | Shiki，`github-light` / `github-dark` 双主题 |
| 一言打字机 | [typewriter-effect](https://www.npmjs.com/package/typewriter-effect)（MIT）+ 构建期静态整句 |
| 图表 | mermaid（按需加载） |
| 评论 | giscus（GitHub Discussions） |
| 订阅 | Atom（/atom.xml）与 RSS（/rss.xml） |
| SEO | Open Graph、Twitter Card、JSON-LD、sitemap、robots.txt |
| 字体 | Inter Variable / JetBrains Mono Variable（fontsource，自托管） |
| 部署 | GitHub Actions + GitHub Pages |

## 本地开发

需要 Node.js **>= 22.23.4**（Astro 7 最低要求）。

```bash
npm install
npm run dev      # 开发服务器 http://localhost:4321
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
npm run check    # Astro + TypeScript 类型检查
npm run sync     # 手动生成 Content Collections 类型（一般由 dev/build 自动完成）
```

## 目录结构

```text
src/
├─ content/posts/       # 文章（Markdown）
├─ data/                # 结构化数据：个人资料 / 友链 / 一言
├─ components/          # Hero、Hitokoto、PostCard、TOC、Giscus…
├─ layouts/             # BaseLayout / PostLayout / PageLayout
├─ lib/                 # posts / feed / format / site 等纯逻辑
├─ pages/               # 路由：首页、文章、归档、分类、标签、友链、关于、404、feed
├─ scripts/             # 客户端交互（主题、灯箱、打字机、mermaid…）
├─ styles/global.css    # 设计系统
└─ content.config.ts    # Content Collections schema
public/                 # 头像、照片、favicon、OG 图等静态资源
research/               # 迁移前的调研报告（Astro 7 / 一言打字机）
docs/                   # 迁移说明
```

## 内容维护

### 新增文章

在 `src/content/posts/` 新建 Markdown 文件，文件名即 URL 的最后一段：

```yaml
---
title: "文章标题"
date: "2026-11-06T12:00:00+08:00"
updated: "2026-11-06T12:00:00+08:00"   # 可选
categories:
  - 编程
tags:
  - Astro
description: "可选的摘要，用于 SEO 与 RSS"
---
```

文章 URL 为 `/年/月/日/文件名/`（与 Hexo 时代一致）。正文开头如果还写着 `# 标题`，构建时会自动去掉，避免与页面标题重复；磁盘上的 Markdown 不会被修改。

### 个人资料

编辑 `src/data/profile.json`：昵称、头像、站点描述、社交链接（RSS / GitHub / 网易云音乐）、giscus 评论配置。

### 友链

编辑 `src/data/friends.json`，按分组维护 `title / url / avatar / description / keywords / color`。

### 一言

`src/data/quotes.json` 中是一言句子数组（当前 710 条）。首屏会在构建期随机取一句静态渲染（无 JS 也可见），点击「换一句」时才动态加载全部句子并用 typewriter-effect 打字。

### 导航

`src/lib/site.ts` 中的 `nav` 数组。

## 部署

推送到 `main` 后，`.github/workflows/deploy.yml` 会用 `withastro/action@v6` 构建并部署到 GitHub Pages。仓库是用户主页根仓库（`ff66ccff.github.io`），因此 `astro.config.mjs` 中 **不能设置 `base`**。

## 从 Hexo 迁移

- 迁移说明与 URL 对照：[docs/migration-from-hexo.md](docs/migration-from-hexo.md)
- Astro 7 官方文档调研：[research/astro7-official.md](research/astro7-official.md)
- 一言打字机调研：[research/typewriter-and-astro.md](research/typewriter-and-astro.md)
- 内容迁移校验报告：[research/content-migration-report.md](research/content-migration-report.md)
- 独立 QA 验收报告：[research/qa-report.md](research/qa-report.md)

旧 Hexo 文件已从工作区移除，仍保留在 git 历史中（迁移前最后一次提交为 `eb2f92e`）。

## 协议

文章内容遵循 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans) 协议。
