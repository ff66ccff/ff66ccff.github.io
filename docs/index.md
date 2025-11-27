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

<div class="student-info">
  <p>SCU 计算机 2025 级学生</p>
</div>

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

/* 新增样式 */
.student-info {
  text-align: center;
  margin-top: 30px;
  margin-bottom: 60px;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: 1px;
  opacity: 0.9;
}

/* 强制 Hero 区域居中显示，提升美观度 */
@media (min-width: 960px) {
  .VPHomeHero .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .VPHomeHero .main {
    order: 2;
    width: 100%;
    max-width: 900px;
    margin-top: 20px;
  }

  .VPHomeHero .image {
    order: 1;
    margin-bottom: 40px;
    display: flex;
    justify-content: center;
  }
  
  .VPHomeHero .name {
    margin: 0 auto;
  }
  
  .VPHomeHero .text {
    margin: 10px auto;
    max-width: 600px;
  }

  .VPHomeHero .actions {
    justify-content: center;
    margin-top: 30px;
  }
}

/* 移动端和通用样式调整 */
.VPHomeHero .actions {
  justify-content: center;
}

/* 调整 Hitokoto 组件在居中布局下的显示 */
.hitokoto-wrapper {
  margin: 30px auto !important;
  max-width: 700px;
}
</style>


