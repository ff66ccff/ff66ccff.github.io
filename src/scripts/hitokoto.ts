/**
 * 一言打字机：成熟实现 typewriter-effect（MIT，gzip ≈5.9 KiB）
 * - 首屏由 Astro 在构建期静态渲染完整句子：SEO / 无 JS / RSS 均可读
 * - 用户点击「换一句」才加载 710 句数据（动态 import，约 19 KiB gzip）
 * - prefers-reduced-motion 下完全退化为纯文本切换
 * - 兼容 <ClientRouter />：由 astro:page-load 重新挂载
 */

type TypewriterLike = {
  stop(): TypewriterLike;
};

type TypewriterCtor = new (
  container: HTMLElement,
  options?: Record<string, unknown>,
) => TypewriterLike;

type QuoteModule = { default: string[] };
type TypewriterModule = { default: TypewriterCtor };

let quotesPromise: Promise<string[]> | null = null;
let ctorPromise: Promise<TypewriterCtor | null> | null = null;

function loadQuotes(): Promise<string[]> {
  quotesPromise ??= import('../data/quotes.json').then(
    (module) => (module as unknown as QuoteModule).default,
  );
  return quotesPromise;
}

function loadTypewriter(): Promise<TypewriterCtor | null> {
  ctorPromise ??= import('typewriter-effect/dist/core')
    .then((module) => (module as unknown as TypewriterModule).default)
    .catch(() => null);
  return ctorPromise;
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function pickNext(list: string[], current: string): string {
  if (list.length < 2) return list[0] ?? current;
  let next = current;
  for (let attempts = 0; attempts < 8 && next === current; attempts += 1) {
    next = list[Math.floor(Math.random() * list.length)] ?? current;
  }
  return next;
}

async function mount(root: HTMLElement) {
  if (root.dataset.hitokotoMounted === 'true') return;
  root.dataset.hitokotoMounted = 'true';

  const dynamic = root.querySelector<HTMLElement>('[data-hitokoto-dynamic]');
  const staticText = root.querySelector<HTMLElement>('[data-hitokoto-static]');
  const live = root.querySelector<HTMLElement>('[data-hitokoto-live]');
  const trigger = root.querySelector<HTMLElement>('[data-hitokoto-next]');
  if (!dynamic || !staticText || !trigger) return;

  const Typewriter = await loadTypewriter();
  if (!Typewriter) return;

  let current = (root.dataset.quote ?? staticText.textContent ?? '').trim();
  let typewriter: TypewriterLike | null = null;
  let busy = false;

  const announce = (text: string) => {
    current = text;
    root.dataset.quote = text;
    if (live) live.textContent = text;
  };

  const animateTo = (text: string) => {
    // 动画依赖 requestAnimationFrame：标签页不可见 / 降低动态效果时直接落字
    if (reduceMotion.matches || document.visibilityState === 'hidden') {
      typewriter?.stop();
      dynamic.textContent = '';
      staticText.textContent = text;
      staticText.hidden = false;
      dynamic.hidden = true;
      return;
    }
    typewriter?.stop();
    dynamic.replaceChildren();
    typewriter = new Typewriter(dynamic, {
      strings: [text],
      delay: 55,
      deleteSpeed: 18,
      cursor: '▍',
      loop: false,
      autoStart: true,
      skipAddStyles: true,
      useGraphemeSplitter: true,
    });
    staticText.hidden = true;
    dynamic.hidden = false;
  };

  const next = async () => {
    if (busy) return;
    busy = true;
    trigger.setAttribute('aria-busy', 'true');
    try {
      const list = await loadQuotes();
      if (!list.length) return;
      const upcoming = pickNext(list, current);
      announce(upcoming);
      animateTo(upcoming);
    } catch {
      /* 网络失败：保留当前句 */
    } finally {
      busy = false;
      trigger.removeAttribute('aria-busy');
    }
  };

  trigger.addEventListener('click', next);
  root.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (target?.closest('a, button')) return;
    void next();
  });
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if ((event.target as Element | null)?.closest('a, button')) return;
    event.preventDefault();
    void next();
  });

  // 首屏显示构建期静态整句，不做重放动画，避免 CLS
  if (reduceMotion.matches) {
    dynamic.hidden = true;
    return;
  }

  typewriter = new Typewriter(dynamic, {
    initialText: current,
    delay: 55,
    deleteSpeed: 18,
    cursor: '▍',
    loop: false,
    autoStart: false,
    skipAddStyles: true,
    useGraphemeSplitter: true,
  });
  staticText.hidden = true;
  dynamic.hidden = false;
}

export function mountAllHitokoto() {
  document.querySelectorAll<HTMLElement>('[data-hitokoto]').forEach((root) => {
    void mount(root);
  });
}
