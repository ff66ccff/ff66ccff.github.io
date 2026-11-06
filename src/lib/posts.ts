import { getCollection, type CollectionEntry } from 'astro:content';
import { dateParts, slugifyTerm } from './format';

export type Post = CollectionEntry<'posts'>;

/** 已发布文章，按日期倒序。 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id),
  );
}

/** 与 Hexo 完全一致的永久链接：/2025/11/09/welcome-to-the-blog/ */
export function postPath(post: Post): string {
  const { year, month, day } = dateParts(post.data.date);
  return `/${year}/${month}/${day}/${post.id}/`;
}

export interface TermCount {
  name: string;
  slug: string;
  count: number;
}

/** 汇总分类或标签，按文章数降序、名称升序。 */
export function collectTerms(posts: Post[], key: 'categories' | 'tags'): TermCount[] {
  const map = new Map<string, TermCount>();
  for (const post of posts) {
    for (const name of post.data[key] ?? []) {
      const slug = slugifyTerm(name);
      if (!slug) continue;
      const current = map.get(slug);
      if (current) current.count += 1;
      else map.set(slug, { name, slug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function postsWithTerm(posts: Post[], key: 'categories' | 'tags', slug: string): Post[] {
  return posts.filter((post) => (post.data[key] ?? []).some((name) => slugifyTerm(name) === slug));
}

export interface YearGroup {
  year: string;
  posts: Post[];
}

export function groupByYear(posts: Post[]): YearGroup[] {
  const map = new Map<string, Post[]>();
  for (const post of posts) {
    const { year } = dateParts(post.data.date);
    const list = map.get(year);
    if (list) list.push(post);
    else map.set(year, [post]);
  }
  return [...map.entries()]
    .map(([year, list]) => ({ year, posts: list }))
    .sort((a, b) => Number(b.year) - Number(a.year));
}

export interface AdjacentPosts {
  prev: Post | null;
  next: Post | null;
}

/** posts 需要按日期倒序传入。prev 为更早一篇，next 为更新一篇。 */
export function getAdjacentPosts(posts: Post[], post: Post): AdjacentPosts {
  const index = posts.findIndex((item) => item.id === post.id);
  return {
    prev: index >= 0 && index < posts.length - 1 ? posts[index + 1] ?? null : null,
    next: index > 0 ? posts[index - 1] ?? null : null,
  };
}

/** 同分类优先、标签重合次之的简单相关阅读。 */
export function getRelatedPosts(posts: Post[], post: Post, limit = 3): Post[] {
  const categories = new Set(post.data.categories ?? []);
  const tags = new Set(post.data.tags ?? []);
  const scored = posts
    .filter((item) => item.id !== post.id)
    .map((item) => {
      let score = 0;
      for (const category of item.data.categories ?? []) if (categories.has(category)) score += 3;
      for (const tag of item.data.tags ?? []) if (tags.has(tag)) score += 2;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.item.data.date.valueOf() - a.item.data.date.valueOf());
  return scored.slice(0, limit).map(({ item }) => item);
}
