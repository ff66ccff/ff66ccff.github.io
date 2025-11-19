import { marked } from 'https://esm.sh/marked@11.1.1';

// DOM Elements
const els = {
    loading: document.getElementById('loading'),
    postList: document.getElementById('postList'),
    articleView: document.getElementById('articleView'),
    articleTitle: document.getElementById('articleTitle'),
    articleMeta: document.getElementById('articleMeta'),
    articleContent: document.getElementById('articleContent'),
    backBtn: document.getElementById('backBtn'),
    postNav: document.getElementById('postNav'),
    prevPost: document.getElementById('prevPost'),
    nextPost: document.getElementById('nextPost'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxClose: document.querySelector('.lightbox-close')
};

// State
let posts = [];
let currentPostIndex = -1;

// Initialize
async function init() {
    try {
        // Handle routing based on URL query params
        const params = new URLSearchParams(window.location.search);
        const postSlug = params.get('p');

        // Fetch posts metadata
        const response = await fetch('posts/metadata.json');
        if (!response.ok) throw new Error('Failed to load posts metadata');

        const data = await response.json();
        // Ensure posts are sorted by date (newest first)
        posts = data.posts.sort((a, b) => {
            const dateA = new Date(a.published || a.updated);
            const dateB = new Date(b.published || b.updated);
            return dateB - dateA;
        });

        if (postSlug) {
            await loadPost(postSlug);
        } else {
            renderPostList();
        }
    } catch (error) {
        console.error('Error initializing blog:', error);
        els.loading.textContent = '加载失败，请刷新重试';
    }
}

// Render Post List
function renderPostList() {
    els.loading.classList.add('hidden');
    els.articleView.classList.add('hidden');
    els.postList.classList.remove('hidden');
    els.postList.innerHTML = '';

    // Update URL
    history.pushState(null, '', 'blog.html');

    posts.forEach(post => {
        const date = new Date(post.published || post.updated).toLocaleDateString('zh-CN');
        const item = document.createElement('a');
        item.className = 'post-item';
        item.innerHTML = `
            <div class="post-item-title">${post.title}</div>
            <div class="post-item-meta">
                <span><i class="far fa-calendar"></i> ${date}</span>
            </div>
            <div class="post-item-summary">${post.summary || ''}</div>
        `;
        item.onclick = (e) => {
            e.preventDefault();
            loadPost(post.slug || post.filename);
        };
        els.postList.appendChild(item);
    });
}

// Load and Render Article
async function loadPost(identifier) {
    els.loading.classList.remove('hidden');
    els.postList.classList.add('hidden');
    els.articleView.classList.add('hidden');

    try {
        // Find post by slug or filename
        const index = posts.findIndex(p => p.slug === identifier || p.filename === identifier);
        if (index === -1) throw new Error('Post not found');

        currentPostIndex = index;
        const post = posts[index];

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('p', post.slug || post.filename);
        history.pushState(null, '', url);

        // Fetch markdown content
        const res = await fetch(`posts/${post.filename}`);
        if (!res.ok) throw new Error('Failed to load post content');
        const text = await res.text();

        // Remove Front Matter (YAML)
        const content = text.replace(/^---[\s\S]*?---\s*/, '');

        // Render
        els.articleTitle.textContent = post.title;
        const date = new Date(post.published || post.updated).toLocaleDateString('zh-CN');
        els.articleMeta.innerHTML = `<span><i class="far fa-calendar"></i> 发布于 ${date}</span>`;
        els.articleContent.innerHTML = marked.parse(content);

        // Setup Navigation
        setupNavigation(index);

        // Setup Images for Lightbox
        setupImages();

        els.loading.classList.add('hidden');
        els.articleView.classList.remove('hidden');
        window.scrollTo(0, 0);

    } catch (error) {
        console.error(error);
        els.loading.textContent = '文章加载失败';
    }
}

// Setup Previous/Next Navigation
function setupNavigation(currentIndex) {
    const prevIndex = currentIndex - 1; // Newer post
    const nextIndex = currentIndex + 1; // Older post

    if (prevIndex >= 0) {
        const prev = posts[prevIndex];
        els.prevPost.classList.remove('hidden');
        els.prevPost.querySelector('.post-nav-title').textContent = prev.title;
        els.prevPost.onclick = () => loadPost(prev.slug || prev.filename);
    } else {
        els.prevPost.classList.add('hidden');
    }

    if (nextIndex < posts.length) {
        const next = posts[nextIndex];
        els.nextPost.classList.remove('hidden');
        els.nextPost.querySelector('.post-nav-title').textContent = next.title;
        els.nextPost.onclick = () => loadPost(next.slug || next.filename);
    } else {
        els.nextPost.classList.add('hidden');
    }

    if (prevIndex < 0 && nextIndex >= posts.length) {
        els.postNav.classList.add('hidden');
    } else {
        els.postNav.classList.remove('hidden');
    }
}

// Setup Lightbox for Images
function setupImages() {
    const images = els.articleContent.querySelectorAll('img');
    images.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.onclick = () => {
            els.lightboxImg.src = img.src;
            els.lightboxImg.classList.remove('zoomed');
            els.lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
    });
}

// Event Listeners
els.backBtn.onclick = renderPostList;

function closeLightbox() {
    els.lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
        els.lightboxImg.classList.remove('zoomed');
        els.lightboxImg.src = '';
    }, 300);
}

els.lightboxClose.onclick = closeLightbox;

els.lightbox.onclick = (e) => {
    if (e.target === els.lightbox || e.target.classList.contains('lightbox-content-wrapper')) {
        closeLightbox();
    }
};

els.lightboxImg.onclick = (e) => {
    e.stopPropagation();
    els.lightboxImg.classList.toggle('zoomed');
};

window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const postSlug = params.get('p');
    if (postSlug) {
        loadPost(postSlug);
    } else {
        renderPostList();
    }
});

// Start
init();
