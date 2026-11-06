import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/posts';
import { buildFeedItems, escapeXml } from '../lib/feed';
import { SITE } from '../consts';

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL(SITE.url)).toString().replace(/\/$/, '');
  const posts = await getPublishedPosts();
  const items = buildFeedItems(posts);
  const updated = posts[0]?.data.date ?? new Date();

  const entries = items
    .map((item) => {
      const url = `${base}${item.link}`;
      return [
        '  <entry>',
        `    <title>${escapeXml(item.title)}</title>`,
        `    <link rel="alternate" type="text/html" href="${escapeXml(url)}"/>`,
        `    <id>${escapeXml(url)}</id>`,
        `    <published>${item.pubDate.toISOString()}</published>`,
        `    <updated>${item.pubDate.toISOString()}</updated>`,
        ...item.categories.map((category) => `    <category term="${escapeXml(category)}"/>`),
        `    <summary>${escapeXml(item.description)}</summary>`,
        `    <content type="html">${escapeXml(item.content)}</content>`,
        '  </entry>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="zh-CN">',
    `  <title>${escapeXml(SITE.title)}</title>`,
    `  <subtitle>${escapeXml(SITE.tagline)}</subtitle>`,
    `  <link rel="alternate" type="text/html" href="${escapeXml(base)}/"/>`,
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(base)}/atom.xml"/>`,
    `  <id>${escapeXml(base)}/</id>`,
    `  <updated>${updated.toISOString()}</updated>`,
    `  <author><name>${escapeXml(SITE.author)}</name><uri>${escapeXml(base)}/</uri></author>`,
    `  <icon>${escapeXml(base)}/favicon.svg</icon>`,
    `  <logo>${escapeXml(base)}/avatar.jpg</logo>`,
    entries,
    '</feed>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
