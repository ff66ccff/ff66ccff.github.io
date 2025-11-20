<script setup>
import { ref, onMounted } from 'vue'

const hitokoto = ref('Loading...')
const from = ref('')

const fetchHitokoto = async () => {
  try {
    // Add timestamp to prevent caching
    const res = await fetch(`https://v1.hitokoto.cn?c=a&t=${Date.now()}`)
    const data = await res.json()
    hitokoto.value = data.hitokoto
    from.value = data.from ? `— ${data.from}` : ''
  } catch (e) {
    hitokoto.value = 'ID is Pink, but Soul is Blue'
    from.value = ''
  }
}

onMounted(() => {
  fetchHitokoto()
})
</script>

<template>
  <div class="hitokoto-container" @click="fetchHitokoto">
    <p class="hitokoto-text">{{ hitokoto }}</p>
    <p class="hitokoto-from" v-if="from">{{ from }}</p>
  </div>
</template>

<style scoped>
.hitokoto-container {
  cursor: pointer;
  text-align: center;
  margin: 20px 0;
  padding: 10px;
  transition: opacity 0.3s;
}
.hitokoto-container:hover {
  opacity: 0.8;
}
.hitokoto-text {
  font-size: 1.5rem;
  font-weight: bold;
  background: -webkit-linear-gradient(315deg, #ff66cc 25%, #66ccff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1.5;
}
.hitokoto-from {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 5px;
  font-style: italic;
}
</style>
