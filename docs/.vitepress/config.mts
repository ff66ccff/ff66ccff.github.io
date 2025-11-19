import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "FF66CC",
    description: "ID is Pink, but Soul is Blue (#66CCFF)",
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/avatar.png', // You'll need to move your avatar here later

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Blog', link: '/posts/' },
            { text: 'Projects', link: '/projects' },
            { text: 'About', link: '/about' }
        ],

        sidebar: {
            '/posts/': [
                {
                    text: 'Categories',
                    items: [
                        { text: 'Coding', link: '/posts/coding/' },
                        { text: 'Vocaloid', link: '/posts/vocaloid/' },
                        { text: 'Sci-Fi', link: '/posts/sci-fi/' },
                        { text: 'Life', link: '/posts/life/' }
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/ff66ccff' }
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Powered by VitePress | Made with ❤️ by ff66ccff'
        },

        search: {
            provider: 'local'
        }
    }
})
