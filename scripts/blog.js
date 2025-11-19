import { marked } from 'https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.esm.js';
import { getLang, getTranslations } from './i18n.js';

const elements = {
    headerNote: document.getElementById('headerNote'),
    backHomeLabel: document.getElementById('backHomeLabel'),
    blogTitle: document.getElementById('blogTitle'),
    blogSubtitle: document.getElementById('blogSubtitle'),
    searchInput: document.getElementById('searchInput'),
    postList: document.getElementById('blogList'),
    emptyState: document.getElementById('emptyState'),
    postStats: document.getElementById('postStats'),
    listSection: document.getElementById('listSection'),
    articleSection: document.getElementById('articleSection'),
    articleTitle: document.getElementById('articleTitle'),
    articleMeta: document.getElementById('articleMeta'),
    blogContent: document.getElementById('blogContent'),
    backToList: document.getElementById('backToList'),
    backToListLabel: document.getElementById('backToListLabel'),
    languageToggle: document.getElementById('languageToggle'),
    languageBadge: document.getElementById('languageBadge'),
    themeToggle: document.getElementById('themeToggle')
};

const state = {
    lang: getLang(),
    posts: [],
    filtered: [],
    query: '',
    currentFile: null,
    cache: new Map(),
    loading: false
};

const STATUS = {
    idle: 'idle',
    loading: 'loading',
    empty: 'empty',
    error: 'error'
};

function setTheme(isDark) {
    const icon = elements.themeToggle?.querySelector('i');
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon?.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        icon?.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    setTheme(saved === 'dark');
    elements.themeToggle?.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    });
}

function applyTranslations() {
    const t = getTranslations('blog', state.lang);
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en-US';
    document.title = t.pageTitle;
    if (elements.headerNote) elements.headerNote.textContent = t.headerNote;
    elements.backHomeLabel.textContent = t.backHome;
    elements.blogTitle.textContent = t.blogTitle;
    elements.blogSubtitle.textContent = t.blogSubtitle;
    elements.searchInput.placeholder = t.searchPlaceholder;
    elements.backToListLabel.textContent = t.backToList || t.backHome;
    elements.languageBadge.textContent = t.langToggle;
    elements.languageToggle.title = t.langTitle;
    elements.languageToggle.setAttribute('aria-label', t.langTitle);
    elements.themeToggle.title = t.themeTitle;
    elements.themeToggle.setAttribute('aria-label', t.themeTitle);
    updateEmptyState();
    updatePostStats();
    if (state.currentFile) {
        updateArticleMeta();
    }
}

function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('language', lang);
    applyTranslations();
    renderPostList();
}

function initLanguageToggle() {
    elements.languageToggle?.addEventListener('click', () => {
        const next = state.lang === 'zh' ? 'en' : 'zh';
        setLanguage(next);
    });
    applyTranslations();
}

function updateEmptyState(status = STATUS.idle) {
    const t = getTranslations('blog', state.lang);
    elements.emptyState.dataset.state = status;
    let text = '';
    if (status === STATUS.loading) text = t.loading;
    if (status === STATUS.error) text = t.error;
    if (status === STATUS.empty) text = t.empty;
    elements.emptyState.textContent = text;
    elements.emptyState.hidden = status === STATUS.idle;
}

function updatePostStats() {
    const t = getTranslations('blog', state.lang);
    if (!state.posts.length) {
        elements.postStats.textContent = '';
        return;
    }
    if (state.filtered.length === state.posts.length) {
        elements.postStats.textContent = t.statsAll.replace('{count}', state.posts.length);
    } else {
        const base = t.statsFiltered.replace('{count}', state.filtered.length);
        elements.postStats.textContent = `${base} · ${t.statsAll.replace('{count}', state.posts.length)}`;
    }
}

function normalizePosts(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.posts)) {
        return payload.posts;
    }
    return [];
}

async function fetchPosts() {
    updateEmptyState(STATUS.loading);
    state.loading = true;
    try {
        const response = await fetch('posts.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to load posts.json');
        }
        const data = await response.json();
        state.posts = normalizePosts(data);
        state.filtered = [...state.posts];
        state.loading = false;
        updateEmptyState(state.filtered.length ? STATUS.idle : STATUS.empty);
        updatePostStats();
        renderPostList();
    } catch (error) {
        console.error(error);
        state.loading = false;
        updateEmptyState(STATUS.error);
    }
}

function renderPostList() {
    if (!elements.postList) {
        return;
    }
    elements.postList.innerHTML = '';
    if (!state.filtered.length) {
        updateEmptyState(state.loading ? STATUS.loading : STATUS.empty);
        return;
    }
    updateEmptyState(STATUS.idle);
    const t = getTranslations('blog', state.lang);
    state.filtered.forEach((post) => {
        const card = document.createElement('article');
        card.className = 'post-card hover-surface';
        card.tabIndex = 0;
        const title = document.createElement('h2');
        title.textContent = post.title || post.file;
        const meta = document.createElement('time');
        meta.dateTime = post.date || '';
        meta.textContent = post.date || '';
        card.append(title, meta);
        const open = () => openPost(post.file, post.title || post.file, true);
        card.addEventListener('click', open);
        card.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
        elements.postList.appendChild(card);
    });
    updatePostStats();
}

function filterPosts(query) {
    state.query = query;
    const needle = query.trim().toLowerCase();
    if (!needle) {
        state.filtered = [...state.posts];
        renderPostList();
        return;
    }
    state.filtered = state.posts.filter((post) => {
        return [post.title, post.file, post.date]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(needle));
    });
    renderPostList();
}

async function fetchPostContent(file) {
    if (state.cache.has(file)) {
        return state.cache.get(file);
    }
    const encoded = file.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`posts/${encoded}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Post not found');
    }
    const text = await response.text();
    state.cache.set(file, text);
    return text;
}

function updateArticleMeta() {
    const t = getTranslations('blog', state.lang);
    const post = state.posts.find((item) => item.file === state.currentFile);
    if (!post) {
        elements.articleMeta.textContent = '';
        return;
    }
    const published = post.date && post.date !== 'Unknown'
        ? `${t.published}: ${post.date}`
        : '';
    elements.articleMeta.textContent = published;
}

async function openPost(file, title = '', pushHistory = false) {
    state.currentFile = file;
    elements.listSection.hidden = true;
    elements.articleSection.hidden = false;
    updateArticleMeta();
    const t = getTranslations('blog', state.lang);
    try {
        elements.articleTitle.textContent = title || file;
        elements.blogContent.innerHTML = `<p>${t.loadingArticle}</p>`;
        const raw = await fetchPostContent(file);
        const html = marked.parse(raw, { mangle: false, headerIds: false });
        elements.blogContent.innerHTML = html;
        updateArticleMeta();
    } catch (error) {
        console.error(error);
        elements.blogContent.innerHTML = `<p>${t.errorArticle}</p>`;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('p', file);
    if (pushHistory) {
        history.pushState({ post: file }, '', url);
    } else {
        history.replaceState({ post: file }, '', url);
    }
}

function showList(pushHistory = false) {
    state.currentFile = null;
    elements.articleSection.hidden = true;
    elements.listSection.hidden = false;
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    if (pushHistory) {
        history.pushState({}, '', url);
    } else {
        history.replaceState({}, '', url);
    }
}

function handleRouteChange(replace = false) {
    const params = new URLSearchParams(window.location.search);
    const file = params.get('p');
    if (file) {
        const post = state.posts.find((item) => item.file === file);
        const title = post?.title || file;
        openPost(file, title, !replace);
    } else {
        showList(!replace);
    }
}

function initSearch() {
    elements.searchInput?.addEventListener('input', (event) => {
        filterPosts(event.target.value);
    });
}

function initNavigation() {
    elements.backToList?.addEventListener('click', () => {
        showList(true);
    });

    window.addEventListener('popstate', () => {
        handleRouteChange(true);
    });
}

async function start() {
    initTheme();
    initLanguageToggle();
    initSearch();
    initNavigation();
    await fetchPosts();
    handleRouteChange(true);
}

start().catch((error) => {
    console.error('Failed to initialize blog:', error);
    updateEmptyState(STATUS.error);
});
