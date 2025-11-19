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
    lightboxClose: document.querySelector('.lightbox-close'),
    // New Elements
    searchInput: document.getElementById('searchInput'),
    pagination: document.getElementById('pagination'),
    archiveList: document.getElementById('archiveList'),
    blogSidebar: document.querySelector('.blog-sidebar'),
    searchContainer: document.querySelector('.search-container')
};

// State
let posts = [];
let filteredPosts = [];
let currentPostIndex = -1;
let currentPage = 1;
const itemsPerPage = 5;
let searchQuery = '';
let dateFilter = null; // { year: 2023, month: 11 }

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

        // Initialize filtered posts
        filteredPosts = [...posts];

        // Generate Archive
        generateArchive();

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

// Filter Posts
function filterPosts() {
    filteredPosts = posts.filter(post => {
        const matchSearch = !searchQuery ||
            (post.title.toLowerCase().includes(searchQuery) ||
                (post.summary && post.summary.toLowerCase().includes(searchQuery)));

        let matchDate = true;
        if (dateFilter) {
            const date = new Date(post.published || post.updated);
            matchDate = date.getFullYear() === dateFilter.year &&
                (date.getMonth() + 1) === dateFilter.month;
        }

        return matchSearch && matchDate;
    });

    currentPage = 1;
    renderPostList();
}

// Render Post List
function renderPostList() {
    els.loading.classList.add('hidden');
    els.articleView.classList.add('hidden');
    els.postList.classList.remove('hidden');
    els.pagination.classList.remove('hidden');
    if (els.blogSidebar) els.blogSidebar.classList.remove('hidden');
    if (els.searchContainer) els.searchContainer.classList.remove('hidden');

    els.postList.innerHTML = '';

    // Update URL
    history.pushState(null, '', 'blog.html');

    if (filteredPosts.length === 0) {
        els.postList.innerHTML = '<div class="no-results" style="text-align:center; padding: 20px; color: var(--text-muted);">没有找到相关文章</div>';
        els.pagination.innerHTML = '';
        return;
    }

    // Pagination Logic
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagePosts = filteredPosts.slice(start, end);

    pagePosts.forEach(post => {
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

    renderPagination();
}

// Render Pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
    els.pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderPostList();
            window.scrollTo(0, 0);
        }
    };
    els.pagination.appendChild(prevBtn);

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            renderPostList();
            window.scrollTo(0, 0);
        };
        els.pagination.appendChild(btn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPostList();
            window.scrollTo(0, 0);
        }
    };
    els.pagination.appendChild(nextBtn);
}

// Generate Archive Sidebar
function generateArchive() {
    const archive = {};
    posts.forEach(post => {
        const date = new Date(post.published || post.updated);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!archive[key]) {
            archive[key] = { year, month, count: 0 };
        }
        archive[key].count++;
    });

    // Sort by date desc
    const sortedKeys = Object.keys(archive).sort((a, b) => {
        const [y1, m1] = a.split('-').map(Number);
        const [y2, m2] = b.split('-').map(Number);
        return (y2 * 12 + m2) - (y1 * 12 + m1);
    });

    els.archiveList.innerHTML = `
        <li class="archive-item" onclick="clearDateFilter()">
            <span>全部文章</span>
            <span class="archive-count">${posts.length}</span>
        </li>
    `;

    sortedKeys.forEach(key => {
        const { year, month, count } = archive[key];
        const li = document.createElement('li');
        li.className = 'archive-item';
        li.innerHTML = `
            <span>${year}年${month}月</span>
            <span class="archive-count">${count}</span>
        `;
        li.onclick = () => {
            dateFilter = { year, month };
            filterPosts();
        };
        els.archiveList.appendChild(li);
    });
}

window.clearDateFilter = function () {
    dateFilter = null;
    filterPosts();
};

// Load and Render Article
async function loadPost(identifier) {
    els.loading.classList.remove('hidden');
    els.postList.classList.add('hidden');
    els.pagination.classList.add('hidden');
    els.articleView.classList.add('hidden');
    if (els.searchContainer) els.searchContainer.classList.add('hidden');

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

        // Remove Front Matter (YAML) and First H1
        let content = text.replace(/^---[\s\S]*?---\s*/, '');
        // Remove the first H1 title if it exists to avoid duplication
        content = content.replace(/^#\s+.+$/m, '');

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
            els.lightbox.classList.add('active');
        };
    });
}

// Event Listeners
els.backBtn.onclick = () => {
    // Clear URL param
    const url = new URL(window.location);
    url.searchParams.delete('p');
    history.pushState(null, '', url);
    renderPostList();
};

if (els.searchInput) {
    els.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterPosts();
    });
}

els.lightbox.onclick = (e) => {
    if (e.target !== els.lightboxImg) {
        els.lightbox.classList.remove('active');
    }
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