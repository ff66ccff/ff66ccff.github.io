import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const POSTS_DIR = path.resolve(__dirname, '../posts')
const CATEGORY_LABEL: Record<string, string> = {
    coding: '编程',
    life: '生活'
}

function parseFrontmatter(filePath: string): { title?: string; published?: string } {
    const content = fs.readFileSync(filePath, 'utf-8')
    const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/)
    if (!match) return {}

    return match[1].split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
        const pair = line.match(/^(\w+):\s*(.*)$/)
        if (pair) {
            const [, key, raw] = pair
            acc[key] = raw.replace(/^"|"$/g, '')
        }
        return acc
    }, {})
}

function createSidebar() {
    if (!fs.existsSync(POSTS_DIR)) return []

    const categories = fs
        .readdirSync(POSTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)

    return categories
        .map((category) => {
            const dir = path.join(POSTS_DIR, category)
            const items = fs
                .readdirSync(dir)
                .filter((file) => file.endsWith('.md') && file !== 'index.md')
                .map((file) => {
                    const fullPath = path.join(dir, file)
                    const meta = parseFrontmatter(fullPath)
                    const text = meta.title || path.basename(file, '.md')
                    const published = meta.published ? new Date(meta.published).getTime() : 0
                    const link = `/posts/${category}/${file.replace(/\.md$/, '')}`
                    return { text, link, published }
                })
                .sort((a, b) => b.published - a.published)
                .map(({ text, link }) => ({ text, link }))

            return {
                text: CATEGORY_LABEL[category] || category,
                collapsed: false,
                items
            }
        })
        .filter((section) => section.items.length > 0)
}

const base = process.env.BASE && process.env.BASE !== '' ? process.env.BASE : '/'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base,
    title: "ff66ccff",
    description: "ID is Pink, but Soul is Blue (#66CCFF)",
    lang: 'zh-CN',
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

    base: process.env.BASE || '/',

    markdown: {
        breaks: true
    },

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/avatar.jpg',

        nav: [
            { text: '首页', link: '/' },
            { text: '博客', link: '/posts/' }
        ],

        sidebar: {
            '/posts/': createSidebar()
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/ff66ccff' }
        ],

        footer: {
            message: '基于 MIT 许可发布',
            copyright: 'Powered by VitePress | Made with ❤️ by ff66ccff'
        },

        docFooter: {
            prev: '上一篇',
            next: '下一篇'
        },

        outline: {
            label: '页面导航'
        },

        lastUpdated: {
            text: '最后更新于',
            formatOptions: {
                dateStyle: 'short',
                timeStyle: 'medium'
            }
        },

        langMenuLabel: '多语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',

        search: {
            provider: 'local',
            options: {
                locales: {
                    root: {
                        translations: {
                            button: {
                                buttonText: '搜索文档',
                                buttonAriaLabel: '搜索文档'
                            },
                            modal: {
                                noResultsText: '无法找到相关结果',
                                resetButtonTitle: '清除查询条件',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换',
                                    closeText: '关闭'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
})
