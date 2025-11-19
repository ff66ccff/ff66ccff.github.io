

**Role:** You are a Senior Web Developer. I need you to refactor my GitHub Pages repository (`https://github.com/ff66ccff/ff66ccff.github.io`).

**Current Stack:** HTML5, CSS3, Vanilla JS.
**Goal:** Transform this static site into a dynamic blog using **Client-Side Rendering** and **GitHub Actions** for automation.

Please implement the following 4 changes based on the specific code patterns below.

#### 1. CSS Architecture (Variables & Dark Mode)
Refactor `styles/main.css`. Use CSS variables for theming instead of hardcoded values.
**Reference Code:**
```css
:root {
  --bg-body: #ffffff;
  --text-main: #333333;
  --accent-color: #ff66cc;
}

[data-theme="dark"] {
  --bg-body: #1a1a1a;
  --text-main: #f0f0f0;
}

body {
  background-color: var(--bg-body);
  color: var(--text-main);
  transition: background 0.3s, color 0.3s;
}
```

#### 2. Internationalization (i18n)
Separate text from logic. Create `scripts/i18n.js`.
**Reference Code:**
```javascript
// scripts/i18n.js
export const translations = {
  zh: {
    title: "FF66CCFF 的主页",
    desc: "代码 / 音乐 / 故事",
    nav_blog: "博客"
  },
  en: {
    title: "FF66CCFF's Home",
    desc: "Code / Music / Stories",
    nav_blog: "Blog"
  }
};

export function getLang() {
  return localStorage.getItem('lang') || (navigator.language.includes('zh') ? 'zh' : 'en');
}
```

#### 3. Automated Blog Indexing (GitHub Actions)
I need a workflow to auto-generate `posts.json` when I push Markdown files.
Create `.github/workflows/build-blog.yml` with this logic:
**Reference Code:**
```yaml
name: Build Blog Index
on:
  push:
    paths: ['posts/*.md'] # Trigger only on markdown changes

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.x'
      
      - name: Generate JSON
        run: |
          python -c "
          import os, json, re
          posts = []
          for f in os.listdir('posts'):
              if f.endswith('.md'):
                  with open(f'posts/{f}', 'r', encoding='utf-8') as file:
                      content = file.read()
                      # Extract Front Matter (title/date)
                      title = re.search(r'title:\s*(.+)', content)
                      date = re.search(r'date:\s*(.+)', content)
                      posts.append({
                          'file': f,
                          'title': title.group(1).strip() if title else f,
                          'date': date.group(1).strip() if date else 'Unknown'
                      })
          # Sort by date desc
          posts.sort(key=lambda x: x['date'], reverse=True)
          with open('posts.json', 'w', encoding='utf-8') as f:
              json.dump(posts, f, ensure_ascii=False, indent=2)
          "

      - name: Commit & Push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add posts.json
          git commit -m "Auto-update blog index" || exit 0
          git push
```

#### 4. Dynamic Blog Loader (JS)
Update `scripts/blog.js` (and `blog.html`) to fetch the JSON and render Markdown.
**Reference Logic:**
```javascript
// scripts/blog.js
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const params = new URLSearchParams(window.location.search);
const postFile = params.get('p'); // e.g. ?p=my-story.md

if (!postFile) {
  // 1. List Mode
  fetch('/posts.json')
    .then(res => res.json())
    .then(posts => {
      // Render list to <div id="blog-list">...</div>
      // Example: <a href="?p=${post.file}">${post.title}</a>
    });
} else {
  // 2. Article Mode
  fetch(`/posts/${postFile}`)
    .then(res => res.text())
    .then(md => {
      // Render markdown to <div id="blog-content">...</div>
      document.getElementById('blog-content').innerHTML = marked.parse(md);
    });
}
```

**Instructions:**
Please analyze my current file structure and apply these changes step-by-step. Start with the CSS and i18n modules.

---

