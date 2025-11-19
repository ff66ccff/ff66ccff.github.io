# Vocaloid

<script setup>
import { data } from '../../posts.data.ts'
const posts = data.filter(p => p.url.includes('/posts/vocaloid/'))
</script>

<div v-for="post in posts" :key="post.url" class="post-item">
  <a :href="post.url">
    <div class="post-title">{{ post.title }}</div>
    <div class="post-date">{{ post.date.string }}</div>
  </a>
</div>

<style>
.post-item {
  margin-bottom: 1rem;
}
.post-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}
.post-date {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
}
</style>
