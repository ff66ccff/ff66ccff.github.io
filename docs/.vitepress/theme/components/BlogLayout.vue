<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import GiscusComment from './GiscusComment.vue'

const { frontmatter } = useData()

// 检查当前页面是否是文章页面（在 /posts/ 目录下且不是列表页）
const isPostPage = () => {
    const path = window.location.pathname
    return path.includes('/posts/') && !path.endsWith('/posts/')
}
</script>

<template>
    <DefaultTheme.Layout>
        <template #doc-after>
            <GiscusComment />
        </template>
    </DefaultTheme.Layout>
</template>
