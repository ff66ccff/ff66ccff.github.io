---
layout: page
title: 博客
sidebar: false
hero:
  name: 博客
  text: 随想与笔记
  tagline: 编程 · 生活
  actions:
    - theme: brand
      text: 📂 编程分类
      link: /posts/coding/
    - theme: alt
      text: ☕ 生活分类
      link: /posts/life/
---

<script setup>
import { data } from '../posts.data.ts'
</script>

<div class="category-nav">
  <a href="/posts/coding/" class="category-btn coding">
    <span class="icon">📂</span>
    <span class="text">编程分类</span>
  </a>
  <a href="/posts/life/" class="category-btn life">
    <span class="icon">☕</span>
    <span class="text">生活分类</span>
  </a>
</div>

<div class="blog-list">
  <div v-for="post in data" :key="post.url" class="post-card">
    <a :href="post.url">
      <div class="post-header">
        <div class="post-title">{{ post.title }}</div>
        <div class="post-date">{{ post.date.string }}</div>
      </div>
      <div v-if="post.excerpt" class="post-excerpt" v-html="post.excerpt"></div>
      <div class="post-footer">
        <span class="read-more">阅读全文 →</span>
      </div>
    </a>
  </div>
</div>

<style>
.blog-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.post-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
  border-color: var(--vp-c-brand-1);
}

.post-card a {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.post-header {
  margin-bottom: 16px;
}

.post-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
  line-height: 1.3;
  transition: color 0.2s;
}

.post-card:hover .post-title {
  color: var(--vp-c-brand-1);
}

.post-date {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.post-excerpt {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  flex-grow: 1;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.read-more {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s;
}

.post-card:hover .read-more {
  transform: translateX(4px);
}

.category-nav {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 30px;
  text-decoration: none !important;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.category-btn.coding {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.category-btn.life {
  background-color: var(--vp-c-accent-soft);
  color: var(--vp-c-accent);
}

.category-btn:hover {
  transform: translateY(-2px);
  filter: brightness(0.95);
}

.category-btn .icon {
  font-size: 1.2rem;
}
</style>
