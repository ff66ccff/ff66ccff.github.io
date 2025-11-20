---
layout: home

hero:
  name: "ff66ccff"
  text: ""
  tagline: ""
  image:
    src: /avatar.jpg
    alt: ff66ccff Avatar
  actions:
    - theme: brand
      text: 阅读博客
      link: /posts/
---

<div class="hobbies-section">
  <h2>我的爱好</h2>
  <div class="hobbies-list">
    <div class="hobby-item">
      <div class="hobby-icon">💻</div>
      <h3>编程</h3>
      <p>技术笔记、算法和开发日志。</p>
    </div>
    <div class="hobby-item">
      <div class="hobby-icon">🎵</div>
      <h3>中文 Vocaloid</h3>
      <p>乐评、文化分析和收藏。</p>
    </div>
    <div class="hobby-item">
      <div class="hobby-icon">🚀</div>
      <h3>科幻小说</h3>
      <p>书评、对未来主义和科幻概念的思考。</p>
    </div>
  </div>
</div>

<style>
.hobbies-section {
  margin-top: 60px;
  text-align: center;
  padding: 0 20px;
}

.hobbies-section h2 {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 40px;
  border: none;
}

.hobbies-list {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.hobby-item {
  background: var(--vp-c-bg-soft);
  padding: 30px;
  border-radius: 12px;
  width: 280px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hobby-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.hobby-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.hobby-item h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--vp-c-brand-1);
}

.hobby-item p {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>


