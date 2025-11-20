<script setup>
import { ref, onMounted } from 'vue'

const typingSvgUrl = ref('')

const sentences = [
  "Talk is cheap, show me the code.",
  "Attention is all you need.",
  "给岁月以文明，而不是给文明以岁月。",
  "没关系的，都一样。",
  "长风长风飘在山海间，白鸟白鸟展翅入苍天。",
  "列车抵达陌生的站台，陌路人各自离开。"
]

onMounted(() => {
  // 随机选择一个起始索引
  const startIndex = Math.floor(Math.random() * sentences.length)
  // 重新排列数组，实现从随机位置开始循环
  const reorderedSentences = [
    ...sentences.slice(startIndex),
    ...sentences.slice(0, startIndex)
  ]
  // 构建 URL 参数
  const linesParam = reorderedSentences.map(s => encodeURIComponent(s)).join(';')
  typingSvgUrl.value = `https://readme-typing-svg.demolab.com/?font=Noto+Sans+SC&weight=600&size=22&pause=2000&color=66CCFF&center=true&vCenter=true&width=600&lines=${linesParam}`
})
</script>

<template>
  <div class="typing-container">
    <a href="https://git.io/typing-svg">
      <img v-if="typingSvgUrl" :src="typingSvgUrl" alt="Typing SVG" />
    </a>
  </div>
</template>

<style scoped>
.typing-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  min-height: 60px;
}

.typing-container img {
  max-width: 100%;
  height: auto;
}
</style>
