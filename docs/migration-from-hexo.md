# 从 Hexo 迁移到 Astro + Mizuki

> 迁移日期：2026-11-06
> 旧站：Hexo 7.3 + Volantis 主题
> 新站：Astro 7.1.3 + [Mizuki](https://github.com/LyraVoid/Mizuki) 主题（Apache-2.0）

## 1. 为什么用主题而不是自建

第一版迁移曾用 Astro 手写整套布局与组件，功能能跑，但相当于自己维护一个博客主题。按照「尽量用开源社区成熟实现」的原则，最终改为 **直接采用 Mizuki 主题**：

- 成熟度：持续维护、带完整文档与演示站、内置大量博客能力；
- 零手写组件：友链页、评论、搜索、目录、RSS/Atom、暗色模式、i18n 都是主题自带；
- 一言：直接使用主题内置的 `TypewriterText` 打字机组件，不再自己维护动画逻辑。

本仓库只做了配置、内容与数据迁移，以及少量必要的主题适配（见第 6 节）。

## 2. 内容与数据

| 内容 | 迁移结果 |
| --- | --- |
| 文章 | 8 篇；正文保留，仅去掉正文开头与 frontmatter 重复的一级标题（主题从 frontmatter 渲染标题） |
| 个人资料 | 昵称 ff66ccff、头像、简介与 3 个社交链接（GitHub / RSS / 网易云音乐）写入 `profileConfig.ts` |
| 友链 | 4 个站点，标题、站点、头像、描述、关键词全部保留到 `src/data/friends.ts` |
| 一言 | 710 句迁移到 `src/data/quotes.ts`，由首页横幅打字机轮播 |
| 评论 | giscus 配置原样迁移（repo、category、pathname 映射不变） |
| 图片 | 头像、文章配图、旧封面图保留在 `public/`，横幅由旧封面生成桌面 / 移动 WebP |

文章正文逐篇校验：除移除重复标题外，其余内容与旧 Markdown 完全一致。旧标题中含 `[BGM]` 的《辞旧迎新之时》已把标题更新为 `辞旧迎新之时[BGM]`，信息未丢失。

## 3. URL 兼容

| 页面 | 结果 |
| --- | --- |
| 文章 | 全部保留 `/YYYY/MM/DD/<原文件名>/`（`permalinkConfig` 使用 `%raw_postname%` 保留大小写） |
| 归档 | 旧 `/archives/` 通过 `public/archives/index.html` 跳转到主题的 `/archive/` |
| 分类 / 标签 | 旧 `/categories/…`、`/tags/…` 通过静态跳转页转到 `/archive/?category=…` / `?tag=…` |
| 订阅 | `/atom.xml`、`/rss.xml` 由主题生成；新增 `/rss2.xml` 别名 |
| 关于 / 友链 | `/about/`、`/friends/` 保留 |
| 评论 | 文章 URL 未变，giscus `pathname` 映射下历史评论继续可见 |

## 4. 功能对照

| 旧站能力 | 新站实现 |
| --- | --- |
| 一言打字机 | Mizuki 内置 `TypewriterText`（首页横幅副标题轮播 710 句） |
| 文章分类 / 标签 / 归档 | 主题归档页 + 侧边栏分类 / 标签组件 + 分类导航条 |
| 友链卡片 | 主题友链页（含搜索与标签筛选） |
| giscus 评论 | 主题评论组件（giscus 模式） |
| RSS / Atom / sitemap | 主题内置 |
| 代码高亮 / 目录 | Expressive Code + 主题 TOC |
| 搜索 | Pagefind |
| 暗色模式 | 主题内置 |
| 自定义 404 / OG / JSON-LD | 主题内置 |

## 5. 视觉

| 首页 | 文章页 |
| --- | --- |
| ![首页](screenshots/home-dark.webp) | ![文章页](screenshots/post-dark.webp) |

| 友链 | 移动端 |
| --- | --- |
| ![友链](screenshots/friends-dark.webp) | ![移动端](screenshots/home-mobile.webp) |


- 主题色相设为 320（对应 #FF66CC 的洋红）；
- 横幅使用旧站封面图生成的桌面 / 移动 WebP，保留原视觉记忆；
- 字体使用系统字体（`siteConfig.font.mode = "system"`），不加载主题自带的中日文字体（约 20 MB），首屏更轻；
- 关闭了主题的 Live2D 看板娘、樱花特效、音乐播放器与示例特色页面。

## 6. 对主题的少量适配

| 文件 | 改动 | 原因 |
| --- | --- | --- |
| `src/config/*` | 站点、资料、导航、评论、页脚、侧边栏、永久链接等配置 | 站点个性化 |
| `src/layouts/Layout.astro` | 删除 system 字体模式下仍然引用的 `<Font>` 组件 | 主题在 `font.mode=system` 时类型检查报错（字体变量为 never） |
| `package.json` | build 简化为 `astro build && pagefind --site dist`，移除示例相关的检查脚本 | 删除了示例页面与 GitHub 卡片，主题的 `check-global-style-loading` 不再适用 |
| `src/pages/rss2.xml.ts` | 新增旧订阅地址别名 | 兼容旧链接 |
| `public/archives|tags|categories/**/index.html` | 静态跳转页 | 兼容旧分类 / 标签 / 归档链接 |
| `src/components/widgets/music-player/constants.ts` | 默认封面改为本站 favicon | 主题默认 favicon 已替换 |
| `src/content/posts/*` | 去掉正文开头重复的一级标题 | 主题已从 frontmatter 渲染标题 |

## 7. 验收

- `pnpm check`：0 error；
- `pnpm build`：成功，生成 30+ 路由与 Pagefind 索引；
- 旧文章 URL、归档 / 分类 / 标签跳转、订阅地址均可用；
- 首页 / 文章 / 友链 / 关于页已用浏览器实测；评论、搜索、暗色模式、移动端为主题自带能力。

## 8. 已知取舍

- 首页横幅把 710 句一言序列化进 HTML（首页约 287 KB 原始 / 71 KB gzip）；如果更在意首屏体积，可在 `quotes.ts` 中只保留常用句子。
- 《CCF-CSP 算法板子》单页约 2.2 MB（136 个代码块 + Expressive Code 增强）；这是保留完整长文 + 构建期高亮的代价。
- 主题内置打字机是 `setTimeout` 实现，未处理 `prefers-reduced-motion`（上游主题行为，未改动）。
- 友链头像来自对方站点 / GitHub，访客网络受限时可能不显示。
- 主题的示例数据文件（anime、projects 等）仍保留在 `src/data/`，用于满足主题组件的历史 import 依赖；对应页面已关闭并删除。

## 9. 回滚

迁移前状态保存在 git 历史中（自建 Astro 版本打有本地 tag `custom-astro-prototype`；Hexo 版本在更早的提交）。如需回滚，可以直接检出对应提交或 `git revert` 本次迁移提交。
