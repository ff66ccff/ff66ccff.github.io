<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { data as sentencesData } from '../../../hitokoto/sentences.data'

// 默认兜底数据
const defaultSentences = [
  "Talk is cheap, show me the code.",
  "Attention is all you need.",
  "给岁月以文明，而不是给文明以岁月。",
  "没关系的，都一样。",
  "长风长风飘在山海间，白鸟白鸟展翅入苍天。",
  "列车抵达陌生的站台，陌路人各自离开。"
]

// 确保数据存在
const rawSentences = sentencesData && sentencesData.length > 0 ? sentencesData : defaultSentences

// 播放列表状态
const playList = ref([])
const currentIndex = ref(-1)

// 文本显示状态
const displayContent = ref('')
const isTyping = ref(false)
const isWaiting = ref(false)

// 定时器
let typeTimer = null
let waitTimer = null

// 配置
const TYPE_SPEED = 100 // 打字速度 ms
const WAIT_TIME = 3000 // 停留时间 ms

// 洗牌算法：保证所有句子播放一遍前不重复
const shuffle = (array) => {
  const newArr = [...array]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr
}

// 初始化播放列表
const initPlayList = () => {
  playList.value = shuffle(rawSentences)
  currentIndex.value = -1
}

// 获取下一条句子
const getNextSentence = () => {
  currentIndex.value++
  // 如果播放完了，重新洗牌
  if (currentIndex.value >= playList.value.length) {
    initPlayList()
    currentIndex.value = 0
  }
  return playList.value[currentIndex.value]
}

// 开始打字
const startTyping = () => {
  const text = getNextSentence()
  displayContent.value = ''
  isTyping.value = true
  isWaiting.value = false
  
  let charIndex = 0
  
  clearInterval(typeTimer)
  clearTimeout(waitTimer)
  
  typeTimer = setInterval(() => {
    if (charIndex < text.length) {
      displayContent.value += text[charIndex]
      charIndex++
    } else {
      finishTyping()
    }
  }, TYPE_SPEED)
}

// 完成打字
const finishTyping = () => {
  clearInterval(typeTimer)
  // 确保显示完整句子
  if (currentIndex.value >= 0 && currentIndex.value < playList.value.length) {
      displayContent.value = playList.value[currentIndex.value]
  }
  
  isTyping.value = false
  isWaiting.value = true
  
  // 等待一段时间后播放下一条
  waitTimer = setTimeout(() => {
    startTyping()
  }, WAIT_TIME)
}

// 点击交互
const handleClick = () => {
  if (isTyping.value) {
    // 如果正在打字，瞬间完成
    finishTyping()
  } else {
    // 如果正在等待，立即播放下一条
    startTyping()
  }
}

onMounted(() => {
  initPlayList()
  startTyping()
})

onUnmounted(() => {
  clearInterval(typeTimer)
  clearTimeout(waitTimer)
})
</script>

<template>
  <div class="hitokoto-wrapper" @click="handleClick">
    <div class="hitokoto-content">
      <span class="quote-mark left">“</span>
      <span class="text">{{ displayContent }}</span>
      <span class="cursor" :class="{ typing: isTyping }">|</span>
      <span class="quote-mark right">”</span>
    </div>
  </div>
</template>

<style scoped>
.hitokoto-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  margin: 30px 0;
  padding: 20px 40px;
  cursor: pointer;
  user-select: none;
  /* 增加一个微妙的背景，提升高级感 */
  background: linear-gradient(to right, rgba(102, 204, 255, 0.05), rgba(102, 204, 255, 0.1), rgba(102, 204, 255, 0.05));
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
}

.hitokoto-wrapper:hover {
  background: linear-gradient(to right, rgba(102, 204, 255, 0.1), rgba(102, 204, 255, 0.15), rgba(102, 204, 255, 0.1));
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(102, 204, 255, 0.1);
}

.hitokoto-content {
  /* 优先使用衬线体，营造文学感 */
  font-family: 'Georgia', 'Cambria', 'Times New Roman', 'Noto Serif SC', 'Songti SC', serif;
  font-size: 1.3rem;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  text-align: center;
  position: relative;
  max-width: 800px;
  letter-spacing: 0.5px;
}

.text {
  margin: 0 8px;
}

.quote-mark {
  color: var(--vp-c-brand);
  font-size: 1.8em;
  font-family: sans-serif;
  opacity: 0.4;
  vertical-align: -0.3em;
  line-height: 0;
  display: inline-block;
}

.quote-mark.left {
  margin-right: 5px;
}

.quote-mark.right {
  margin-left: 5px;
}

.cursor {
  display: inline-block;
  width: 2px;
  background-color: var(--vp-c-brand);
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: text-bottom;
  height: 1.2em;
  opacity: 0.8;
}

.cursor.typing {
  animation: none;
  opacity: 1;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .hitokoto-wrapper {
    padding: 15px 20px;
    min-height: 100px;
  }
  
  .hitokoto-content {
    font-size: 1.1rem;
  }
  
  .quote-mark {
    font-size: 1.4em;
  }
}
</style>
