import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick, h } from 'vue'
import { useRoute } from 'vitepress'
import mediumZoom from './medium-zoom.js'
import Hitokoto from './components/Hitokoto.vue'
import './style.css'

export default {
    extends: DefaultTheme,
    Layout() {
        return h(DefaultTheme.Layout, null, {
            'home-hero-info-after': () => h(Hitokoto)
        })
    },
    enhanceApp({ app }) {
        app.component('Hitokoto', Hitokoto)
    },
    setup() {
        const route = useRoute()
        const initZoom = () => {
            // @ts-ignore
            mediumZoom('.main img', { background: 'var(--vp-c-bg)' })
        }
        onMounted(() => {
            initZoom()
        })
        watch(
            () => route.path,
            () => nextTick(() => initZoom())
        )
    }
}
