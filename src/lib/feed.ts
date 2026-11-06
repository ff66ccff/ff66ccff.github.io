import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { SITE } from '../consts';
import { postPath, type Post } from './posts';
import { excerpt } from './format';

const parser = new MarkdownIt({ html: true, linkify: true, typographer: false });

/** 把站内相对链接转成绝对链接，RSS 阅读器里才不会断链。 */
function absolutize(html: string): string {
  return html
    .replace(/(src|href)="\/(?!\/)/g, `$1="${SITE.url}/`)
    .replace(/(src|href)='\/(?!\/)/g, `$1='${SITE.url}/`);
}

export function renderFeedHtml(post: Post): string {
  // 正文开头的一级标题与文章标题重复，RSS 里同样去掉
  const body = (post.body ?? '').replace(/^\s*#\s+[^\n]*(?:\r?\n)+/, '');
  const raw = parser.render(body);
  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption', 'iframe']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'title'],
      '*': ['class', 'id', 'style'],
    },
    allowedIframeHostnames: ['music.163.com'],
  });
  return absolutize(clean);
}

export interface FeedItem {
  title: string;
  pubDate: Date;
  description: string;
  link: string;
  content: string;
  categories: string[];
}

export function buildFeedItems(posts: Post[]): FeedItem[] {
  return posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: post.data.description ?? excerpt(post.body ?? '', 160),
    link: postPath(post),
    content: renderFeedHtml(post),
    categories: [...(post.data.categories ?? []), ...(post.data.tags ?? [])],
  }));
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
