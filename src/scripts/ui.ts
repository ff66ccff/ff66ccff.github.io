/**
 * 全站交互：主题、滚动进度、回顶、图片灯箱、代码复制、目录高亮、控制台彩蛋。
 * 兼容 <ClientRouter />：所有页面级初始化都监听 astro:page-load，并做幂等处理。
 */

type Theme = 'light' | 'dark';

const root = document.documentElement;

/* ------------------------------------------------------------------ *
 * Theme
 * ------------------------------------------------------------------ */
function currentTheme(): Theme {
  return root.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* ignore private mode */
  }
  // 派发在 document 上：giscus / mermaid 等组件监听的是 document
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;
  const toggle = target?.closest('[data-theme-toggle]');
  if (!toggle) return;
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
});

// 跟随系统主题变化（仅在用户未手动选择时）
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  try {
    if (localStorage.getItem('theme')) return;
  } catch {
    /* ignore */
  }
  root.dataset.theme = event.matches ? 'dark' : 'light';
});

/* ------------------------------------------------------------------ *
 * Scroll driven effects: header shadow, reading progress, back-to-top
 * ------------------------------------------------------------------ */
let scrollTicking = false;

function updateScrollEffects() {
  scrollTicking = false;

  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);

  const progress = document.querySelector<HTMLElement>('[data-progress]');
  if (progress) {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
  }

  const backToTop = document.querySelector<HTMLElement>('[data-back-to-top]');
  if (backToTop) backToTop.classList.toggle('is-visible', window.scrollY > 480);
}

window.addEventListener(
  'scroll',
  () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollEffects);
  },
  { passive: true },
);

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;
  if (!target?.closest('[data-back-to-top]')) return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ------------------------------------------------------------------ *
 * Image lightbox
 * ------------------------------------------------------------------ */
function openLightbox(img: HTMLImageElement) {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  const preview = dialog?.querySelector<HTMLImageElement>('[data-lightbox-img]');
  if (!dialog || !preview) return;
  preview.src = img.currentSrc || img.src;
  preview.alt = img.alt || '';
  if (!dialog.open) dialog.showModal();
}

document.addEventListener('click', (event) => {
  const target = event.target as Element | null;

  const dialog = target?.closest('[data-lightbox]');
  if (dialog) {
    if (target?.closest('[data-lightbox-close]') || target === dialog) {
      (dialog as HTMLDialogElement).close();
    }
    return;
  }

  const img = target?.closest<HTMLImageElement>('.prose img');
  if (!img || img.closest('a')) return;
  event.preventDefault();
  openLightbox(img);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox][open]');
  if (dialog) dialog.close();
});

/* ------------------------------------------------------------------ *
 * Copy buttons for code blocks
 * ------------------------------------------------------------------ */
function setupCopyButtons() {
  document.querySelectorAll<HTMLElement>('.prose pre').forEach((pre) => {
    if (pre.dataset.copyReady === 'true') return;
    pre.dataset.copyReady = 'true';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制代码');
    button.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = '已复制';
        button.classList.add('is-copied');
      } catch {
        button.textContent = '复制失败';
      }
      window.setTimeout(() => {
        button.textContent = '复制';
        button.classList.remove('is-copied');
      }, 1600);
    });
    pre.appendChild(button);
  });
}

/* ------------------------------------------------------------------ *
 * TOC scroll spy
 * ------------------------------------------------------------------ */
let tocObserver: IntersectionObserver | null = null;

function setupToc() {
  tocObserver?.disconnect();
  tocObserver = null;

  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc-link')];
  if (!links.length) return;

  const linkById = new Map<string, HTMLAnchorElement>();
  for (const link of links) {
    const raw = (link.getAttribute('href') ?? '').replace(/^#/, '');
    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch {
      /* 保留原始值 */
    }
    if (id) linkById.set(id, link);
  }

  const headings = [...document.querySelectorAll<HTMLElement>('.prose h2[id], .prose h3[id]')].filter(
    (heading) => linkById.has(heading.id),
  );
  if (!headings.length) return;

  const setActive = (id: string) => {
    for (const link of links) link.classList.remove('is-active');
    const active = linkById.get(id);
    active?.classList.add('is-active');
    if (active) {
      const list = active.closest('.toc-list');
      const linkRect = active.getBoundingClientRect();
      const listRect = list?.getBoundingClientRect();
      if (list && listRect && (linkRect.top < listRect.top || linkRect.bottom > listRect.bottom)) {
        active.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  tocObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    },
    { rootMargin: '-18% 0px -68% 0px', threshold: 0 },
  );

  headings.forEach((heading) => tocObserver?.observe(heading));

  // 页面顶部时高亮第一个标题
  if (window.scrollY < 200) setActive(headings[0]!.id);
}

/* ------------------------------------------------------------------ *
 * Heading anchors (progressive enhancement)
 * ------------------------------------------------------------------ */
function setupHeadingAnchors() {
  document.querySelectorAll<HTMLElement>('.prose h2[id], .prose h3[id]').forEach((heading) => {
    if (heading.dataset.anchorReady === 'true') return;
    heading.dataset.anchorReady = 'true';
    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = `#${heading.id}`;
    anchor.setAttribute('aria-label', `永久链接：${heading.textContent ?? ''}`);
    anchor.textContent = '#';
    heading.append(anchor);
  });
}

/* ------------------------------------------------------------------ *
 * Page lifecycle
 * ------------------------------------------------------------------ */
function onPageLoad() {
  setupCopyButtons();
  setupHeadingAnchors();
  setupToc();
  updateScrollEffects();
}

document.addEventListener('astro:page-load', onPageLoad);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onPageLoad);
} else {
  onPageLoad();
}

/* ------------------------------------------------------------------ *
 * Console easter egg
 * ------------------------------------------------------------------ */
const egg =
  '%c ff66ccff %c 你好，开发者。\n 这个站点用 Astro 重构，源码在 github.com/ff66ccff/ff66ccff.github.io ';
console.log(egg, 'background:#ff66ccff;color:#fff;padding:4px 8px;border-radius:4px;font-weight:700', 'background:#14121d;color:#ece8f2;padding:4px 8px;border-radius:4px');

export {};
