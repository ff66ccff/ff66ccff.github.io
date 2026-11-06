# 一言打字机 × Astro 7 迁移调研

> 调研日期：**2026-11-06**　调研对象：E:\ff66ccff.github.io（Hexo 7.3 + Volantis → Astro 7.4.7）
> 所有 npm 版本 / 发布时间 / gzip 体积均为本机实测，命令与原始输出见附录 A。
> Astro 7 官方文档的逐条摘要请见同目录 `astro7-official.md`（另一路调研产出）；本文第 2 节只保留**与本仓库迁移直接相关的取舍结论**，避免重复。

---

## 0. 结论先行（TL;DR）

| # | 结论 | 关键依据 |
|---|---|---|
| 1 | **最优解不是任何库，而是「构建期静态渲染整句 + CSS 驱动的逐字揭示」**：0 依赖、**0.69 KiB gzip** JS、SSR 即全文（SEO/无 JS 全可见）、无定时器可漂移、`prefers-reduced-motion` 一行 CSS 关闭 | 实测自研实现 1,438 B → gzip **709 B**；现有需求只是「显示一句 + 点击换一句」，不需要退格/循环 |
| 2 | 若坚持用成熟库：**首选 typewriter-effect@3.3.0**（MIT，**5.91 KiB gzip**，2026-10-22 发布）；**备选 TypeIt@8.8.7**（API 最优雅，**4.54 KiB gzip**，但 GPL-3.0 且 2025-01 后无提交） | [npm](https://www.npmjs.com/package/typewriter-effect)、[npm](https://www.npmjs.com/package/typeit) |
| 3 | **不推荐 Typed.js 3.0.0**：许可证已于 3.0.0 从 MIT **改为 GPL-3.0**，且逐字实现基于 UTF-16 `substr`，emoji 会拆成半个代理对 | `npm view typed.js@2.1.0 license` → MIT；`npm view typed.js license` → GPL-3.0；dist 源码含 `substr`、无 `Array.from`/`Intl.Segmenter` |
| 4 | **不推荐** GSAP（31.34 KiB gzip 只为打字）、anime.js（39.56 KiB，无打字原语）、Motion（57.87 KiB，无打字原语）、lit-typewriter 等 Web Component（2023 停更/需 Lit） | 见 §1.2 实测表 |
| 5 | 一言数据：**本地 710 句**（JSON 37.2 KB → gzip **18.9 KB**）为主；官方 API 仅作「idle 增强」；官方文档明确 **v1 限 2 QPS**、要求缓存与附链接、勿爬 | [developer.hitokoto.cn/sentence](https://developer.hitokoto.cn/sentence/)、实测 CORS 头 |
| 6 | 交互范式改为「**首句静态、点击才打字**」：解决现在 `加载中... → fetch → 解析 md → 逐字打` 造成的闪烁/CLS/无 JS 空白，同时把打字时间从「首屏成本」变成「用户主动交互成本」 | 现文件 `source/_volantis/bodyEnd.ejs` + `ToDO.md` 中作者自述的「Loading... 之痛」 |
| 7 | Astro 7 硬门槛：**Node ≥ 22.23.4**（astro 7.4.7 `engines.node`）；GitHub Pages 官方推荐已从 `withastro/action@v3` 升到 **`withastro/action@v6`**，默认 Node 24 | `npm view astro@7.4.7 engines`；[部署文档](https://docs.astro.build/en/guides/deploy/github/) |
| 8 | Astro 7 最大迁移坑：**默认 Markdown 处理器换成 Sätteri** → `remark-gfm` 不再需要（GFM 内置）、`rehype-slug` 不再需要（Astro 自己注入 heading id）；要用 remark/rehype 必须显式装 `@astrojs/markdown-remark` 并 `processor: unified()` | [v7 升级指南](https://docs.astro.build/en/guides/upgrade-to/v7/) |

---

# 1. 一言打字机（重点）

## 1.1 现状体检：这套手写实现到底损失了什么

现状（`source/_volantis/bodyEnd.ejs`，57 行内联脚本）：

```js
fetch('<%- url_for("/hitokoto/sentences.md") %>')
  .then(res => res.text())
  .then(text => hydrate(text.split(/\r?\n/).filter(l => l.startsWith('- ')).map(...)))
// typeText: setInterval 55ms，每次 target.textContent = text.slice(0, idx + 1)
// click → showNext(): current = (current + 1) % lines.length
```

| 问题 | 具体表现 | 后果 |
|---|---|---|
| **首屏硬编码占位** | 模板里写死 `<span id="hitokoto">加载中...</span>`，必须等 HTML → 下载 EJS 渲染的脚本 → fetch `sentences.md`（37.98 KB，未压缩、无缓存策略）→ 正则解析 715 行 → 才开始打字 | 首屏文案在弱网下长时间是「加载中...」；这正是作者 `ToDO.md` 里写的「**Loading... 之痛**」；对爬虫与 RSS 而言首页副标题是空字符串 |
| **`setInterval` 固定 55ms** | 不跟 `requestAnimationFrame` 对齐；后台标签页被节流后回到前台会“瞬间追帧”；无漂移补偿 | 打字节奏在慢设备上抖动；不是可组合的动画时钟 |
| **每字整段重写** | `target.textContent = text.slice(0, i)` 每 55ms 触发一次文本节点替换 + 布局 | 每次都触发布局；CJK 字体 fallback 切换时宽度跳变（CLS 来源之一） |
| **UTF-16 切片** | `slice(0, i)` 按 code unit 切割 | CJK（BMP）无碍，但 emoji / 组合音标会被拆成半个代理对（现有 710 句里没有 emoji，属于“暂时没炸”） |
| **无 `prefers-reduced-motion`** | 一律逐字动画 | 对前庭敏感用户不友好；Lighthouse/axe 可检出 |
| **可访问性缺失** | `<span>` + `title="点击切换下一句"`，无 `role`/`tabindex`/键盘事件/`aria-live` | 键盘与读屏用户无法“换一句”，且读屏会把逐字变化读成噪音 |
| **无清理路径** | 只在下一次 `typeText` 时 `clearInterval`，组件卸载/页面切换（Astro `ClientRouter` 场景）无销毁钩子 | 页面切换后定时器可能继续跑，属真实内存/CPU 泄漏 |
| **顺序轮播** | 命中随机起点后 `(current + 1) % 710` 顺序推进 | 长句会成串出现；无去重、无“洗牌队列” |
| **无错误语义** | `catch(() => {})`，静默保留「加载中...」 | 断网/404 时永远停在“加载中...” |

**成本量化**（本地实测，见附录 A）：710 句，平均 **16.6 个字符**、最长 **68 字符**；55ms/字 → 平均句需 **0.91 s**、最长句需 **3.74 s** 才打完。也就是说：最长的那句，用户要盯 3.7 秒才看到完整意思，而这期间首屏一直是残缺文本。

> 结论：**问题不在“打字动画”本身，而在“用运行时拿下第一句话”**。任何库都救不了“先 fetch 再打字”的首屏结构；必须先改成“构建期就有整句”。

---

## 1.2 候选成熟实现逐一评估（实测数据）

> 体积口径：`dist/` 产物文件原始字节 + `zlib.gzipSync(level 9)` 实测；并与 [bundlephobia](https://bundlephobia.com/) 交叉核对（数值基本一致，差异来自入口文件不同）。

| 方案 | npm 最新版 | 发布时间 | 许可证 | gzip 体积（实测） | GitHub Star | 最近提交 | CJK / 字素 | 光标·循环·退格·随机 | reduced-motion | 静态站/SSR |
|---|---|---|---|---|---|---|---|---|---|---|
| **typewriter-effect** | **3.3.0** | **2026-10-22** | **MIT** | **5.91 KiB**（core.js 20,846 B） | 2.7k | 2026-10 | ✅ `Intl.Segmenter`（`useGraphemeSplitter`） | 光标✅ 循环✅ 退格✅ 随机＝自己 shuffle | ❌ 内置，但 `skipToEnd()` 可一键跳过 | ✅ `initialText` 可承接 SSR 文本 |
| **TypeIt** | **8.8.7** | 2024-10-25 | GPL-3.0（双许可，可购商用） | **4.54 KiB**（umd 11,872 B） | 3.2k | 2025-01 | ⚠️ `Array.from` 码点级：CJK✅，ZWJ emoji ❌ | 光标✅ 循环✅ 退格✅ 随机＝回调实现 | ❌ | ⚠️ 无 `initialText`，向元素内追加 |
| **Typed.js** | **3.0.0** | **2026-01-24** | **GPL-3.0**（2.1.0 还是 MIT） | **3.18 KiB**（umd 10,646 B） | 16k | 2026-01 | ⚠️ UTF-16 `substr`：CJK✅，emoji ❌ | 光标✅ 循环✅ 退格✅ 随机✅（`shuffle`） | ❌ | ⚠️ 用元素现有文本作起点，会“重打一遍” |
| GSAP + TextPlugin | 3.15.1 | 2026-11-05 | 标准「免费」许可 | **31.34 KiB**（core 27.84 + Text 3.50） | 30k | 2026-11 | ⚠️ 按索引递增 | 时间线可编排 | ✅ `gsap.matchMedia()` | ⚠️ 纯客户端 |
| anime.js | 4.5.0 | 2026-11-02 | MIT | **39.56 KiB** | 74k | 2026-08 | ❌ 无打字 API（需自拆 + stagger） | — | 需自建 | — |
| Motion（framer-motion vanilla） | 14.9.1 | 2026-11-04 | MIT | **57.87 KiB**（全量入口） | 35k | 2026-11 | ❌ 无打字 API | — | 需自建 | — |
| 纯 CSS `steps()` + `ch` | — | — | — | 0 | — | — | ❌ 见 §1.2.7 | 光标✅ | ✅ `@media` | ✅ 构建期全文 |
| **逐字 `<span>` + CSS `animation-delay`**（自研 ≈40 行） | — | — | — | **0.69 KiB**（709 B gzip / 1,438 B 源） | — | — | ✅ `Intl.Segmenter` | 光标✅ 随机✅ 循环❌ 退格❌ | ✅ 一行 CSS | ✅ 构建期全文 |
| Web Component 生态 | lit-typewriter 2.0.0 / @webcomponent/typewriter 1.0.0 | 2023-08-31 / 2018-10-05 | MIT | — | — | 均停更 | — | — | — | — |
| astro-typewriter | 1.2.0 | 2026-03-11 | MIT | 7,834 B（未压缩） | — | 2026-03 | 未验证 | 未验证 | 未验证 | ⚠️ `peerDependencies.astro` 仅 `^5 \|\| ^6`，**未声明 7** |

### 1.2.1 typewriter-effect 3.3.0（MIT，首选库）

- **体积**：`typewriter-effect/dist/core.js` = 20,846 B → gzip **6,052 B（5.91 KiB）**，零运行时依赖（bundlephobia：full entry 22,599 B / gzip 6,693 B）。
- **CJK/字素**：源码内含 `Intl.Segmenter` 与 `useGraphemeSplitter` 选项——**默认关**，开启后按字素簇切分：中文、emoji、带音标的拉丁字母都作为一个“字符”处理，完全适配本博客的 706 条中文句。
- **SSR 友好**：有 `initialText` 选项（“创建时立刻显示的文本，可像打字文本一样被删除，循环时不会重打”）——这正好承接 Astro 构建期渲染的整句，避免“先空再打”的闪烁。
- **其它关键能力**：`loop`、`deleteOnLoop`、`keepLastString`、`cursorBlink`、`deleteSpeed`、`pauseFor`、`maxCatchUpDelta`（后台标签页回来不狂刷）、`mergeTextNodes`（长文本性能 / Safari 字形整形）、`parseHTML`、`skipAddStyles`；方法链 `start/stop/pause/skipToEnd/clearQueue/typeString/pasteString/deleteAll/clear/changeDelay/changeCursor`。
- **无障碍**：没有 `prefers-reduced-motion` 的自动处理，但 **`skipToEnd()`** 提供了干净的“一键跳过到最终态”钩子（比其它库只有 `stop()` 好）。
- **风险（必须写进实施说明）**：
  1. `peerDependencies` 声明了 `react >= 17`、`react-dom >= 17`（v3 是 React 优先的重写版）→ **npm 7+ 会自动把 react/react-dom 装进 node_modules**。解法：`npm i typewriter-effect --omit=peer`，或用 pnpm（默认不自动装 peer），或直接用 CDN 版 UMD。
  2. `dist/core.js` 是 **UMD**（`define.amd` / `module.exports` 都在）而非 ESM，Vite 需走 CJS 互操作；也可 `is:inline` 直接引 CDN。
  3. v3 是 **2026-10-22 一天内连发 3.0.0→3.3.0** 的“复活版”（2.22.0 是 2025-04-29），成熟度不如其 2.x 长尾。生产上建议锁 `3.3.0` 精确版本。
- 来源：[npm](https://www.npmjs.com/package/typewriter-effect) · [GitHub](https://github.com/tameemsafi/typewriterjs) · [README 选项表](https://unpkg.com/typewriter-effect@3.3.0/README.md)

### 1.2.2 TypeIt 8.8.7（GPL-3.0，备选库）

- **体积**：`dist/index.umd.js` 11,872 B → gzip **4,647 B（4.54 KiB）**；ES 版 dist 未压缩 27,071 B（gzip 7,533 B）。依赖 1 个（`@types/web-animations-js`，类型包）。
- **API 最优雅**：链式 `new TypeIt(el, opts).type('a').pause(500).delete(3).type('b').go()`；有 `destroy() / reset() / freeze / exec() / move()`，队列式设计比“选项对象”更表达意图。
- **逐字**：源码用 `Array.from`（码点级）——CJK 完全正确；但 ZWJ 组合 emoji（👨‍👩‍👧）仍会被拆开。
- **短板**：① 许可证 **GPL-3.0**（对本仓库这类**源码公开**的博客合规成本≈0，只要保留版权声明；但若将来想闭源或商用模板需换许可/买商用授权）；② npm 最后发布 **2024-10-25**、仓库最后提交 **2025-01**，维护节奏明显放缓；③ **没有 `initialText` 语义**，它向元素内追加内容，SSR 文本会变成“重复打一遍”；④ 无 reduced-motion。
- 来源：[npm](https://www.npmjs.com/package/typeit) · [GitHub](https://github.com/alexmacarthur/typeit) · [typeitjs.com](https://typeitjs.com)

### 1.2.3 Typed.js 3.0.0（GPL-3.0，**不推荐**）

- 体积最小（gzip 3.18 KiB）、Star 最多（16k）、功能齐全（`shuffle: true` 直接随机、`fadeOut`、`smartBackspace`、`loop/loopCount`、`cursorChar`、`contentType: 'html'`、完整回调），**但有两个硬伤**：
  1. **许可证变更**：`npm view typed.js@2.1.0 license` → `MIT`；`npm view typed.js license`（3.0.0）→ **`GPL-3.0`**，`package.json` 同为 GPL-3.0（2026-01-24 发布）。对本站（公开仓库）可接受，但这是一个**容易被忽略的许可证陷阱**，对比 MIT 的 typewriter-effect 没有优势。
  2. **逐字实现是 UTF-16 索引**：`dist/typed.module.js` 里用 `substring` + `.length` 推进（全文无 `Array.from` / `Intl.Segmenter`）→ emoji 会被切成半个代理对。当前 710 句无 emoji，但“以后想加一句带有 emoji 的话”就会踩坑。
  3. 没有 SSR 初文语义：它把元素现有文本当作 `elContent` 再打一遍，首屏同样会“重打”。
- 来源：[npm](https://www.npmjs.com/package/typed.js) · [GitHub](https://github.com/mattboldt/typed.js)

### 1.2.4 GSAP 3.15.1 + TextPlugin（能力过剩）

- gzip：`gsap.min.js` **28,511 B（27.84 KiB）** + `TextPlugin.min.js` **3,579 B（3.50 KiB）** = **31.34 KiB**；`SplitText.min.js` 另 3,638 B。
- 许可：npm 元数据为 **标准「免费」许可**（[gsap.com/standard-license](https://gsap.com/standard-license)）；TextPlugin/SplitText 已随公开 npm 包直接分发（本次实测即从 public tarball 取到），无需再单独付费。
- 优点：`gsap.matchMedia()` 原生支持 `(prefers-reduced-motion: reduce)` 分支，时间线可精确编排。
- 结论：**为了一句打字引入 31 KiB 的动画引擎不划算**；除非站点本来就要做滚动/转场编排，否则不选。

### 1.2.5 anime.js 4.5.0 / Motion 14.9.1（无打字原语）

- anime.js：MIT，74k star，2026-11-02 发布，但 **gzip 39.56 KiB** 且 **没有打字机 API**——需要自己按字拆分再 `stagger()`，等于“自己写打字机 + 引一个 39 KiB 引擎”。
- Motion（framer-motion 的 vanilla 版）：MIT，35k star，**维护极活跃（调研前一天还有提交）**，但全量入口 gzip **57.87 KiB**，同样没有文本拆字/打字原语。
- 结论：适合做**页面级动效**，不适合当打字机。

### 1.2.6 Web Component / 无依赖微型库（2026 年仍是空白）

- `lit-typewriter@2.0.0`（2023-08-31）：基于 Lit，引入 Lit 运行时（~15 KiB+）只为 40 行逻辑；停更 3 年。
- `@webcomponent/typewriter@1.0.0`（2018-10-05）：停更 8 年，不考虑。
- `sv-typewriter`（Svelte 专用）、`react-simple-typewriter` / `react-typewriter-effect`（React 专用）、`@marcreichel/alpine-typewriter`（需 Alpine）：都与 Astro 的“零框架岛”路线不兼容，且各自绑定框架。
- `astro-typewriter@1.2.0`（2026-03-11，MIT，7,834 B）：**唯一 Astro 原生包**，但 `peerDependencies.astro` 只写 `^5.0.0 || ^6.0.0`，**未声明 Astro 7**，且无 CJK/reduced-motion 说明。可作为“试试看”，不适合作为唯一方案。
- **结论**：2025–2026 仍**没有**一个“无依赖 + 字素感知 + 无障碍感知 + 停更风险低”的 Web Component 打字机库。这个空位正好由方案 G（§1.2.7）填上。

### 1.2.7 纯 CSS 两种路线（必须区分）

**① `steps()` + `ch` 宽度动画（不可行）**：`ch` 是“0”字形宽度，1 个全角汉字 ≈ 2ch；中英混排时 `steps(n)` 的 n 与实际字符数不匹配，光标与文本会错位。**只适用于纯 ASCII 等宽文本**。

**② 逐字 `<span>` + `animation-delay`（可行且最优）**：构建期/首次交互时用 `Intl.Segmenter` 把句子拆成字素，给每个 `<span>` 设 `--i`，由 CSS 做逐字揭示：

```css
.hk-ch { opacity: 0; animation: hk-in .01s steps(1) forwards; animation-delay: calc(var(--i) * 55ms); }
@keyframes hk-in { to { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .hk-ch { animation: none; opacity: 1 } }
```

优势：**无 `setInterval`/`setTimeout`**（CSS 动画在合成线程，后台标签页自动节流、回前台不追帧）、天然无漂移、无需清理、无障碍靠一行 `@media` 解决、SSR 输出即全文（爬虫/无 JS 用户看到完整句子）。实测实现（含 `Intl.Segmenter` + 键盘可达 + 随机不重复）源 1,438 B → **gzip 709 B（0.69 KiB）**。

---

## 1.3 明确推荐

### 推荐 A（本博客最优）：方案 G「静态整句 + CSS 逐字揭示」

**第一选择。** 理由：本场景的真实需求是「显示一句 + 点击换一句」，**不需要退格、不需要顺序循环多句、不需要打字中途暂停**——这三样正是库存在的理由。放弃它们后：

| 对比项 | 现状手写 setInterval | 方案 G |
|---|---|---|
| 首屏文案 | `加载中...` 等 fetch | **构建期就是完整句子**（SEO/无 JS/RSS 全可见） |
| 运行时依赖 | 37.98 KB 未压缩 `sentences.md` + 正则解析 | 0.69 KiB 脚本；句子 JSON 点击后才 `import()` |
| 计时 | `setInterval` 55ms，漂移+节流 | CSS `animation-delay`，无定时器 |
| 擦除/清理 | 无 destroy 钩子 | 无定时器可泄漏；`replaceChildren()` 即换句 |
| 字素 | `slice()` 按 UTF-16 | `Intl.Segmenter` 字素簇 |
| 无障碍 | 无 | `role="button"`/`tabindex`/Enter·Space/`aria-live`/reduced-motion |
| 体积 | 0（但每页 38 KB 数据） | **0.69 KiB** |

完整实现见 §1.4。

### 推荐 B（要「成熟库」时的第一选择）：**typewriter-effect@3.3.0**

理由（相对手写 setInterval）：① **MIT**，许可证干净；② `initialText` 让 SSR 文本直接成为初始态，**零闪烁**；③ `useGraphemeSplitter` 用 `Intl.Segmenter` 做到**字素级**，中文/emoji 都不炸；④ `skipToEnd()` 给 reduced-motion 一个一行钩子；⑤ `maxCatchUpDelta` 解决后台标签页回前台狂刷；⑥ 2026-10 刚发布，维护在线；⑦ 5.91 KiB gzip、零运行时依赖。

**备选：TypeIt@8.8.7** —— 若你更看重“链式 API 的可读性/可维护性”且接受 GPL-3.0：4.54 KiB gzip、`destroy()` 干净、`Array.from` 保证 CJK 正确。代价：无 `initialText`（首屏要自己处理）、2025-01 后无提交。

**明确不选**：Typed.js 3.0（GPL 变更 + UTF-16 拆字 + 无初文）、GSAP（31 KiB 过重）、anime.js / Motion（无打字原语）、lit-typewriter 等 WC（停更/需框架）、`steps()`+`ch`（CJK 错位）。

---

## 1.4 在 Astro 7 里落地（可直接抄）

### 1.4.1 数据准备：`sentences.md` → `src/data/hitokoto.json`

```bash
# 一次性脚本：把 715 行 Markdown 列表转成 JSON（710 条）
node -e "const fs=require('fs');const t=fs.readFileSync('source/hitokoto/sentences.md','utf8');const a=t.split(/\r?\n/).filter(l=>l.trim().startsWith('- ')).map(l=>l.replace(/^\s*-\s+/,'').trim()).filter(Boolean);fs.mkdirSync('src/data',{recursive:true});fs.writeFileSync('src/data/hitokoto.json',JSON.stringify(a,null,0))"
```

实测：710 条，JSON 原始 **37,162 B**，gzip **18,937 B**（≈18.5 KiB，只在点击后加载，不进首屏关键路径）。

> 本仓库脚手架已落地为 `src/data/quotes.json`（710 条，39,294 B / gzip 19,119 B）；下文示例中的 `hitokoto.json` 路径请以实际文件为准。

### 1.4.2 组件：`src/components/Hitokoto.astro`

```astro
---
// 构建期随机选一句 → 静态渲染（SEO / 无 JS / RSS 都能拿到完整句子）
import sentences from '../data/hitokoto.json';
const first = sentences[Math.floor(Math.random() * sentences.length)];
---
<p
  id="hitokoto"
  class="hitokoto"
  role="button"
  tabindex="0"
  aria-label={first}
  title="换一句"
>{first}</p>

<script>
  import { mountHitokoto } from '../scripts/hitokoto.js';
  // ClientRouter 场景：每次页面加载（含站内跳转）都重新挂载
  document.addEventListener('astro:page-load', () => {
    const el = document.getElementById('hitokoto');
    if (el) mountHitokoto(el, { speed: 55, load: () => import('../data/hitokoto.json').then(m => m.default) });
  });
</script>

<style>
  .hitokoto { cursor: pointer; min-height: 1.5em; }      /* 预留行高，防 CLS */
  .hitokoto::after { content: '▍'; animation: hk-blink 1s steps(1) infinite; }
  .hitokoto .hk-ch { opacity: 0; animation: hk-in .01s steps(1) forwards; animation-delay: calc(var(--i) * 55ms); }
  @keyframes hk-in { to { opacity: 1 } }
  @keyframes hk-blink { 50% { opacity: 0 } }
  @media (prefers-reduced-motion: reduce) {
    .hitokoto .hk-ch { animation: none; opacity: 1 }
    .hitokoto::after { animation: none }
  }
</style>
```

### 1.4.3 逻辑：`src/scripts/hitokoto.js`（实测 1,438 B / gzip 709 B）

```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const seg = new Intl.Segmenter('zh', { granularity: 'grapheme' });
const graphemes = (s) => [...seg.segment(s)].map((x) => x.segment);

export function mountHitokoto(el, { speed = 55, load } = {}) {
  if (!el || el.dataset.mounted) return;
  el.dataset.mounted = '1';

  const live = document.createElement('span');   // 读屏播报用（视觉隐藏）
  live.setAttribute('aria-live', 'polite');
  live.className = 'sr-only';
  el.after(live);

  let list = null, busy = false, current = el.textContent.trim();

  const render = (text, animate) => {
    current = text;
    el.setAttribute('aria-label', text);
    live.textContent = text;
    if (!animate || reduce.matches) { el.textContent = text; return; }
    el.textContent = '';
    const frag = document.createDocumentFragment();
    graphemes(text).forEach((g, i) => {
      const s = document.createElement('span');
      s.textContent = g;
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      frag.append(s);
    });
    el.append(frag);                    // 无定时器：CSS 播完即停在最终态
  };

  const next = async () => {
    if (busy) return;
    busy = true;
    try {
      list ||= await load();            // 第一次点击才下载 18.5 KiB JSON
      if (!list?.length) return;
      let n = list[Math.floor(Math.random() * list.length)];
      for (let i = 0; n === current && i < 8; i++) n = list[Math.floor(Math.random() * list.length)];
      render(n, true);
    } finally {
      busy = false;
    }
  };

  el.addEventListener('click', next);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
  });
  render(current, false);               // 首屏：不重打，直接显示整句
}
```

> 说明：`Intl.Segmenter` 自 2024 年起进入 Baseline（Chrome 87+ / Safari 14.1+ / Firefox 125+，见 [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter)）。若要兼容更老的浏览器，回退 `[...text]` 即可（码点级，CJK 正确）。

### 1.4.4 若坚持用库：typewriter-effect 接线

```astro
<script>
  import Typewriter from 'typewriter-effect/dist/core';   // UMD → Vite CJS 互操作
  const el = document.getElementById('hitokoto');
  if (el && !el.dataset.mounted) {
    el.dataset.mounted = '1';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const tw = new Typewriter(el, {
      initialText: el.textContent,     // ← SSR 整句成为初始态，零闪烁
      delay: 55, deleteSpeed: 18, cursor: '▍',
      useGraphemeSplitter: true,       // ← 字素级，中文/emoji 安全
      parseHTML: false,
    });
    el.addEventListener('click', async () => {
      const list = await import('../data/hitokoto.json').then(m => m.default);
      const next = list[Math.floor(Math.random() * list.length)];
      if (reduce.matches) { tw.clear().pasteString(next); return; }  // 无障碍：直接落字
      tw.deleteAll(18).typeString(next).start();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') el.click();
    });
  }
</script>
```

### 1.4.5 页面切换（ClientRouter）与清理

- Astro 的 `<ClientRouter />` 站内跳转**不会重跑普通 `<script>`**，必须监听 `astro:page-load`（见上）；组件里用 `data-mounted` 防重复初始化。
- 方案 G **没有定时器**，唯一需要清的是 `astro:before-swap` 上的事件监听（若你把监听挂在 `document` 上）。
- 用库时（TypeIt/typed.js/typewriter-effect）在 `astro:before-swap` 调 `destroy() / stop() / clearQueue()`，否则旧实例的时间线会和新 DOM 打架。

### 1.4.6 验收清单（打字机部分）

- [ ] 禁用 JS：首屏必须出现**完整一句**（`curl -s https://ff66ccff.github.io/ | grep hitokoto`）
- [ ] Lighthouse CLS = 0（容器预留 `min-height`，字号固定）
- [ ] 键盘 Tab 可聚焦、Enter/Space 可换句
- [ ] DevTools → Rendering → `prefers-reduced-motion: reduce` 下**无逐字动画**、无光标闪烁
- [ ] 后台标签页停留 30s 回来，不出现“瞬间补播 200 字”
- [ ] 断网/双击快速点击：无异常、不停留在“加载中...”
- [ ] 连续点击 20 次无内存增长（Performance monitor）

---

## 1.5 一言数据策略：本地 vs 官方 API

### 1.5.1 官方 API 事实（实测/文档核对，2026-11-06）

| 项 | 结论 | 依据 |
|---|---|---|
| 端点 | `https://v1.hitokoto.cn/`（海外镜像 `international.v1.hitokoto.cn`） | [文档](https://developer.hitokoto.cn/sentence/) |
| QPS 限制 | **v1：2 QPS**；international：20（含 2s 缓存） | 同上「请求地址」表 |
| 方法 | 文档写 `Any`（GET 即可） | 同上 |
| 参数 | `c`（分类，可重复，如 `?c=a&c=c`）、`encode`（json/text/js）、`charset`（utf-8/gbk）、`callback`、`select`、`min_length`（默认 0）、`max_length`（默认 30） | 同上「请求参数」 |
| 返回 | `hitokoto / from / from_who / type / uuid / length / created_at` 等 | 同上 |
| CORS | **`Access-Control-Allow-Origin: *`**（实测响应头，Cloudflare 前置，`Vary: Origin`） | 本机 `Invoke-WebRequest` 实测 |
| 隐私 | 请求由对方服务器处理（含 IP/UA）；文档未提供隐私政策细节，但明确**不欢迎爬虫刷库** | 文档「接口说明」 |
| 使用条款 | 公益性服务：大流量站点需提前联系授权；**建议自行部署**；**请求中尽可能附上一言的链接**（如 `https://hitokoto.cn?uuid=`） | 同上 |
| 数据源 | 全量语句库公开：`https://sentences-bundle.hitokoto.cn/`，**AGPL 授权**；通过其提供的 CDN 超链接方式使用时豁免开源要求 | [sentences-bundle](https://sentences-bundle.hitokoto.cn/) |
| 自部署 | 后端开源（`hitokoto-osc/hitokoto-api`），可 Docker 自建 | 文档「接口部署」 |

### 1.5.2 三种数据方案对比

| 方案 | 首屏成本 | 可用性 | 新鲜度 | 隐私 | 合规 | 适配静态站 |
|---|---|---|---|---|---|---|
| 纯本地 JSON（推荐基线） | 0（构建期打包/点击后按需） | 100%（不依赖第三方） | 手动更新 | 无外泄 | 自有 710 句，无版权问题 | ✅ 最佳 |
| 纯官方 API | 1 次跨域请求 + 失败兜底 | 受 QPS/网络/被墙影响 | 每次都新 | IP/UA 交给第三方 | 需附链接、限流 | ⚠️ 每次访问都打第三方，首页流量大时可能被拉黑 |
| **本地优先 + API 增强 + 无 JS 回退（推荐）** | 0（增强请求放 idle） | 99.9%（API 失败静默降级） | 增强句新鲜 | 可接受（仅 idle 一次） | 附链接即可 | ✅ |

### 1.5.3 推荐架构

```
构建期 (Astro build)
  └─ src/data/hitokoto.json  (710 条自有句子, 37.2KB / gzip 18.9KB)
        └─ 首句：构建期随机 → 直接写进 HTML（SEO/无 JS/RSS 完整可见）

首次交互 (click / idle)
  └─ await import('./hitokoto.json')  → 本地立即换句（0 网络，最快路径）

可选增强 (requestIdleCallback, 仅一次)
  └─ fetch('https://v1.hitokoto.cn/?encode=json&max_length=40')
       ├─ 成功 → 追加进内存池（不落盘），并把 uuid 记到 data 属性，供「来源」链接
       └─ 失败/超时(2s)/限流 → 静默忽略，本地池照常工作

降级 (无 JS)
  └─ 构建期整句已经渲染，页面完整可用；点击无反应但不缺内容
```

**取舍要点**：
1. **不要把 API 放在首屏路径**——它违背“静态优先”，且每次访问都向公益服务发一次请求（首页 PV 高时可能触发对方限流/拉黑）。
2. 增强请求要 **`requestIdleCallback` + `AbortController` 2s 超时 + `sessionStorage` 缓存 30 分钟**，同一会话只打一次。
3. 保留出处：拿到 `uuid` 时渲染 `<a href="https://hitokoto.cn?uuid=xxx">来源</a>`，这既是文档要求的“尽可能附链接”，也是对公益项目的尊重。
4. 若将来想要“全量一言库”，**不要**把 `sentences-bundle` 整包 vendor 进仓库（AGPL 传染 + 体积失控）；按文档的豁免方式走 CDN 超链接。
5. 你现有的 710 句是**自有内容**（`sentences.md` 里多为诗词/歌词/原创），建议保持“本地为主”，这样站点的“个人辨识度”仍在，不会被公共库淹没。

---

# 2. Astro 7 迁移（只保留取舍结论）

> 官方文档逐条摘要见同目录 `astro7-official.md`；本节只记录**影响本仓库迁移决策**的部分。
> 版本基线（实测）：`astro@7.4.7`（2026-11-05）、`@astrojs/rss@4.0.19`、`@astrojs/sitemap@3.7.4`、`@astrojs/mdx@8.1.3`、`@astrojs/markdown-remark@7.3.6`。

## 2.1 硬门槛与破坏性变化

| 项 | Astro 7 现状 | 对本仓库影响 |
|---|---|---|
| Node | `engines.node: ">=22.23.4"`（实测） | 现 `deploy.yml` 用 Node 20 → **必须升 22/24** |
| 构建器 | Vite **8** | Volantis 的 stylus/自定义插件体系无法迁移，属重写而非移植 |
| 编译器 | **Rust 编译器成为唯一实现**，对非法 HTML 更严格（未闭合标签直接报错；不再自动纠正嵌套） | 迁移时 `<p>` 内嵌 `<div>` 之类旧模板写法会直接 build fail |
| Markdown | **Sätteri 成为默认处理器**，`@astrojs/markdown-remark` 不再默认安装 | 见 §2.2 |
| HTML 空白 | `compressHTML` 默认从 `true` 改为 **`'jsx'`** | 行内元素之间的空格会被吃掉，中文站常靠空格分隔，需目检 |
| 其他 | `src/fetch.ts` 成为保留文件名；`@astrojs/db` 移除；`astro:transitions` 内部常量移除；`getContainerRenderer()` 改子路径 | 与本项目基本无关 |

来源：[Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/)

## 2.2 Markdown 处理：三个必须提前知道的结论

1. **`remark-gfm` 不需要装**：Sätteri 默认启用 GitHub-Flavored Markdown（表格/删除线/任务列表/脚注）与智能标点。来源：[Markdown 文档](https://docs.astro.build/en/guides/markdown-content/)
2. **`rehype-slug` 不需要装**：Astro 会**自动给标题注入 `id`**，并可通过 `render(entry).headings` / `getHeadings()` 拿到 TOC 数据；自定义插件的 id 会被保留（Astro 在其后注入）。来源：同上「Heading IDs」
3. **真要用 remark/rehype 插件**：必须显式安装 `@astrojs/markdown-remark`（Astro 7 不再默认安装）。两条合法路径：① 继续用已标记 deprecated 的 `markdown.remarkPlugins` / `markdown.rehypePlugins`（本仓库当前脚手架即此方式，因已装该包所以可用）；② 显式 `processor: unified({...})`（更面向未来）；Sätteri 原生插件则走 `@astrojs/markdown-satteri` 的 `hastPlugins`：

```js
// 走 unified（需要装 @astrojs/markdown-remark）
import { unified } from '@astrojs/markdown-remark';
export default defineConfig({ markdown: { processor: unified({ rehypePlugins: [/* ... */] }) } });

// 或走 Sätteri 的 HAST 插件
import { satteri, satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
export default defineConfig({ markdown: { processor: satteri({ hastPlugins: [/* ... */] }) } });
```

**Shiki（代码高亮）**：默认开启；双主题写法如下（注意 CSS 类名是 `.astro-code`，不是 `.shiki`）：

```js
markdown: {
  shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
}
```
```css
@media (prefers-color-scheme: dark) {
  .astro-code, .astro-code span {
    color: var(--shiki-dark) !important;
    background-color: var(--shiki-dark-bg) !important;
  }
}
/* 或按 data-theme 切换：html[data-theme="dark"] … */
```
来源：[Syntax Highlighting](https://docs.astro.build/en/guides/syntax-highlighting/)

**Mermaid**：Astro **没有内置支持**。两条路：
- 构建期渲染：`rehype-mermaid`（需 `@astrojs/markdown-remark` + `unified()`，且依赖 playwright/chromium，CI 体积与构建时间上涨）；
- 客户端渲染：`<pre class="mermaid">` + `is:inline` 引入 mermaid ESM，按需 `mermaid.run()`；代价是 300 KB+ 运行时。
建议：**博客里 mermaid 少的话走客户端按需加载**（首屏不引），多的话再上 `rehype-mermaid`。

## 2.3 最小可用 `astro.config.mjs`（Astro 7 语法）

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 用户站（仓库名 = ff66ccff.github.io）→ base 用 '/'，不需要子路径
  site: 'https://ff66ccff.github.io',
  base: '/',
  // Hexo permalink 自带尾斜杠（/2026/01/22/xxx/）→ 'always' 最保 URL；
  // 过渡期若两套链接混用可先 'ignore' 容错
  trailingSlash: 'always',
  output: 'static',
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
    // 如需 remark/rehype 插件：先装 @astrojs/markdown-remark，再 processor: unified({...})
  },
  integrations: [sitemap()],
  // Astro 7：compressHTML 默认 'jsx'；中文站若发现行内空格丢失可临时设 true
  compressHTML: true,
});
```

## 2.4 最小 `src/content.config.ts`（Astro 5+ / 7 一致）

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

要点（与 Astro 4/5 的差异）：
- 配置文件在 **`src/content.config.ts`**（不再放在 `src/content/` 里）；集合**不再写 `type: 'content'`**，改由 `loader` 声明数据源（Astro 5 起）。
- `slug` 字段取消 → 统一用 **`entry.id`**（`getCollection()` 返回的条目）；`Astro.glob()` 已废弃。
- 渲染用 **`render(entry)`**（`astro@5.0.0` 新增），返回 `{ Content, headings, remarkPluginFrontmatter }`；旧的 `entry.render()` 已移除。
- 动态路由：`getStaticPaths()` 里 `getCollection('blog')` + `paginate(posts, { pageSize: 10 })` 做分页；渲染 `<Content />`。
- **本仓库实际落地**：集合名为 `posts`（`src/content/posts/`），示例中的 `blog` 请替换。
来源：[Content collections](https://docs.astro.build/en/guides/content-collections/) · [astro:content reference](https://docs.astro.build/en/reference/modules/astro-content/) · [v5 升级](https://docs.astro.build/en/guides/upgrade-to/v5/) · [Routing#Pagination](https://docs.astro.build/en/guides/routing/)

## 2.5 现代博客能力：取舍表

| 能力 | 2026 推荐做法 | 版本/要点 | 坑 |
|---|---|---|---|
| RSS | `@astrojs/rss` 的 `rss()` + `src/pages/rss.xml.js` 的 `GET` | **4.0.19** | 必须配 `site`，否则链接是相对路径 |
| Sitemap | `@astrojs/sitemap`，`integrations: [sitemap()]` | **3.7.4** | 同样依赖 `site`；404/草稿要 exclude |
| 分页 | `getStaticPaths({ paginate })` | 内置 | 与 `trailingSlash` 组合时注意翻页 URL |
| 暗色模式 | 无内置：`html[data-theme]` + `<head>` 内联「无闪烁」脚本 + CSS 变量 | 内联脚本必须在首屏渲染前执行 | `<ClientRouter />` 切页后要重新同步 `data-theme`（脚本不重跑） |
| View Transitions | `import { ClientRouter } from 'astro:transitions'`，放 `<head>` | 稳定；**自动支持 `prefers-reduced-motion`** | 普通 `<script>` 站内跳转不重跑 → 用 `astro:page-load`；旧 `astro:transitions` 内部常量在 7 已移除 |
| 动态 OG | `@vercel/og` / `satori` 构建期生图，或静态 `public/og/*.png` | 无官方集成 | GitHub Pages 是纯静态，**不能**用按需 SSR 生成 OG；必须构建期出图 |
| 图片 | `astro:assets` 的 `<Image />`（sharp） | sharp **0.35.5** | Hexo 的 `post_asset_folder: false` + `/photos/*.jpg` 要迁到 `src/assets`（构建期优化）或 `public/`（不优化） |
| 评论 | giscus（保留现有 4 个 ID 配置） | 主题 `preferred_color_scheme` | 站点有手动主题切换时，需用 giscus 的 `postMessage` API 同步主题，否则评论框不跟随 |
| 字体 | `@fontsource/*` 自托管 + `font-display: swap` + 子集化 | 避免 Google Fonts 国内不可达 | 中文字体必须子集化/系统字体栈，否则 5–10 MB |

## 2.6 GitHub Pages 部署（官方推荐已变）

**任务卡里写的 `withastro/action@v3` 已过时**：官方部署文档当前示例是 **`withastro/action@v6`** + `actions/checkout@v7`，`node-version` 默认 **24**：

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
        # with:
        #   node-version: 24     # 默认 24，Astro 7 要求 >=22.23.4
        #   package-manager: pnpm@latest
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
来源：[Deploy to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)

- **base 判断**：本仓库是 **用户站**（`ff66ccff.github.io`）→ `site: 'https://ff66ccff.github.io'`，**`base` 用 `'/'`，不需要子路径**；只有项目站（`/repo-name/`）才配 `base: '/repo-name'` 并给所有内部链接加前缀。
- 现 `deploy.yml` 里的 `upload-pages-artifact`/`configure-pages` 都可以被 `withastro/action@v6` 取代。
- 迁移期可保留旧站点：新站先发到临时仓库验证，再切 `main`。

## 2.7 Hexo → Astro 迁移对照（本仓库专用）

| Hexo 现状 | Astro 7 对应 | 备注 |
|---|---|---|
| `permalink: ':year/:month/:day/:title/'` | `src/pages/[year]/[month]/[day]/[slug].astro` + `getStaticPaths` | **必须保留 URL**，否则外链/搜索引擎全断；`slug` 用 posts 文件名（含中文时保留原文） |
| front-matter `title/date/updated/categories/tags` | schema `title/date/updated/categories/tags` | `z.coerce.date()` 兼容 `"2025-11-09T23:25:04+08:00"` |
| `source/_posts/*.md`（8 篇） | `src/content/blog/*.md` | 首行 `# 标题` 与 front-matter 重复，可去掉 |
| `source/hitokoto/sentences.md` | `src/data/hitokoto.json` | 见 §1.4.1 |
| `source/js/custom.js`（fancybox 懒加载） | `@fancyapps/ui` + `client:idle`，或原生 `<dialog>` 灯箱 | 不必再手写动态 `<script>` 注入 |
| `source/css/custom.css` | `src/styles/global.css` | 终端风 overlay 样式可直接复用 |
| `_config.yml` 的 giscus 4 个 ID | 组件 props | 照搬 |
| `hexo-generator-feed`（atom.xml） | `@astrojs/rss` → `/rss.xml` | 旧 `/atom.xml` 建议 301 |
| `.nojekyll` | 不需要 | Pages 用 artifact 部署不再走 Jekyll |

## 2.8 迁移坑清单（按踩坑概率排序）

1. **Rust 编译器严格校验 HTML**：旧模板里未闭合标签、`<p>` 内放块级元素 → 构建直接失败。
2. **Sätteri 默认**：照抄老教程装 `remark-gfm`/`rehype-slug` 会发现“没生效/重复 id”；要用必须切 `unified()`。
3. **`compressHTML: 'jsx'`**：中英混排处 `{" "}` 可能缺失 → 目检一遍文章页。
4. **ClientRouter 下脚本不重跑**：所有交互（打字机、giscus、暗色模式、TOC 滚动）都要挂 `astro:page-load`。
5. **URL 兼容**：`trailingSlash` 与旧 Hexo 链接（带尾斜杠）不一致会造成 404，建议 `trailingSlash: 'ignore'` + 一次性 sitemap 对比。
6. **Node 版本**：CI 从 20 升到 22/24（`engines` 硬要求 `>=22.23.4`）。
7. **字体/首屏**：Volantis 的 CDN 字体链（UbuntuMono 等）迁到 `@fontsource` 自托管，避免国内 CDN 失效。

---

# 3. 现代个人博客设计清单（2026，短版）

结合作者 `ToDO.md` 的既有意图（SEO、OG、#FF66CC 品牌色、字体、Giscus）整理：

**性能预算（移动端 Lighthouse 目标 ≥95）**
- [ ] 首屏 JS ≤ 30 KiB gzip；字体 ≤ 2 个字重、子集化、`font-display: swap`
- [ ] 首屏 LCP 元素是文本或静态图，禁止「Loading...→ JS 填充」
- [ ] 第三方脚本（giscus、统计）全部 `client:visible` 或交互后加载
- [ ] 图片用 `astro:assets` 出 `avif/webp` + `width/height` 防 CLS

**排版与品牌**
- [ ] 强调色统一 `#FF66CC`（链接 hover、`::selection`、代码块左边框、导航下 2px 线）
- [ ] 正文系统字体栈（`PingFang SC`/`Microsoft YaHei`），代码用 `JetBrains Mono`/`Fira Code`（自托管子集）
- [ ] 中文行高 1.75–1.8，段距 ≥ 1em，正文宽度 38–46 个汉字

**暗色与无障碍**
- [ ] `html[data-theme]` + `<head>` 内联防闪脚本；`prefers-color-scheme` 作默认
- [ ] 对比度 ≥ 4.5:1；焦点可见（`:focus-visible` 2px）
- [ ] 所有动画支持 `prefers-reduced-motion`（打字机、滚动揭示、View Transitions）
- [ ] 语义结构：每页唯一 `h1`、`<main>`、跳转链接、图片 `alt`

**可发现性**
- [ ] OG/Twitter Card（1200×630，构建期生成，`og:image` 绝对 URL）
- [ ] `@astrojs/rss` → `/rss.xml`，并在 `<head>` 加 `<link rel="alternate" type="application/rss+xml">`
- [ ] `@astrojs/sitemap` + `robots.txt` 指向 sitemap
- [ ] JSON-LD：`BlogPosting` + `Person`（Volantis 有，Astro 要自己补）
- [ ] 旧 Hexo URL 全部 301/保留

**交互与社区**
- [ ] giscus 保留现有 4 个 ID，主题跟随 `data-theme`（postMessage）
- [ ] 一言：首句静态、点击才打字（本文 §1.4）
- [ ] 404 页带回首页/搜索入口；RSS 页脚可见

---

# 附录 A：实测命令与原始数据

```powershell
# 1) 版本 / 发布日期 / 许可证 / 未压缩体积
foreach ($p in @('typed.js','typeit','typewriter-effect','gsap','animejs','motion','t-writer.js','astro')) {
  npm view $p version license time.modified dist.unpackedSize --json
}
# 实测输出（2026-11-06）：
# typed.js          3.0.0    GPL-3.0   2026-01-24   200,238 B / 10 files
# typeit            8.8.7    GPL-3.0   2024-10-25    95,104 B / 95 files
# typewriter-effect 3.3.0    MIT       2026-10-22   374,336 B / 11 files
# gsap              3.15.1   免费许可   2026-11-05 6,274,260 B / 179 files
# animejs           4.5.0    MIT       2026-11-02 2,126,307 B / 215 files
# motion            14.9.1   MIT       2026-11-04   939,855 B / 44 files
# astro             7.4.7    MIT       2026-11-05   engines.node >= 22.23.4

# 2) gzip 体积（下载 dist 文件后本地 zlib level 9 实测）
# gsap.min.js            73,357 B → 28,511 B (27.84 KiB)
# gsap/TextPlugin.min.js 10,570 B →  3,579 B ( 3.50 KiB)
# gsap/SplitText.min.js   7,955 B →  3,638 B ( 3.55 KiB)
# typewriter-effect/core 20,846 B →  6,052 B ( 5.91 KiB)
# typed.js/typed.umd.js  10,646 B →  3,254 B ( 3.18 KiB)
# typeit/index.umd.js    11,872 B →  4,647 B ( 4.54 KiB)
# 自研 hitokoto.js        1,438 B →    709 B ( 0.69 KiB)
# 本地 sentences JSON    37,162 B → 18,937 B (18.49 KiB)

# 3) 交叉核对（bundlephobia API）
# https://bundlephobia.com/api/size?package=typed.js@3.0.0          → 10,551 B / gzip 3,198 B
# https://bundlephobia.com/api/size?package=typeit@8.8.7            → 11,656 B / gzip 4,522 B
# https://bundlephobia.com/api/size?package=typewriter-effect@3.3.0 → 22,599 B / gzip 6,693 B
# https://bundlephobia.com/api/size?package=gsap@3.15.1             → 70,628 B / gzip 27,434 B
# https://bundlephobia.com/api/size?package=animejs@4.5.0           → 117,314 B / gzip 40,512 B
# https://bundlephobia.com/api/size?package=motion@14.9.1           → 175,791 B / gzip 59,256 B

# 4) GitHub 维护状态（shields.io 徽章数据）
# typed.js       stars 16k    last commit 2026-01
# typeit         stars 3.2k   last commit 2025-01
# typewriterjs   stars 2.7k   last commit 2026-10
# GSAP           stars 30k    last commit 2026-11
# anime.js       stars 74k    last commit 2026-08
# motion         stars 35k    last commit 2026-11
# t-writer.js    stars 509    last commit 2018-10

# 5) 逐字实现方式（dist 源码静态检查）
# typed.js: 含 substr/substring + .length 推进；无 Array.from / Intl.Segmenter → UTF-16 切分
# typeit:   含 Array.from → 码点级
# typewriter-effect: 含 Intl.Segmenter / useGraphemeSplitter / stringSplitter → 字素级（默认关）
# 三者均无 matchMedia / prefers-reduced-motion 处理

# 6) 一言 API 实测
Invoke-WebRequest "https://v1.hitokoto.cn/?c=k&encode=json" | % Headers
# → Access-Control-Allow-Origin: * / Content-Type: application/json; charset=utf-8 / Server: cloudflare
```

**本仓库现状数据**：`source/hitokoto/sentences.md` 715 行、**710 条**（706 条含中文），平均 **16.6 字**、最长 **68 字**，文件 37,983 B；55ms/字 → 平均 0.91 s、最长 3.74 s。

---

# 附录 B：来源

**打字机**
- typewriter-effect：<https://www.npmjs.com/package/typewriter-effect> · <https://github.com/tameemsafi/typewriterjs> · <https://unpkg.com/typewriter-effect@3.3.0/README.md>
- TypeIt：<https://www.npmjs.com/package/typeit> · <https://github.com/alexmacarthur/typeit> · <https://typeitjs.com>
- Typed.js：<https://www.npmjs.com/package/typed.js> · <https://github.com/mattboldt/typed.js>
- GSAP：<https://www.npmjs.com/package/gsap> · <https://gsap.com/standard-license> · <https://github.com/greensock/GSAP>
- anime.js：<https://www.npmjs.com/package/animejs> · <https://github.com/juliangarnier/anime>
- Motion：<https://www.npmjs.com/package/motion> · <https://motion.dev> · <https://github.com/motiondivision/motion>
- Web Components：<https://www.npmjs.com/package/lit-typewriter> · <https://www.npmjs.com/package/@webcomponent/typewriter> · <https://www.npmjs.com/package/astro-typewriter>
- Intl.Segmenter：<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter>
- prefers-reduced-motion：<https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
- bundlephobia：<https://bundlephobia.com/>

**一言**
- 接口文档：<https://developer.hitokoto.cn/sentence/>
- 语句库（AGPL + CDN 豁免）：<https://sentences-bundle.hitokoto.cn/>
- 后端开源：<https://github.com/hitokoto-osc/hitokoto-api>

**Astro**
- 升级 v7：<https://docs.astro.build/en/guides/upgrade-to/v7/>
- 内容集合：<https://docs.astro.build/en/guides/content-collections/>
- astro:content：<https://docs.astro.build/en/reference/modules/astro-content/>
- Markdown / Shiki：<https://docs.astro.build/en/guides/markdown-content/> · <https://docs.astro.build/en/guides/syntax-highlighting/>
- RSS / Sitemap：<https://docs.astro.build/en/guides/rss/> · <https://docs.astro.build/en/guides/integrations-guide/sitemap/>
- View Transitions：<https://docs.astro.build/en/guides/view-transitions/>
- 路由/分页：<https://docs.astro.build/en/guides/routing/>
- GitHub Pages：<https://docs.astro.build/en/guides/deploy/github/>
- v5 升级（content layer 起点）：<https://docs.astro.build/en/guides/upgrade-to/v5/>
