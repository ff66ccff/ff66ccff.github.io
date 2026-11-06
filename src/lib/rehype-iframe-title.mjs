/**
 * 文章里的 <iframe>（如网易云音乐播放器）来自 Markdown 原始 HTML。
 * 为缺少 title 的 iframe 补一个可访问名称（WCAG 4.1.2）；
 * 同时为 alt 为空的图片补上基于文件名的替代文本。
 *
 * 注意：在 remark-rehype 之后、rehype-raw 之前，原始 HTML 可能还是 raw/html 节点，
 * 因此这里同时处理 element 与 raw 文本节点。
 */
const FALLBACK_TITLE = '嵌入内容';

function imageAlt(src) {
  try {
    const name = decodeURIComponent(String(src).split('/').pop() ?? '')
      .replace(/\.[a-z0-9]+$/i, '')
      .trim();
    return name || '配图';
  } catch {
    return '配图';
  }
}

export default function rehypeIframeTitle() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'element' && node.tagName === 'iframe') {
        node.properties = { ...(node.properties ?? {}) };
        if (!node.properties.title) node.properties.title = FALLBACK_TITLE;
      }

      if (node.type === 'element' && node.tagName === 'img') {
        node.properties = { ...(node.properties ?? {}) };
        const alt = node.properties.alt;
        if (typeof alt !== 'string' || !alt.trim()) {
          node.properties.alt = imageAlt(node.properties.src ?? '');
        }
      }

      if ((node.type === 'raw' || node.type === 'html') && typeof node.value === 'string') {
        if (node.value.includes('<iframe')) {
          node.value = node.value.replace(
            /<iframe\b(?![^>]*\btitle=)/gi,
            `<iframe title="${FALLBACK_TITLE}"`,
          );
        }
      }

      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
  };
}
