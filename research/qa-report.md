# QA 验收报告 — Hexo → Astro 7 个人博客迁移

- **验收对象**：`E:\ff66ccff.github.io`（Astro 7.4.7 静态站，8 篇文章）
- **验收日期**：2026-11-06
- **验收方式**：独立 QA，只读源码 + 干净重建 + 对 `dist/` 产物静态探测；未修改任何源码（本文件为唯一新增交付物）
- **环境**：Windows / pwsh 7，Node v24.19.0，npm 11.17.0；本地无浏览器自动化、无外网（`web_fetch` 失败）

## 0. 结论

**PASS（有条件通过）** — 迁移的可交付性核心项全部达标：`npm run check` 与 `npm run build` 均 0 error 退出；22 个 HTML 页 + 4 个端点全部生成；站内链接 537 处 / 32 个唯一目标 **0 死链**；Atom / RSS / sitemap 结构合法且条目数、绝对 URL、转义均正确；8 篇文章正文关键句全部命中；旧站 URL 21/21 可映射。发现的问题均为非阻断的工程/体验改进项（**0 个 P0、0 个 P1、9 个 P2、4 个 P3**）。

> 建议：合并前修掉 P2 中的 404 canonical、iframe title、正文图片 alt、浅色链接对比度四项（改动很小）；上线后再用真实浏览器补做移动端/暗色/Mermaid/giscus 的人工回归。

## 1. 构建与产物

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| `npm run check` | **exit 0**，42 个文件，0 error / 0 warning / 1 hint | 见 §1.1 |
| `npm run build` | **exit 0**，`22 page(s) built in 2.34s` | 见 §1.2 |
| 页面数 | 22 个 HTML + 4 个端点（atom.xml / rss.xml / rss2.xml / robots.txt）= 26 条路由 | build 日志 + `dist` 统计 |
| `dist/` 文件数 | **145** | `Get-ChildItem -Recurse -File dist` |
| 构建告警 | 仅 vite「chunk > 500 kB」1 条（见 P2-5） | build 日志 |

### 1.1 `npm run check` 实测

```text
> ff66ccff-blog@2.0.0 check
> astro check
[...]
scripts/migrate-hexo-content.mjs:116:46 - warning ts(6133): 'label' is declared but its value is never read.
Result (42 files):
- 0 errors
- 0 warnings
- 1 hint
EXITCODE=0
```

- 唯一提示：`scripts/migrate-hexo-content.mjs:116` 的参数 `label` 未使用（hint 级，不阻断）。
- 口径小问题：正文打印 `warning ts(6133)`，摘要却计为 1 hint / 0 warnings（见 P2-6）。

### 1.2 `npm run build` 实测（先 `Remove-Item -Recurse dist` 干净重建）

```text
14:24:04 [build] Building static entrypoints...
14:24:06 [build] 22 page(s) built in 2.34s
14:24:06 [build] Complete!
EXITCODE=0
```

生成路由：`/404.html`、`/about/`、`/archives/`、`/atom.xml`、`/categories/{,编程,生活}/`、`/friends/`、`/robots.txt`、`/rss.xml`、`/rss2.xml`、`/tags/{,AI,C,CCF-CSP,Vibe-Coding,算法}/`、8 篇文章 `/YYYY/MM/DD/<文件名>/`、`/index.html`。

### 1.3 dist 关键文件清单（全部存在）

| 文件 | 大小 (B) | 说明 |
| --- | --- | --- |
| `index.html` | 29,614 | 首页 |
| `404.html` | 14,600 | 404（含 noindex） |
| `atom.xml` | 427,636 | Atom 2.0 |
| `rss.xml` | 427,121 | RSS 2.0 + content:encoded |
| `rss2.xml` | 427,121 | 旧路径别名，与 rss.xml 字节相同 |
| `sitemap-index.xml` | 232 | 指向 sitemap-0.xml |
| `sitemap-0.xml` | 3,514 | 21 条 URL（已排除 404） |
| `robots.txt` | 78 | 指向 sitemap-index.xml |
| `og-default.jpg` | 213,903 | 默认 OG 图 |
| `.nojekyll` | 0 | 来自 `public/.nojekyll` |
| `avatar.jpg` / `favicon.svg` | 238,565 / 440 | 头像 / 图标 |
| `photos/记得向尘世之外瞥一眼.jpg` | 745,571 | 文章配图 |
| `photos/wallhaven-yq5ejd_3840x2400.png` | 933,224 | 旧站遗留，**未被引用**（P2-7） |

## 2. 内部链接爬取

方法：递归读取 `dist/**/*.html`（22 个），用 `(?:href|src)\s*=\s*("..."|'...')` 抽取所有以 `/` 开头的链接（排除 `//` 协议相对），去掉 `#`/`?` 后 percent-decode，再按「目录 → index.html / 带扩展名 → 同名文件」映射到磁盘。

| 指标 | 结果 |
| --- | --- |
| HTML 页 | 22 |
| 根相对 href/src 出现次数 | **537** |
| 唯一目标 | **32** |
| **映射失败（404）** | **0** |
| 非根相对的可疑链接（相对路径/裸路径） | 0 |
| CSS `url()` 本地引用 | 12 处，**0 缺失**（字体 woff2 全部命中） |
| JS 相对 `import`/`from "./*.js"` | 407 处，**0 缺失** |

唯一目标包含：8 篇文章 URL、`/`、`/about/`、`/archives/`、`/categories/{,编程,生活}/`、`/friends/`、`/tags/{,AI,C,CCF-CSP,Vibe-Coding,算法}/`、`/atom.xml`、`/rss.xml`、`/sitemap-index.xml`、`/avatar.jpg`、`/favicon.svg`、`/photos/记得向尘世之外瞥一眼.jpg`、5 个 `_astro/*.js|css`。

### 2.1 中文 URL 与旧 URL 编码形式抽查

| 形式 | 出现位置 | 结果 |
| --- | --- | --- |
| 原始 UTF-8：`href="/categories/编程/"` | 分类列表 / 文章分类徽章（`dist/categories/index.html` 等） | 映射到 `dist/categories/编程/index.html` ✅ |
| percent-encoded：`/categories/%E7%BC%96%E7%A8%8B/` | canonical、sitemap、RSS `<link>` | 解码后同一文件 ✅ |
| percent-encoded 图片：`/photos/%E8%AE%B0%E5%BE%97...jpg` | 文章正文 `<img src>` | 映射到 `dist/photos/记得向尘世之外瞥一眼.jpg` ✅ |
| 大写/中文混排：`/2026/09/12/CCF-CSP算法板子/` | 首页 / 归档 / 前后篇导航 | 映射到对应 `index.html` ✅ |

结论：两种编码形式在产物中共存，均指向真实文件；浏览器与 GitHub Pages 会对中文路径做等价编码，**静态映射 0 失败**。

## 3. Feed 与 Sitemap（XML 解析实测）

用 .NET `[xml]` 解析全部 XML（解析成功本身即证明 XML 良构）。

| 检查项 | atom.xml | rss.xml | sitemap |
| --- | --- | --- | --- |
| 根节点 / 条目数 | `feed` / **8** | `rss` / **8 items** | `sitemapindex` → 1 个 sitemap → **21 URL** |
| 链接 | 8/8 为 `https://ff66ccff.github.io/...` 绝对 URL | 8/8 绝对 URL（中文已 percent-encode） | 21/21 绝对 URL、同 host |
| 正文 | 8/8 `<content type="html">`，HTML 已转义 | 8/8 含 `<content:encoded>` | — |
| 条目内容量 | 188,871 / 60,107 / 15,304 / 475 / 533 / 455 / 132 / 123 字符 | 与 Atom 逐项一致 | — |
| 语言/元数据 | `xml:lang="zh-CN"`、self link、author、icon、logo 齐全 | `<language>zh-CN</language>` | lastmod 为构建时间 |
| 转义 | 裸 `&` = **0**，`&amp;` = 2,108 | 解析通过 | 解析通过 |

补充证据：

- 转义覆盖：8 篇文章标题均不含 `&`/`<`（条件未触发）；但正文代码/表格含大量 `&`、`<`，产物中裸 `&` 为 0，证明 `escapeXml()`（`src/lib/feed.ts:53-59`）对正文实际生效；Atom 中 HTML 以 `&lt;pre` 形式出现 **215 次**，与全站代码块总数 215 完全一致。
- 绝对化：Atom 正文中 `img src="https://ff66ccff.github.io/...` 1 处、相对 `src="/...` 0 处，说明 `absolutize()`（`src/lib/feed.ts:10-14`）生效。
- `rss2.xml` 是纯别名（`src/pages/rss2.xml.ts:1-3` 复用 `rss.xml` 的 GET）：两者 SHA256 完全相同
  `5C81BECC543B8B01FAE15FDBD60EFCDAF7CF57ADE7F86CB54A27C1C7CC113074`。
- sitemap 21 条 = 22 个 HTML 页 − 404（`astro.config.mjs:23` 过滤 `/404`），数量正确。
- Feed 表格/代码与页面一致：Atom 中 `&lt;table` 30（26 个真实表格 + 4 个代码示例）、`&lt;tr` 306，与页面 26 表 / 286 tr + 代码内示例吻合；215 个代码块全部保留。

## 4. 内容完整性

### 4.1 正文关键句抽查（8/8 命中）

对 `dist/**/index.html` 去标签、解 HTML 实体、压缩空白后做子串匹配：

| 文章 | 抽查关键句 | 结果 |
| --- | --- | --- |
| `/2025/11/09/welcome-to-the-blog/` | 「这个网站的代码主要依靠Claude和ChatGPT编写」「我决定把这片空间正式升级成博客」 | ✅✅ |
| `/2025/11/10/游戏本的痛/` | 「从宿舍到教学楼大约」「每次背着十多斤的电脑包」 | ✅✅ |
| `/2025/11/11/心累/` | 「大学的累是心累」「神学课挤占课表」 | ✅✅ |
| `/2025/11/16/记得向尘世之外瞥一眼/` | 「宇宙很大，生活更大。」「你仍然很幸运」「拍摄于四川大学江安校区西园七舍七单元」 | ✅✅✅ |
| `/2026/01/02/辞旧迎新之时-bgm/` | 「How time flies」「2025年就这么过去了」 | ✅✅ |
| `/2026/01/22/CPP常用STL/` | 「基础容器」+ 代码文本 `std::vector`、`#include <array>` | ✅ |
| `/2026/09/08/速成路线/` | 「AI 负责具体的代码实现与语法细节」「Vibe Coding」 | ✅✅ |
| `/2026/09/12/CCF-CSP算法板子/` | 「拿到题目先看数据范围」「0.2 的表反推算法」 | ✅✅ |

> 方法备注：Shiki 会把代码按 token 拆成 `<span>`，按「标签间补空格」抽取会把 `std::vector` 拆开；改用「去标签不补空格」重新抽取后代码文本完整（`std::vector`、`#include <array>` 均命中），确认是抽取方式而非内容丢失。

### 4.2 图片可访问性

- `/photos/记得向尘世之外瞥一眼.jpg`：源 Markdown `src/content/posts/记得向尘世之外瞥一眼.md:17`，产物 `dist/photos/记得向尘世之外瞥一眼.jpg` 存在（745,571 B），正文 `<img src="/photos/%E8%AE%B0...jpg">` 可映射 ✅。**但 `alt=""`**（见 P2-3）。
- `/photos/wallhaven-yq5ejd_3840x2400.png`：产物存在，但 `src/` 与 `dist/**/*.html|css` 中引用数为 **0**（P2-7）。

### 4.3 代码块与语言标签

| 页面 | `<pre>` 数 | `data-language` 分布 | 备注 |
| --- | --- | --- | --- |
| CCF-CSP算法板子 | 136 | cpp 134、bash 1、bat 1 | 136 = 272 行围栏配对 |
| CPP常用STL | 23 | cpp 23 | — |
| 速成路线 | 56 | bash 39、text 8、plaintext 2（源为 `gitignore`）、markdown 2、powershell 2、yaml 1、javascript 1 + **mermaid 1** | 55 高亮块 + 1 mermaid |
| 合计 | **215** | — | 与 Atom 中 `&lt;pre` 215 一致 |

- **语言标签可见**：`.prose pre[data-language]::before { content: attr(data-language) } `（`src/styles/global.css:1245-1257`），右上角显示语言名；`<pre tabindex="0">` 支持键盘横向滚动。
- 双主题：`<pre class="astro-code astro-code-themes github-light github-dark">` + CSS 变量（`global.css:1259-1276`），亮/暗切换不需重渲染。

### 4.4 Mermaid

- 源：`src/content/posts/速成路线.md:43` 仅 1 个 ```mermaid 块。
- 产物：`dist/2026/09/08/速成路线/index.html` 中为 `<pre><code class="language-mermaid">…</code></pre>`，**没有 `astro-code` / `<span style="--shiki-*">`** → 已按 `astro.config.mjs:34-37` 的 `excludeLangs: ['mermaid','math']` 排除高亮 ✅。
- 客户端：`src/components/Mermaid.astro:24-27` 选择 `.prose pre > code.language-mermaid`，运行时替换为 `div.mermaid` 并 `mermaid.run()`；主题切换时重绘（`Mermaid.astro:70-76`）。
- ⚠️ **静态 HTML 中不存在 `.mermaid` 容器**（容器由 JS 运行时生成），因此「生成 .mermaid 容器」这一步只能靠浏览器实测确认——已列入未覆盖风险。

## 5. HTML 语义与可访问性（静态检查）

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 每页唯一 `h1` | **22/22 页均恰好 1 个** | `<h1` 计数 |
| 标题层级跳级（h1→h3 等） | **0 页** | 逐页 h1..h6 序列检查 |
| `<html lang>` | 22/22 为 `zh-CN` | `BaseLayout.astro:47` + `SITE.locale` |
| canonical | 22/22 存在 | `BaseLayout.astro:32,56`；**404 例外见 P2-1** |
| skip-link | 22/22 含 `href="#main"`，且 22/22 有 `id="main"` | `BaseLayout.astro:91,94`；`global.css:212-227` 仅 `:focus-visible` 时显示 |
| `img alt` | 22 页共 0 个 `<img>` 缺 `alt` 属性 | 仅正文 1 张图 `alt=""`（P2-3） |
| 空链接 / 无名按钮 | 空链接 **0**、无名称按钮 **0** | 锚点文本或 `aria-label` 检查 |
| iframe | 1 个（网易云音乐），**缺 `title`** | P2-2 |
| 焦点可见 | 全局 `:focus-visible { outline: 2px solid var(--accent) }` + `.skip-link:focus-visible` + 代码复制按钮 `:focus-visible` 显形 | `global.css:225,240-244,1297` |
| reduced-motion | CSS 全局降级（`animation/transition/scroll-behavior`） | `global.css:99-111` |
| reduced-motion（JS） | Hitokoto 在 `prefers-reduced-motion` 或标签页隐藏时直接落字、不播打字动画 | `src/scripts/hitokoto.ts:38,74-80,130-133` |
| Hitokoto 键盘可操作 | 真实 `<button type="button">换一句</button>`；点击/Enter/Space 均可触发 | `Hitokoto.astro:26-30`，`hitokoto.ts:116-127` |
| aria-live | 首页 `<p class="sr-only" aria-live="polite">` 播报完整句子 | `Hitokoto.astro:22` |
| `aria-current="page"` | 22 页中 **14 页**有当前导航高亮；8 篇文章页为 0 属正常（导航无对应项），首页正确高亮「博客」 | `Header.astro:7,22` |
| JSON-LD | 30 个块全部可 `JSON.parse`，含 `@context/@type` | 首页 WebSite + 8 篇 BlogPosting |
| OG/Twitter | 22/22 含 `og:image`/`og:title` | `BaseLayout.astro:63-73` |
| 主题色 | 亮/暗双 `<meta name="theme-color">` | `BaseLayout.astro:60-61` |

对比度（WCAG 2.1 计算值，正常文本 AA 需 ≥ 4.5:1）：

| 组合 | 比值 | 判定 |
| --- | --- | --- |
| 亮色正文 `#17141b` / `#faf8fb` | 17.26 | ✅ |
| 亮色次要 `#57505f` / `#faf8fb` | 7.32 | ✅ |
| 亮色三级 `#8a8291` / `#faf8fb` | **3.50** | ❌（语言标签/复制按钮等小字） |
| 亮色链接 `#d92f9d` / `#faf8fb` | **4.11** | ❌（正常字号正文链接） |
| 亮色链接 hover `#ff66cc` / `#faf8fb` | **2.48** | ❌（hover 态） |
| 亮色按钮白字 / `#ff66cc` 渐变起点 | **2.62** | ⚠️（`.btn-primary`，大字号/非正文，仍偏低） |
| 暗色正文 / `#0a0910` | 16.42 | ✅ |
| 暗色次要 / `#0a0910` | 7.98 | ✅ |
| 暗色三级 / `#0a0910` | 4.32 | ⚠️（接近 4.5） |
| 暗色链接 `#ff8ad9` / `#0a0910` | 9.33 | ✅ |

## 6. 移动端与暗色主题（静态分析）

- `<meta name="viewport" content="width=device-width, initial-scale=1">` 全站存在（`BaseLayout.astro:50`）。
- 断点与任务描述一致：**64rem**（`global.css:2034`，隐藏 TOC、单列文章）、**56rem**（`global.css:2048`，Hero/卡片/关于页转单列）、**44rem**（`global.css:2093`，header 换行、隐藏品牌名与导航图标）。
- 溢出防护：`pre`（`global.css:1222-1233`）与表格（`global.css:1185-1192`）均 `overflow-x: auto`；`img` 有 `max-width:100%; height:auto`（`global.css:137-148`）。
- 320px 估算：≤44rem 时导航 6 个链接各约 2 汉字（≈27px）+ 左右 padding 17.6px ≈ 44.5px，合计 ≈267px；容器内容宽 ≈320−35=285px → **预计不溢出**（估算，未真机验证）。
- 触控目标：`.icon-btn` 36×36px（`global.css:362-367`）满足 WCAG 2.5.8 的 24px，但低于 AAA 44px；`.nav-link` padding 0.4/0.55rem，高度约 35px。
- 暗色主题：`[data-theme='dark']` 变量组（`global.css:49-76`）；`<head>` 内联脚本在首绘前读 `localStorage`/系统偏好写入 `data-theme`（`BaseLayout.astro:80-87`），可避免 FOUC；切换按钮 `ThemeToggle.astro` 有 `aria-label`；giscus（`Giscus.astro:29,48-49`）与 mermaid（`Mermaid.astro:70-76`）监听 `themechange` 重挂载/重绘。
- ⚠️ 以上均为源码/产物静态推断，**未在真实移动端或浏览器中目测**；真实换行、点击区域、字体回退存在未知风险（见 §10）。

## 7. 旧站 URL 兼容

| 旧 URL | 新站文件 | 结果 |
| --- | --- | --- |
| `/` | `dist/index.html` | ✅ |
| `/archives/` | `dist/archives/index.html` | ✅ |
| `/categories/` | `dist/categories/index.html` | ✅ |
| `/categories/编程/` | `dist/categories/编程/index.html` | ✅ |
| `/tags/` | `dist/tags/index.html` | ✅ |
| `/tags/C/` | `dist/tags/C/index.html` | ✅ |
| `/friends/` | `dist/friends/index.html` | ✅ |
| `/2025/11/09/welcome-to-the-blog/` | `dist/2025/11/09/welcome-to-the-blog/index.html` | ✅ |
| `/2025/11/10/游戏本的痛/` | 同上规则 | ✅ |
| `/2025/11/11/心累/` | 同上规则 | ✅ |
| `/2025/11/16/记得向尘世之外瞥一眼/` | 同上规则 | ✅ |
| `/2026/01/02/辞旧迎新之时-bgm/` | 同上规则 | ✅ |
| `/2026/01/22/CPP常用STL/` | 同上规则 | ✅ |
| `/2026/09/08/速成路线/` | 同上规则 | ✅ |
| `/2026/09/12/CCF-CSP算法板子/` | 同上规则 | ✅（保留大写与中文，靠 `generateId` 不做小写化） |
| `/atom.xml` | `dist/atom.xml` | ✅ 合法 Atom：8 entry、type=html、绝对 URL |
| `/rss.xml` | `dist/rss.xml` | ✅ RSS 2.0 + content:encoded |
| `/rss2.xml` | `dist/rss2.xml` | ✅ 与 rss.xml 字节级一致（别名） |
| `/sitemap-index.xml` | `dist/sitemap-index.xml` | ✅ |
| `/robots.txt` | `dist/robots.txt` | ✅ 指向 sitemap-index.xml |
| `/404.html` | `dist/404.html` | ✅ 含 `robots: noindex` |

补充：文章永久链接由 `src/lib/posts.ts:15-18` 用 `dateParts()`（Asia/Shanghai，`src/lib/format.ts:6-17`）生成，避免 CI（UTC）时区导致日期偏移；分类/标签 slug 规则 `slugifyTerm()`（`src/lib/format.ts:68-73`）实现 `C++ → C`、`Vibe Coding → Vibe-Coding`。

## 8. 工程卫生

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 依赖是否被使用 | **14/14 均有明确用途**：11 个运行时依赖全部在 `src/` 或 `astro.config.mjs` 中被 import；3 个 devDependencies 为 `astro check`/TS/类型定义所需 | 逐个 `Select-String` 检索 |
| 依赖与 lockfile 一致 | lockfileVersion 3，643 个包，14 个依赖均存在于 `node_modules/<name>` | `package-lock.json` 逐项核对 |
| engines | `node >= 22.23.4`（`package.json:32-34`），本机 v24.19.0 ✅，workflow node 24 ✅ | — |
| 未使用/重复资源 | `public/photos/wallhaven-...png`（933 KB）0 引用；根 `.nojekyll` 与 `public/.nojekyll` 重复 | §4.2 / P2-7 |
| `.gitignore` 是否误忽略 public/ | **否**：仅忽略 `node_modules/`、`dist/`、`.astro/`、`*.log`、`.env*`、OS 文件；`public/` 未忽略 ✅ | `.gitignore:1-19` |
| 产物是否被误提交 | `git ls-files` 中 `dist/`、`node_modules/`、`.astro/` 均为 0；`public/` 当前 0（尚未 `git add`） | `git ls-files` |
| README 命令一致性 | `dev/build/preview/check` 与 `package.json` scripts 完全一致 ✅；`sync` 脚本存在但 README 未记录（P3-1） | `README.md:29-35`、`package.json:7-13` |
| 部署 workflow 触发 | `on.push.branches: [main]` + `workflow_dispatch` ✅；`permissions` 含 `pages: write`/`id-token: write` ✅；concurrency 已设 | `deploy.yml:3-15` |
| 部署构建 | `withastro/action@v6` + `node-version: 24` + `package-manager: npm`，随后 `actions/deploy-pages@v5` ✅（版本真实性见 §10） | `deploy.yml:22-28,43` |
| 构建产物关键文件 | `.nojekyll` 随 `public/` 进入 `dist/` ✅（GitHub Pages 不会跑 Jekyll，中文/下划线路径安全） | `dist/.nojekyll` 存在 |

> 项目状态提示（非缺陷）：`git status` 显示 `src/`、`public/`、`astro.config.mjs` 等新站文件仍为未跟踪（`??`），旧 Hexo 文件为已删除（`D`）。**推送到 main 前必须先 `git add` 新站文件**，否则 workflow 构建的是空内容（或不存在 `src/` 而失败）。

## 9. 问题清单

### P0（阻断，0 个）
无。

### P1（严重，0 个）
无。

### P2（建议合并前修复，9 个）

1. **404 页 canonical 指向不存在的 `/404/`**
   `dist/404.html` 的 canonical 为 `https://ff66ccff.github.io/404/`，而文件实际是 `/404.html`；根因是 `BaseLayout.astro:32` 直接取 `Astro.url.pathname`。虽有 `robots: noindex`，仍建议对 404 传 `noindex` 时跳过 canonical 或固定为 `/404.html`。
2. **文章内网易云音乐 iframe 缺 `title`**
   `src/content/posts/辞旧迎新之时-bgm.md:12` 的外链 iframe 渲染到 `dist/2026/01/02/辞旧迎新之时-bgm/index.html` 时没有 `title` 属性（WCAG 4.1.2 / 2.4.1）；同页其余 iframe 为 0 个。建议补 `title="网易云音乐播放器"`。
3. **正文图片 `alt=""`**
   `记得向尘世之外瞥一眼.md:17` 的 `![](...)` 渲染为 `<img src="/photos/%E8%AE%B0...jpg" alt="">`；该图是文章主体（有拍摄地说明），空 alt 会被读屏跳过。建议补描述性 alt。
4. **浅色主题对比度不足**
   `--accent-strong #d92f9d` on `#faf8fb` = **4.11:1**（正文链接 < 4.5 的 AA 要求）；hover `#ff66cc` = **2.48:1**；`--text-tertiary #8a8291` = **3.50:1**，用于语言标签（0.66rem）与代码复制按钮。深色主题对比度均达标。建议调深链接色/次要文字色，或对这些小字加粗放大。
5. **性能：单页 HTML 过大 + mermaid 体积**
   `dist/2026/09/12/CCF-CSP算法板子/index.html` = **1,909,336 B**（272 个代码块 / 136 pre 的 Shiki 产物）；`速成路线` = 169,113 B。构建告警有 629,040 B 的 chunk；`dist/_astro` 中 mermaid 及其渲染依赖（`mermaid.core` 84,600、`chunk-NGNAAXSQ` 629,040、`elk` 1,498,941、`cytoscape` 434,702、`katex` 258,780，五项已合计约 2.9 MB）体积偏大，且 `Mermaid.astro` 在 `astro:page-load` 立即触发加载。含图表的页面（速成路线）首次访问的网络成本未被真机测量。
6. **`astro check` 提示口径不一致**
   输出正文打印 `warning ts(6133)`，但摘要为 `0 warnings / 1 hint`，容易误读；建议直接删除 `scripts/migrate-hexo-content.mjs:116` 未使用的 `label` 参数，或把它纳入检查白名单。
7. **未引用/重复静态资源**
   `public/photos/wallhaven-yq5ejd_3840x2400.png`（933,224 B）在 `src/` 与 `dist/**/*.html|css` 中 **0 引用**（旧 Hexo 背景图遗留），建议删除或确认用途；根 `.nojekyll`（tracked）与 `public/.nojekyll` 重复，保留后者即可。
8. **图片压缩 workflow 存在失效风险 + Actions 版本不一致**
   `compress-images.yml:25` 使用 `calibreapp/image-actions@main`（跟随分支，供应链风险）；`:38` `git add public/photos public/images` 中的 `public/images` 目录不存在，`git add` 会报 pathspec 错误（被 `|| true` 吞掉），可能导致后续提交不含图片或步骤失败；此外该 workflow 用 `GITHUB_TOKEN` 直接 push 的提交**不会触发新的 workflow run**，压缩后的图片要等下次人为 push 才会部署。另 `deploy.yml:22` 用 `actions/checkout@v7`、`compress-images.yml:19` 用 `@v4`，版本不一致。
9. **构建产物非确定性**
   `Hitokoto.astro:6` 在构建期 `Math.random()` 选首屏句子，每次 `npm run build` 的 `dist/index.html` 都不同；功能无碍，但不利于产物 diff/缓存校验（也意味着每次部署首页 HTML 必变）。

### P3（可选优化，4 个）

1. `README.md:29-35` 未记录 `package.json:12` 的 `npm run sync`。
2. `src/data/profile.json:33` 的 `comments.theme: "preferred_color_scheme"` 未被 `Giscus.astro` 使用（组件强制写 `light/dark`），字段实际不生效。
3. `src/data/quotes.json` 710 条中有 **23 条重复**（唯一 681 条，如「人生若只如初见…」），非缺陷，若追求数据唯一可去重。
4. Feed 与页面渲染器不完全一致：页面走 remark-gfm，Feed 走 markdown-it（`src/lib/feed.ts:7`）。表格与代码已一致，但 47 处 `- [ ]` 任务列表在 Feed 中退化为文本 `[ ]`（页面为 44 个真实 checkbox）；未来若使用 GFM 独有语法会出现 Feed 与页面差异。

## 10. 未覆盖风险（无法在本环境验证）

1. **真实浏览器/真机未运行**：移动端换行与触控、暗色主题视觉、Hitokoto 打字机（typewriter-effect 动态 import）、Mermaid 运行时 `.mermaid` 容器生成、giscus 挂载、图片灯箱 `<dialog>`、ClientRouter SPA 导航（`astro:page-load` 幂等）均只做了代码/产物级静态验证，**没有一次真实渲染**。
2. **未跑 axe / Lighthouse**：可访问性结论来自属性与对比度静态检查，未测真实焦点顺序、读屏播报、键盘陷阱。
3. **Actions 未实际触发**：本地无外网（`web_fetch` 失败），无法确认 `actions/checkout@v7`、`withastro/action@v6`、`actions/deploy-pages@v5` 这些 tag 在 GitHub 上真实存在且输入参数名正确；也未验证 GitHub Pages 服务端对中文路径的实际行为。**若 tag 不存在，部署会直接失败**——这是本报告最大的未知项。
4. **外链未验证**：友链 4 个站点/头像、GitHub、网易云音乐播放器均未做可达性检查（无网络）。
5. **`npm ci` 未实跑**：仅核对 lockfile 与 package.json 一致性，CI 上的安装行为（含 Postinstall）未实测。
6. **跨浏览器**：Safari/Firefox、系统字体回退、`color-mix()`/`dvh`/View Transitions 的兼容性未测。
7. **构建产物体积的真实网络成本**未在浏览器 Network 面板测量（仅文件大小静态统计）。

## 11. 复现命令

在本目录下执行（Windows pwsh）：

```powershell
# 1) 类型检查 + 干净构建
npm run check
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm run build
# 期望：两条命令 EXITCODE=0；build 输出 "22 page(s) built"；dist 145 个文件

# 2) 关键产物存在性
'index.html','404.html','atom.xml','rss.xml','rss2.xml','sitemap-index.xml','robots.txt','og-default.jpg','.nojekyll' |
  ForEach-Object { "{0} {1}" -f (Test-Path "dist/$_"), $_ }

# 3) 内部链接爬取（Node，等价于本报告 §2 的脚本）
node --input-type=module -e "import fs from 'node:fs';import path from 'node:path';const D='dist';const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);const htmls=walk(D).filter(f=>f.endsWith('.html'));let miss=[],n=0;const t=new Map();for(const f of htmls){const h=fs.readFileSync(f,'utf8');for(const m of h.matchAll(/(?:href|src)=["'](/[^"']*)["']/g)){n++;const c=m[1].split('#')[0].split('?')[0];if(!c||c.startsWith('//'))continue;if(!t.has(c))t.set(c,[]);t.get(c).push(f)}}for(const[k]of t){let d;try{d=decodeURIComponent(k)}catch{d=k}const p=d.replace(/^\//,'');const cands=d.endsWith('/')?[p+'index.html']:path.extname(p)?[p]:[p+'/index.html',p];if(!cands.some(x=>fs.existsSync(path.join(D,x))))miss.push(k)}console.log({pages:htmls.length,links:n,unique:t.size,missing:miss.length,miss})"

# 4) Feed / sitemap XML 良构与计数
$atom=[xml](Get-Content dist/atom.xml -Raw); $ns=New-Object System.Xml.XmlNamespaceManager($atom.NameTable)
$ns.AddNamespace('a','http://www.w3.org/2005/Atom')
$atom.SelectNodes('//a:entry',$ns).Count          # 期望 8
$sm=[xml](Get-Content dist/sitemap-0.xml -Raw)     # 解析通过 = 良构
(Get-FileHash dist/rss.xml,dist/rss2.xml -Algorithm SHA256).Hash  # 两者应相同

# 5) 内容抽查
Select-String -Path 'dist/**/index.html' -Pattern '宇宙很大，生活更大。' -List
Select-String -Path 'dist/**/index.html' -Pattern '拿到题目先看数据范围' -List
```

---

**报告生成方式**：干净重建 `dist/` 后用 Node/PowerShell 临时脚本对产物做只读探测（脚本未落盘、未修改仓库）；临时构建日志已删除。唯一新增文件即本报告。
