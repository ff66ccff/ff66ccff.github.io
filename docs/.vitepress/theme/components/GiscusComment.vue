<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useData, useRoute } from 'vitepress'

// Giscus 配置
const GISCUS_CONFIG = {
    repo: 'ff66ccff/ff66ccff.github.io',
    repoId: 'R_kgDOQRU2HQ',
    category: 'Announcements',
    categoryId: 'DIC_kwDOQRU2Hc4C0foj',
    mapping: 'pathname',
    strict: '0',
    reactionsEnabled: '1',
    emitMetadata: '0',
    inputPosition: 'bottom',
    lang: 'zh-CN'
}

const { isDark, frontmatter } = useData()
const route = useRoute()

// 检查是否应该显示评论（可以在 frontmatter 中设置 comments: false 来禁用）
const showComments = computed(() => {
    return frontmatter.value.comments !== false
})

// 根据当前主题计算 Giscus 主题
const giscusTheme = computed(() => {
    return isDark.value ? 'dark' : 'light'
})

const containerRef = ref<HTMLElement | null>(null)

// 加载/重新加载 Giscus
const loadGiscus = () => {
    if (!containerRef.value || !showComments.value) return

    // 清除已有的 giscus
    const existingScript = containerRef.value.querySelector('script.giscus-script')
    const existingWidget = containerRef.value.querySelector('.giscus')
    if (existingScript) existingScript.remove()
    if (existingWidget) existingWidget.remove()

    // 检查配置是否完整
    if (!GISCUS_CONFIG.repoId || !GISCUS_CONFIG.categoryId) {
        console.warn('[Giscus] 请先配置 repoId 和 categoryId')
        return
    }

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.className = 'giscus-script'
    script.setAttribute('data-repo', GISCUS_CONFIG.repo)
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId)
    script.setAttribute('data-category', GISCUS_CONFIG.category)
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId)
    script.setAttribute('data-mapping', GISCUS_CONFIG.mapping)
    script.setAttribute('data-strict', GISCUS_CONFIG.strict)
    script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled)
    script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata)
    script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition)
    script.setAttribute('data-theme', giscusTheme.value)
    script.setAttribute('data-lang', GISCUS_CONFIG.lang)
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    containerRef.value.appendChild(script)
}

// 发送消息更新主题
const updateTheme = () => {
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
            {
                giscus: {
                    setConfig: {
                        theme: giscusTheme.value
                    }
                }
            },
            'https://giscus.app'
        )
    }
}

onMounted(() => {
    loadGiscus()
})

// 监听主题变化
watch(isDark, () => {
    updateTheme()
})

// 监听路由变化，重新加载评论
watch(() => route.path, () => {
    // 延迟加载，确保页面内容已更新
    setTimeout(() => {
        loadGiscus()
    }, 100)
})
</script>

<template>
    <div v-if="showComments" class="giscus-container" ref="containerRef">
        <div class="giscus-title">
            <span class="giscus-icon">💬</span>
            <span>评论</span>
        </div>
        <div class="giscus-placeholder" v-if="!GISCUS_CONFIG.repoId || !GISCUS_CONFIG.categoryId">
            <p>⚠️ Giscus 配置不完整，请按照以下步骤完成配置：</p>
            <ol>
                <li>确保仓库是公开的</li>
                <li>安装 <a href="https://github.com/apps/giscus" target="_blank">Giscus App</a></li>
                <li>在仓库设置中启用 Discussions</li>
                <li>访问 <a href="https://giscus.app/" target="_blank">giscus.app</a> 获取配置信息</li>
                <li>在 <code>GiscusComment.vue</code> 中填入 repoId 和 categoryId</li>
            </ol>
        </div>
    </div>
</template>

<style scoped>
.giscus-container {
    margin-top: 48px;
    padding-top: 32px;
    border-top: 1px solid var(--vp-c-divider);
}

.giscus-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--vp-c-text-1);
    margin-bottom: 24px;
}

.giscus-icon {
    font-size: 1.5rem;
}

.giscus-placeholder {
    padding: 24px;
    background: var(--vp-c-bg-soft);
    border-radius: 12px;
    border: 1px solid var(--vp-c-divider);
}

.giscus-placeholder p {
    margin: 0 0 16px;
    color: var(--vp-c-text-2);
    font-weight: 500;
}

.giscus-placeholder ol {
    margin: 0;
    padding-left: 24px;
    color: var(--vp-c-text-2);
}

.giscus-placeholder li {
    margin: 8px 0;
    line-height: 1.6;
}

.giscus-placeholder a {
    color: var(--vp-c-brand-1);
    text-decoration: none;
}

.giscus-placeholder a:hover {
    text-decoration: underline;
}

.giscus-placeholder code {
    background: var(--vp-c-bg-mute);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
}

/* Giscus iframe 样式 */
:deep(.giscus) {
    max-width: 100%;
}

:deep(.giscus-frame) {
    width: 100%;
    border: none;
}
</style>
