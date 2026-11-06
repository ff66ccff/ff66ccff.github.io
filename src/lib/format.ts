const SHANGHAI = 'Asia/Shanghai';

type DateParts = { year: string; month: string; day: string };

/** 按 Asia/Shanghai 时区拆出年月日，保证迁移前后日期不变。 */
export function dateParts(date: Date): DateParts {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHANGHAI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return { year: parts.year, month: parts.month, day: parts.day };
}

/** 2025-11-09 */
export function isoDate(date: Date): string {
  const { year, month, day } = dateParts(date);
  return `${year}-${month}-${day}`;
}

/** 2025 年 11 月 9 日 */
export function cnDate(date: Date): string {
  const { year, month, day } = dateParts(date);
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

/** 2025.11.09 —— 卡片 / 归档上的紧凑格式 */
export function compactDate(date: Date): string {
  const { year, month, day } = dateParts(date);
  return `${year}.${month}.${day}`;
}

/** 2025-11-09T23:25:04+08:00 */
export function isoDateTime(date: Date): string {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: SHANGHAI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const s = fmt.format(date).replace(' ', 'T');
  return `${s}+08:00`;
}

/** 相对时间：3 天前 / 2 个月前 */
export function relativeDate(date: Date, now = new Date()): string {
  const diff = now.getTime() - date.getTime();
  if (diff < 0) return isoDate(date);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))} 个月前`;
  return `${Math.floor(diff / (365 * day))} 年前`;
}

/** 按 README/Hexo 的 slug 规则处理分类与标签：C++ -> C，Vibe Coding -> Vibe-Coding。 */
export function slugifyTerm(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '');
}

/** 纯文本摘要：去掉 markdown 标记、HTML 标签与图片。 */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[>*_`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(markdown: string, length = 120): string {
  const text = toPlainText(markdown);
  return text.length <= length ? text : `${text.slice(0, length).trimEnd()}…`;
}

/** 中文按 350 字/分钟估算，英文按 200 词/分钟。 */
export function readingTime(markdown: string): number {
  const text = toPlainText(markdown);
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = text.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 350 + words / 200));
}
