# Hexo → Astro 内容迁移报告

- 执行时间：2026-11-06
- 执行者：content-migrator（Team task-2）
- 脚本：`scripts/migrate-hexo-content.mjs`（读 `source/`，写目标目录；可重复运行，幂等）
- 运行方式：`node scripts/migrate-hexo-content.mjs`
- 结论：**全部校验通过**（8/8 文章正文逐字节一致，8/8 frontmatter 合法且归一化正确；一言 710 条；友链 1 组 4 条；静态资源 3 个 SHA-256 一致）

## 1. 迁移清单

### 1.1 文章（source/_posts → src/content/posts，文件名不变）

| # | 文件 | title | date | updated | categories | tags | 原文件字节 | 正文字节 | 输出字节 |
|---|------|-------|------|---------|------------|------|-----------:|---------:|---------:|
| 1 | CCF-CSP算法板子.md | CCF-CSP 算法板子 | 2026-09-12T16:45:00+08:00 | 2026-09-12T16:45:00+08:00 | 编程 | CCF-CSP, 算法, C++ | 200364 | 200156 | 200333 |
| 2 | CPP常用STL.md | C++ 竞赛（CSP）常用 STL 全注释版 | 2026-01-22T00:00:00+08:00 | —（原文无） | 编程 | —（原文无） | 17877 | 17754 | 17879 |
| 3 | welcome-to-the-blog.md | 欢迎来到新的博客 | 2025-11-09T23:25:04+08:00 | 2025-11-11T15:21:36Z | 编程 | —（原文无） | 387 | 249 | 389 |
| 4 | 心累.md | 心累 | 2025-11-11T23:06:39+08:00 | 2025-11-11T15:21:36Z | 生活 | —（原文无） | 1264 | 1144 | 1266 |
| 5 | 游戏本的痛.md | 游戏本的痛 | 2025-11-10T12:01:14+08:00 | 2025-11-11T15:21:36Z | 生活 | —（原文无） | 421 | 292 | 423 |
| 6 | 记得向尘世之外瞥一眼.md | 记得向尘世之外瞥一眼 | 2025-11-16T01:22:44+08:00 | 2025-11-16T01:22:44+08:00 | 生活 | —（原文无） | 1221 | 1072 | 1223 |
| 7 | 辞旧迎新之时-bgm.md | 辞旧迎新之时 | 2026-01-02T00:00:00+08:00 | —（原文无） | 生活 | —（原文无） | 1076 | 977 | 1078 |
| 8 | 速成路线.md | Vibe Coding 入门指南 | 2026-09-08T22:35:00+08:00 | 2026-09-08T22:35:00+08:00 | 编程 | Vibe Coding, AI | 80792 | 80588 | 80759 |

说明：
- 输出字节与原文不同只来自 frontmatter 重写；正文部分逐字节相同（见 §2）。
- 原文 frontmatter 中的 `published` 字段（仅 #1、#8 有，且与 date 重复）已删除。
- `updated` / `tags` 缺失的文章保持缺失，未补造。
- 正文开头的 `# 一级标题` 保留不动；#1 正文本身不含一级标题（原文如此），也未补加。
- 行尾：原文 6 篇为 CRLF、2 篇（#1、#8）为 LF；正文按原样保留，frontmatter 采用与正文一致的行尾以保证整篇文件行尾统一。

### 1.2 一言（source/hitokoto/sentences.md → src/data/quotes.json）

- 原文 714 行内容（另有末尾换行）：1 行标题 `# 一言列表`、1 行说明文字、2 行空行、**710 行 `- ` 条目**。
- 输出 `quotes.json`：字符串数组，**710 条**，按原文顺序；UTF-8 无 BOM、2 空格缩进、末尾换行。
- 严格按规则「以 `- ` 开头的行去前缀 + 首尾空白」处理，**未去重**：原文含 29 条重复句子，均按原顺序保留（去重后为 681 条）。如产品上需要去重，请明确后再改。
- 首条：`Talk is cheap, show me your code.`；末条：`不知几人真得鹿，毕竟终日梦为鱼。`

### 1.3 友链（source/_data/friends.yml → src/data/friends.json）

- 顶层为分组数组，**1 个分组**，共 **4 个站点**；分组与字段完全按 YAML 原样保留：
  `group`、`description`、`items[]`（`title`、`url`、`avatar`、`description`、`keywords[]`、`color`）。
- `color` 保持字符串（如 `"#0f766e"`），未转成数字/其他类型。
- 分组：朋友们（志同道合的同行者与优秀站点）。

### 1.4 个人资料（_config.yml + source/_data/author.yml → src/data/profile.json）

字段均从配置提取，未编造：

| 字段 | 值 | 来源 |
|------|----|------|
| name | ff66ccff | source/_data/author.yml |
| avatar | /avatar.jpg | source/_data/author.yml |
| url | / | source/_data/author.yml |
| title | ff66ccff | _config.yml `title` |
| subtitle | ""（空字符串） | _config.yml `subtitle`；**未使用** theme cover 的占位文案 `<span id="hitokoto">加载中...</span>` |
| description | ff66ccff 的技术与生活手记，四川大学，计算机，中文VOCALOID，科幻小说 \| Tech & life notes… | _config.yml `description` |
| language | zh-CN | _config.yml `language` |
| siteUrl | https://ff66ccff.github.io | _config.yml `url` |

`social`（3 项，取自 `theme_config.sidebar.widget_library.blogger.social`，原 Font Awesome 类名转为语义 icon，label 用中文/原名）：

| label | icon | 原类名 | url |
|-------|------|--------|-----|
| RSS | rss | fa-solid fa-rss | /atom.xml |
| GitHub | github | fab fa-github | https://github.com/ff66ccff |
| 网易云音乐 | music | fa-solid fa-headphones-alt → 语义归为 music | https://music.163.com/#/playlist?id=3061115045 |

`comments`（giscus，取自 `theme_config.comments.giscus`，按任务要求仅保留 7 个字段）：
`repo`、`repo-id`、`category`、`category-id`、`mapping`、`theme`、`lang`。
（YAML 中另有 strict / reactions-enabled / emit-metadata / input-position，本次未放入；如评论组件需要可再补。）

### 1.5 静态资源

| 源 | 目标 | 字节 | SHA-256（前 12 位） |
|----|------|-----:|--------------------|
| source/avatar.jpg | public/avatar.jpg | 238565 | f5c42523a650 |
| source/photos/wallhaven-yq5ejd_3840x2400.png | public/photos/wallhaven-yq5ejd_3840x2400.png | 933224 | 438cb7379d51 |
| source/photos/记得向尘世之外瞥一眼.jpg | public/photos/记得向尘世之外瞥一眼.jpg | 745571 | c00d511cf8f8 |

文件名完全一致（含中文名），复制后逐一 SHA-256 对比通过。

## 2. 校验结果

### 2.1 正文逐字节校验（两套独立实现交叉验证）

脚本内置校验 + 一次独立编写的字节级校验（直接按行定位 frontmatter 结束位置后 `Buffer.equals`）结果一致：

| 文件 | 正文字节 | 字符串相等 | 字节相等 | frontmatter 合法 | 结论 |
|------|---------:|:----------:|:--------:|:----------------:|:----:|
| CCF-CSP算法板子.md | 200156 | ✅ | ✅ | ✅ | PASS |
| CPP常用STL.md | 17754 | ✅ | ✅ | ✅ | PASS |
| welcome-to-the-blog.md | 249 | ✅ | ✅ | ✅ | PASS |
| 心累.md | 1144 | ✅ | ✅ | ✅ | PASS |
| 游戏本的痛.md | 292 | ✅ | ✅ | ✅ | PASS |
| 记得向尘世之外瞥一眼.md | 1072 | ✅ | ✅ | ✅ | PASS |
| 辞旧迎新之时-bgm.md | 977 | ✅ | ✅ | ✅ | PASS |
| 速成路线.md | 80588 | ✅ | ✅ | ✅ | PASS |

补充校验：
- 生成文件的 frontmatter 用 YAML 解析器回读，`title/date/updated/categories/tags` 与源值完全一致，且不含 `published`。
- 文件名集合与 source/_posts 完全一致（8 个）。
- 所有生成文本文件均为 UTF-8 无 BOM（解码再编码字节相等）。

### 2.2 数据文件校验

- quotes.json：710 条，与源文件重新解析结果深度相等（顺序一致）；JSON round-trip 一致。
- friends.json：与 friends.yml 解析结果深度相等（1 组 4 项，color 全为字符串）。
- profile.json：title/description 与 _config.yml 相等；social 三项 url 与配置一致；comments 7 字段与 giscus 配置一致。

### 2.3 幂等性

- 连续第二次运行脚本：退出码 0，14 个输出文件 SHA-256 全部不变（无重写差异），校验仍全 PASS。

## 3. 注意事项

1. **frontmatter 字符串一律用双引号**（JSON 风格转义，合法 YAML）。date/updated 保留原值与时区偏移（`+08:00` / `Z` 原样，未强制统一为 UTC）。
2. **正文行尾不统一是原文事实**：6 篇 CRLF、2 篇 LF；按「正文逐字节保持」要求未做统一，frontmatter 跟随各篇正文行尾。
3. `public/` 中原本已存在旧 Hexo 构建产物（`index.html`、`atom.xml`、分类/标签页、旧的 `avatar.jpg` 与 photos 等）。本次只按要求覆盖复制了 avatar 与 2 张 photos（内容与原构建产物本就一致，SHA-256 相同）；**未删除其它旧产物**，是否清理由 Lead 决定。
4. `source/` 原文件未做任何修改；未改 package.json、astro 配置、src/pages、src/components、src/styles、workflows；未安装依赖、未构建。
5. Astro content collection 的 `src/content.config`（schema：title/date/updated/categories/tags，date 用 `z.coerce.date()` 或字符串）与页面组件不在本任务写入范围，需由 Lead/其他任务补齐；当前 frontmatter 已满足常见 schema。
6. 旧站 `source/photos` 的封面图（wallhaven…png）与文章内图片路径（如 `/photos/记得向尘世之外瞥一眼.jpg`）保持原路径可用，因为资源已复制到 `public/photos/`。
7. 一言未去重（29 条重复）。若首页一言轮播希望减少重复，可在消费端去重，或在确认后修改迁移脚本。
8. 报告与脚本本身不参与站点构建；脚本若在无 `node_modules/yaml` 的环境运行会因缺少 YAML 解析器而失败（当前仓库 node_modules 已含 `yaml`，系 Astro 依赖）。
