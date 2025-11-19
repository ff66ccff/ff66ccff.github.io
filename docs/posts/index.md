---
layout: page
title: Blog
hero:
  name: Blog
  text: My Thoughts & Notes
  tagline: Coding, Vocaloid, Sci-Fi
  actions:
    - theme: brand
      text: Coding
      link: /posts/coding/
    - theme: alt
      text: Vocaloid
      link: /posts/vocaloid/
    - theme: alt
      text: Sci-Fi
      link: /posts/sci-fi/
    - theme: alt
      text: Life
      link: /posts/life/
---

<script setup>
import { data } from '../posts.data.ts'
</script>

## All Posts

<div v-for="post in data" :key="post.url" class="post-item">
  <a :href="post.url">
    <div class="post-title">{{ post.title }}</div>
    <div class="post-date">{{ post.date.string }}</div>
    <div v-if="post.excerpt" class="post-excerpt" v-html="post.excerpt"></div>
  </a>
</div>

<style>
.post-item {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 1rem;
}
.post-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}
.post-date {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}
.post-excerpt {
  font-size: 1rem;
  color: var(--vp-c-text-1);
}
</style>
