import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/posts';
import { buildFeedItems } from '../lib/feed';
import { SITE } from '../consts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  const items = buildFeedItems(posts);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: true,
    customData: '<language>zh-CN</language>',
    items: items.map((item) => ({
      title: item.title,
      pubDate: item.pubDate,
      description: item.description,
      link: item.link,
      content: item.content,
      categories: item.categories,
    })),
  });
}
