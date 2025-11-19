import { createContentLoader } from 'vitepress'

interface Post {
    title: string
    url: string
    date: {
        time: number
        string: string
    }
    excerpt: string | undefined
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/**/*.md', {
    excerpt: true,
    transform(raw): Post[] {
        return raw
            .filter(({ frontmatter }) => frontmatter.published) // 仅处理包含发布日期的文章
            .map(({ url, frontmatter, excerpt }) => ({
                title: frontmatter.title,
                url,
                excerpt,
                date: formatDate(frontmatter.published)
            }))
            .sort((a, b) => b.date.time - a.date.time)
    }
})function formatDate(raw: string): Post['date'] {
    const date = new Date(raw)
    date.setUTCHours(12)
    return {
        time: +date,
        string: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }
}
