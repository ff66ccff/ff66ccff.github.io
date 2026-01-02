import { defineConfig } from 'vitepress'

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
            '/posts/': [
                {
                    text: '编程',
                    collapsed: false,
                    items: [
                        { text: 'Welcome to the Blog', link: '/posts/coding/welcome-to-the-blog' }
                    ]
                },
                {
                    text: '生活',
                    collapsed: false,
                    items: [
                        { text: '游戏本的痛', link: '/posts/life/游戏本的痛' },
                        { text: '累', link: '/posts/life/累' },
                        { text: '记得向尘世之外瞥一眼', link: '/posts/life/记得向尘世之外瞥一眼' },
                        { text: '辞旧迎新之时', link: '/posts/life/辞旧迎新之时-bgm' }
                    ]
                }
            ]
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
