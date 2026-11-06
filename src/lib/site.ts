import profileJson from '../data/profile.json';
import friendsJson from '../data/friends.json';
import { SITE } from '../consts';

export interface SocialLink {
  label: string;
  icon: string;
  url: string;
}

export interface CommentsConfig {
  repo: string;
  'repo-id': string;
  category: string;
  'category-id': string;
  mapping: string;
  theme: string;
  lang: string;
}

export interface SiteProfile {
  name: string;
  avatar: string;
  url: string;
  title: string;
  subtitle: string;
  description: string;
  language: string;
  siteUrl: string;
  social: SocialLink[];
  comments: CommentsConfig;
}

export interface FriendItem {
  title: string;
  url: string;
  avatar: string;
  description: string;
  keywords?: string[];
  color?: string;
}

export interface FriendGroup {
  group: string;
  description?: string;
  items: FriendItem[];
}

export const profile = profileJson as SiteProfile;
export const friends = friendsJson as FriendGroup[];

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const nav: NavItem[] = [
  { label: '博客', href: '/', icon: 'home' },
  { label: '归档', href: '/archives/', icon: 'archive' },
  { label: '分类', href: '/categories/', icon: 'folder' },
  { label: '标签', href: '/tags/', icon: 'tag' },
  { label: '友链', href: '/friends/', icon: 'link' },
  { label: '关于', href: '/about/', icon: 'user' },
];

export const site = {
  ...SITE,
  profile,
  friends,
};

/** 社交链接里的相对地址（如 /atom.xml）转成绝对地址。 */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}
