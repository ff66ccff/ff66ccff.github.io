<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { data as sentencesData } from '../../../hitokoto/sentences.data'

// 使用导入的数据，如果为空则使用默认兜底
const sentences = sentencesData && sentencesData.length > 0 ? sentencesData : [
  "数据加载失败，请检查 sentences.md 文件",
  "Talk is cheap, show me the code.",
  "Attention is all you need.",
  "给岁月以文明，而不是给文明以岁月。",
  "没关系的，都一样。",
  "长风长风飘在山海间，白鸟白鸟展翅入苍天。",
  "列车抵达陌生的站台，陌路人各自离开。"
]

const currentText = ref('')
const currentIndex = ref(0)
const isTyping = ref(true)
let typeTimer = null
let nextTimer = null

// 打字速度（毫秒）
const typeSpeed = 100
// 打完一条后的停留时间（毫秒）
const pauseTime = 2000

const startTyping = () => {
  const targetText = sentences[currentIndex.value]
  currentText.value = ''
  isTyping.value = true
  let charIndex = 0

  clearInterval(typeTimer)
  clearTimeout(nextTimer)

  typeTimer = setInterval(() => {
    if (charIndex < targetText.length) {
      currentText.value += targetText[charIndex]
      charIndex++
    } else {
      finishTyping()
    }
  }, typeSpeed)
}

const finishTyping = () => {
  clearInterval(typeTimer)
  currentText.value = sentences[currentIndex.value]
  isTyping.value = false
  
  // 自动播放下一条
  nextTimer = setTimeout(() => {
    nextSentence()
  }, pauseTime)
}

const nextSentence = () => {
  clearTimeout(nextTimer)
  currentIndex.value = (currentIndex.value + 1) % sentences.length
  startTyping()
}

const handleClick = () => {
  if (isTyping.value) {
    // 如果正在打字，瞬间完成
    finishTyping()
  } else {
    // 如果已经完成，播放下一条
    nextSentence()
  }
}

onMounted(() => {
  // 随机开始
  currentIndex.value = Math.floor(Math.random() * sentences.length)
  startTyping()
})

onUnmounted(() => {
  clearInterval(typeTimer)
  clearTimeout(nextTimer)
})
</script>

<template>
  <div class="hitokoto-container" @click="handleClick">
    <div class="hitokoto-text">
      {{ currentText }}<span class="cursor" :class="{ 'typing': isTyping }">|</span>
    </div>
  </div>
</template>

<style scoped>
.hitokoto-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  min-height: 60px;
  cursor: pointer;
  user-select: none;
}

.hitokoto-text {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 600;
  font-size: 22px;
  color: #66CCFF;
  text-align: center;
  position: relative;
  line-height: 1.5;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  opacity: 1;
  font-weight: 100;
  animation: blink 1s step-end infinite;
}

.cursor.typing {
  animation: none;
  opacity: 1;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
