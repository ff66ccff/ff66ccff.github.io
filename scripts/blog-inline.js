'use strict';

const i18n = {
    zh: {
        blogTitle: "博客",
        blogSubtitle: "记录代码、音乐和故事",
        searchPlaceholder: "搜索文章标题或关键词",
        empty: "没有找到相关文章，换个关键词试试？",
        loading: "文章加载中，请稍候...",
        error: "文章加载失败，请稍后再试。",
        backHome: "返回首页",
        scrollTop: "回到开头",
        scrollBottom: "前往结尾",
        prevPost: "上一篇",
        nextPost: "下一篇",
        fileLabel: "文件名",
        close: "关闭全文",
        langToggle: "中",
        themeTitle: "切换主题",
        langTitle: "切换语言",
        overlayTitle: "文章全文",
        pageTitle: "博客 - ff66ccff",
        published: "发布于",
        updated: "更新于",
        statsAll: "共 {count} 篇文章",
        statsFiltered: "当前筛选 {count} 篇",
        yearAll: "全部年份",
        yearFilterLabel: "按年份筛选",
        loadMore: "加载更多",
        summaryLoading: "摘要加载中...",
        summaryUnavailable: "暂无摘要",
        loadingArticle: "文章内容加载中...",
        errorArticle: "文章加载失败，请稍后再试。"
    },
    en: {
        blogTitle: "Blog",
        blogSubtitle: "Notes on code, music, and stories",
        searchPlaceholder: "Search by title or keywords",
        empty: "No matching posts. Try different keywords?",
        loading: "Loading posts, please wait...",
        error: "Failed to load posts. Please try again later.",
        backHome: "Back Home",
        scrollTop: "Jump to Top",
        scrollBottom: "Jump to Bottom",
        prevPost: "Previous",
        nextPost: "Next",
        fileLabel: "Filename",
        close: "Close",
        langToggle: "EN",
        themeTitle: "Toggle Theme",
        langTitle: "Switch Language",
        overlayTitle: "Full article",
        pageTitle: "Blog - ff66ccff",
        published: "Published",
        updated: "Updated",
        statsAll: "{count} posts total",
        statsFiltered: "{count} posts match filters",
        yearAll: "All years",
        yearFilterLabel: "Filter by year",
        loadMore: "Load more",
        summaryLoading: "Loading summary...",
        summaryUnavailable: "Summary unavailable",
        loadingArticle: "Loading article...",
        errorArticle: "Failed to load the article. Please try again later."
    }
};

const elements = {
    themeToggle: document.getElementById('themeToggle'),
    languageToggle: document.getElementById('languageToggle'),
    searchInput: document.getElementById('searchInput'),
    postList: document.getElementById('postList'),
    emptyState: document.getElementById('emptyState'),
    blogTitle: document.getElementById('blogTitle'),
    blogSubtitle: document.getElementById('blogSubtitle'),
    backHomeLabel: document.getElementById('backHomeLabel'),
    backHomeLink: document.getElementById('backHomeLink'),
    overlay: document.getElementById('articleOverlay'),
    articleDialog: document.querySelector('.article-dialog'),
    overlayTitle: document.getElementById('overlayTitle'),
    overlayMeta: document.getElementById('overlayMeta'),
    overlayContent: document.getElementById('overlayContent'),
    overlayScroll: document.getElementById('overlayScroll'),
    closeOverlay: document.getElementById('closeOverlay'),
    scrollTopBtn: document.getElementById('scrollTopBtn'),
    scrollBottomBtn: document.getElementById('scrollBottomBtn'),
    prevPost: document.getElementById('prevPost'),
    nextPost: document.getElementById('nextPost'),
    scrollTopLabel: document.getElementById('scrollTopLabel'),
    scrollBottomLabel: document.getElementById('scrollBottomLabel'),
    prevPostLabel: document.getElementById('prevPostLabel'),
    nextPostLabel: document.getElementById('nextPostLabel'),
    postStats: document.getElementById('postStats'),
    yearFilter: document.getElementById('yearFilter'),
    yearAllBtn: document.getElementById('yearAllBtn'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    scrollSentinel: document.getElementById('scrollSentinel')
};

const POSTS_DIR = 'posts';
const METADATA_URL = `${POSTS_DIR}/metadata.json`;
const REPO_OWNER = 'ff66ccff';
const REPO_NAME = 'ff66ccff.github.io';
const CDN_BRANCH = 'main';
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${CDN_BRANCH}`;
const CDN_MANIFEST_URL = `https://data.jsdelivr.com/v1/package/gh/${REPO_OWNER}/${REPO_NAME}@${CDN_BRANCH}`;

let currentLang = 'zh';
let pendingSlug = null;

const state = {
    posts: [],
    filtered: [],
    currentSlug: null,
    loaded: false,
    filters: {
        year: 'all',
        query: ''
    },
    pageSize: 24,
    renderedCount: 0
};

const ui = {
    cardRefs: new Map(),
    previewObserver: null,
    sentinelObserver: null,
    isRendering: false,
    swapActive: false,
    swapStartedAt: 0,
    swapTimer: null
};

const revealSurfaces = new WeakSet();

function bindRevealSurface(surface) {
    if (!surface || revealSurfaces.has(surface)) {
        return;
    }

    const activate = () => surface.classList.add('is-active');
    const deactivate = () => {
        surface.classList.remove('is-active');
    };

    surface.addEventListener('pointerenter', (event) => {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        surface.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
        activate();
    });

    surface.addEventListener('pointermove', (event) => {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        surface.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    });

    surface.addEventListener('pointerleave', deactivate);
    surface.addEventListener('pointercancel', deactivate);

    surface.addEventListener('touchstart', (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) {
            return;
        }
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', `${touch.clientX - rect.left}px`);
        surface.style.setProperty('--pointer-y', `${touch.clientY - rect.top}px`);
        activate();
    }, { passive: true });

    surface.addEventListener('touchend', deactivate);
    surface.addEventListener('touchcancel', deactivate);

    revealSurfaces.add(surface);
}

function refreshRevealSurfaces() {
    requestAnimationFrame(() => {
        document.querySelectorAll('.hover-surface').forEach(bindRevealSurface);
    });
}

function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    try {
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) {
            return dateString;
        }
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } catch (error) {
        return dateString;
    }
}

function isSameDay(date1String, date2String) {
    if (!date1String || !date2String) {
        return false;
    }
    try {
        const date1 = new Date(date1String);
        const date2 = new Date(date2String);
        return date1.toDateString() === date2.toDateString();
    } catch (error) {
        return false;
    }
}

function parseFrontMatter(markdown) {
    const frontMatterPattern = /^---\s*[\r\n]+([\s\S]*?)\s*---\s*[\r\n]*/;
    const match = markdown.match(frontMatterPattern);
    if (!match) {
        return { attributes: {}, body: markdown };
    }

    const lines = match[1].split(/\r?\n/);
    const attributes = {};
    let currentKey = null;

    lines.forEach((line) => {
        if (!line.trim()) {
            return;
        }

        if (/^\s/.test(line) && currentKey) {
            attributes[currentKey] = `${attributes[currentKey]}\n${line.trim()}`;
            return;
        }

        const delimiterIndex = line.indexOf(':');
        if (delimiterIndex === -1) {
            currentKey = null;
            return;
        }

        currentKey = line.slice(0, delimiterIndex).trim();
        let value = line.slice(delimiterIndex + 1).trim();
        if (value === '|' || value === '|-' || value === '>' || value === '>-') {
            value = '';
        }
        attributes[currentKey] = value;
    });

    Object.keys(attributes).forEach((key) => {
        const normalized = attributes[key].replace(/^['"]|['"]$/g, '').trim();
        attributes[key] = normalized;
    });

    const body = markdown.slice(match[0].length);
    return { attributes, body };
}

function extractTitleFromContent(markdown) {
    const headingMatch = markdown.match(/^#\s+(.+)$/m);
    return headingMatch ? headingMatch[1].trim() : '';
}

function stripLeadingTitleHeading(markdown, title) {
    if (!markdown || !title) {
        return markdown;
    }
    const headingPattern = /^\s*#\s+([^\n]+)\s*(?:\r?\n)+/;
    const match = markdown.match(headingPattern);
    if (!match) {
        return markdown;
    }
    const headingText = match[1].trim();
    if (headingText.toLowerCase() !== title.trim().toLowerCase()) {
        return markdown;
    }
    const stripped = markdown.slice(match[0].length);
    return stripped.replace(/^\s+/, '');
}

function extractSummary(markdown) {
    const plain = markdown
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/^[#>\-*\d\.\s]+/gm, '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    if (!plain.length) {
        return '';
    }
    const snippet = plain[0];
    return snippet.length > 160 ? `${snippet.slice(0, 160)}...` : snippet;
}

function buildPostUrl(filename, cacheKey) {
    const encodedSegments = filename.split('/').map((segment) => encodeURIComponent(segment));
    const baseUrl = `${POSTS_DIR}/${encodedSegments.join('/')}`;
    return cacheKey ? `${baseUrl}?v=${encodeURIComponent(cacheKey)}` : baseUrl;
}

function buildCdnFileUrl(filename, hash) {
    const encodedSegments = filename.split('/').map((segment) => encodeURIComponent(segment));
    const baseUrl = `${CDN_BASE}/${POSTS_DIR}/${encodedSegments.join('/')}`;
    return hash ? `${baseUrl}?v=${encodeURIComponent(hash)}` : baseUrl;
}

function buildSearchableText(post, content = '') {
    const parts = [];
    if (post.slug) {
        parts.push(post.slug);
    }
    if (post.title) {
        parts.push(post.title);
    }
    if (post.summary) {
        parts.push(post.summary);
    }
    if (Array.isArray(post.tags) && post.tags.length) {
        parts.push(post.tags.join(' '));
    }
    if (content) {
        parts.push(content);
    }
    return parts.join(' ').toLowerCase();
}

function formatMessage(template, params = {}) {
    return template.replace(/\{(\w+)\}/g, (match, key) => (
        Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match
    ));
}

function getPostYear(post) {
    const source = post.createdAt || post.updatedAt;
    if (!source) {
        return null;
    }
    try {
        const year = new Date(source).getFullYear();
        return Number.isNaN(year) ? null : String(year);
    } catch (error) {
        return null;
    }
}

function updateEmptyStateText() {
    const t = i18n[currentLang];
    const status = elements.emptyState.dataset.state || 'empty';
    if (status === 'loading') {
        elements.emptyState.textContent = t.loading;
    } else if (status === 'error') {
        elements.emptyState.textContent = t.error;
    } else if (status === 'empty') {
        elements.emptyState.textContent = t.empty;
    } else {
        elements.emptyState.textContent = '';
    }
}

function showEmptyState(stateName) {
    elements.emptyState.dataset.state = stateName;
    updateEmptyStateText();
    elements.emptyState.hidden = false;
}

function hideEmptyState() {
    elements.emptyState.dataset.state = 'idle';
    updateEmptyStateText();
    elements.emptyState.hidden = true;
}

function renderStats() {
    const t = i18n[currentLang];
    elements.postStats.innerHTML = '';
    const totalPill = document.createElement('span');
    totalPill.className = 'stat-pill';
    totalPill.textContent = formatMessage(t.statsAll, { count: state.posts.length });
    elements.postStats.appendChild(totalPill);

    if (state.filters.year !== 'all' || state.filters.query) {
        const filteredPill = document.createElement('span');
        filteredPill.className = 'stat-pill';
        filteredPill.textContent = formatMessage(t.statsFiltered, { count: state.filtered.length });
        elements.postStats.appendChild(filteredPill);
    }
}

function renderYearFilter() {
    const years = Array.from(new Set(state.posts
        .map(getPostYear)
        .filter(Boolean)));
    years.sort((a, b) => Number(b) - Number(a));
    elements.yearFilter.innerHTML = '';
    years.forEach((year) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'filter-chip';
        button.dataset.year = year;
        button.textContent = year;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => setYearFilter(year));
        elements.yearFilter.appendChild(button);
    });
    elements.yearFilter.hidden = years.length === 0;
    updateFilterActiveStates();
}

function updateFilterActiveStates() {
    const activeYear = state.filters.year;
    const isAllActive = activeYear === 'all';
    elements.yearAllBtn.classList.toggle('is-active', isAllActive);
    elements.yearAllBtn.setAttribute('aria-pressed', isAllActive ? 'true' : 'false');
    elements.yearFilter.querySelectorAll('.filter-chip').forEach((button) => {
        const isActive = button.dataset.year === activeYear;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function setYearFilter(year) {
    if (state.filters.year === year) {
        return;
    }
    state.filters.year = year;
    applyFilters();
}

function resetRenderedList() {
    if (ui.previewObserver) {
        ui.previewObserver.disconnect();
    }
    ui.cardRefs.clear();
    elements.postList.innerHTML = '';
    state.renderedCount = 0;

    if (!state.filtered.length) {
        showEmptyState('empty');
        updateLoadControls();
        return;
    }

    hideEmptyState();
    renderNextPage();
}

function renderNextPage() {
    if (ui.isRendering) {
        return;
    }
    if (state.renderedCount >= state.filtered.length) {
        updateLoadControls();
        return;
    }

    ui.isRendering = true;
    const nextSlice = state.filtered.slice(state.renderedCount, state.renderedCount + state.pageSize);
    if (!nextSlice.length) {
        ui.isRendering = false;
        updateLoadControls();
        return;
    }

    nextSlice.forEach((post) => {
        const card = createPostCard(post);
        elements.postList.appendChild(card);
        if (ui.previewObserver && !post.contentLoaded && !post.summary) {
            registerCardPreview(card, post);
        }
    });
    state.renderedCount += nextSlice.length;
    refreshRevealSurfaces();
    ui.isRendering = false;
    updateLoadControls();
}

function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card hover-surface';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.dataset.slug = post.slug;

    card.addEventListener('click', (event) => {
        const origin = event ? { x: event.clientX, y: event.clientY } : null;
        openPost(post, origin);
    });

    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPost(post);
        }
    });

    const titleEl = document.createElement('h2');
    titleEl.className = 'post-title';
    titleEl.textContent = post.title || post.slug;
    card.appendChild(titleEl);

    const summaryEl = document.createElement('p');
    summaryEl.className = 'post-summary';
    summaryEl.dataset.loading = 'true';
    card.appendChild(summaryEl);

    const metaEl = document.createElement('p');
    metaEl.className = 'post-meta';
    card.appendChild(metaEl);

    ui.cardRefs.set(post.slug, {
        card,
        titleEl,
        summaryEl,
        metaEl
    });

    updateCardUI(post);

    return card;
}

function registerCardPreview(card, post) {
    if (!ui.previewObserver) {
        return;
    }
    if (!card || !post) {
        return;
    }
    ui.previewObserver.observe(card);
}

function handleCardPreview(entries) {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) {
            return;
        }
        const card = entry.target;
        ui.previewObserver.unobserve(card);
        const slug = card.dataset.slug;
        const post = state.posts.find((item) => item.slug === slug);
        if (post) {
            ensurePostSummary(post).catch(() => { });
        }
    });
}

function updateCardUI(post) {
    const refs = ui.cardRefs.get(post.slug);
    if (!refs) {
        return;
    }
    if (refs.titleEl) {
        refs.titleEl.textContent = post.title || post.slug;
    }
    if (refs.summaryEl) {
        if (post.summary) {
            refs.summaryEl.textContent = post.summary;
            refs.summaryEl.dataset.loading = 'false';
        } else if (post.contentLoaded) {
            refs.summaryEl.textContent = i18n[currentLang].summaryUnavailable;
            refs.summaryEl.dataset.loading = 'false';
        } else {
            refs.summaryEl.textContent = i18n[currentLang].summaryLoading;
            refs.summaryEl.dataset.loading = 'true';
        }
    }
    const metaText = buildMetaText(post);
    if (refs.metaEl) {
        if (metaText) {
            refs.metaEl.textContent = metaText;
            refs.metaEl.hidden = false;
        } else {
            refs.metaEl.textContent = '';
            refs.metaEl.hidden = true;
        }
    }
}

function buildMetaText(post) {
    const t = i18n[currentLang];
    const parts = [];

    if (post.createdAt && post.updatedAt && isSameDay(post.createdAt, post.updatedAt)) {
        parts.push(`${t.published}: ${formatDate(post.createdAt)}`);
    } else {
        if (post.createdAt) {
            parts.push(`${t.published}: ${formatDate(post.createdAt)}`);
        }
        if (post.updatedAt) {
            parts.push(`${t.updated}: ${formatDate(post.updatedAt)}`);
        }
    }
    return parts.join(' · ');
}

function updateLoadControls() {
    const hasMore = state.renderedCount < state.filtered.length;
    elements.loadMoreBtn.hidden = !hasMore;
    elements.loadMoreBtn.disabled = !hasMore;

    if (ui.sentinelObserver && elements.scrollSentinel) {
        ui.sentinelObserver.unobserve(elements.scrollSentinel);
        if (hasMore) {
            ui.sentinelObserver.observe(elements.scrollSentinel);
        }
    }
}

async function ensurePostSummary(post) {
    if (post.summary) {
        updateCardUI(post);
        return post.summary;
    }
    try {
        await ensurePostContent(post);
    } catch (error) {
        const refs = ui.cardRefs.get(post.slug);
        if (refs && refs.summaryEl) {
            refs.summaryEl.textContent = i18n[currentLang].summaryUnavailable;
            refs.summaryEl.dataset.loading = 'false';
        }
        return '';
    }
    updateCardUI(post);
    return post.summary;
}

async function ensurePostContent(post) {
    if (post.contentLoaded) {
        return post.content;
    }
    if (post.loadingPromise) {
        return post.loadingPromise;
    }

    post.loadingPromise = fetch(post.fetchUrl, { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${post.fetchUrl}`);
            }
            return response.text();
        })
        .then((rawMarkdown) => {
            const { attributes, body } = parseFrontMatter(rawMarkdown);
            const derivedTitle = extractTitleFromContent(body);
            const nextTitle = attributes.title || post.title || derivedTitle || post.slug;
            let contentBody = stripLeadingTitleHeading(body, nextTitle);

            post.title = nextTitle;
            if (!post.summary) {
                post.summary = attributes.summary || extractSummary(contentBody);
                if (post.summary) {
                    post.summary = post.summary.trim();
                }
            }
            post.createdAt = attributes.published || attributes.date || post.createdAt || null;
            post.updatedAt = attributes.updated || attributes.modified || post.updatedAt || post.createdAt;
            post.content = contentBody;
            post.contentLoaded = true;
            post.searchText = buildSearchableText(post, contentBody);

            updateCardUI(post);
            return post.content;
        })
        .catch((error) => {
            console.error(error);
            throw error;
        })
        .finally(() => {
            post.loadingPromise = null;
        });

    return post.loadingPromise;
}

function applyFilters() {
    if (!state.loaded) {
        return;
    }
    const queryLower = state.filters.query ? state.filters.query.toLowerCase() : '';
    const year = state.filters.year;

    state.filtered = state.posts.filter((post) => {
        const matchesYear = year === 'all' || getPostYear(post) === year;
        const matchesQuery = !queryLower || (post.searchText && post.searchText.includes(queryLower));
        return matchesYear && matchesQuery;
    });

    updateFilterActiveStates();
    renderStats();
    resetRenderedList();

    if (state.currentSlug && !state.filtered.some((post) => post.slug === state.currentSlug)) {
        closeOverlay();
    } else if (state.currentSlug) {
        updateNavigationButtons();
        updateOverlayMeta();
    }
}

function openPostBySlug(slug, origin) {
    const post = state.posts.find((item) => item.slug === slug);
    if (post) {
        openPost(post, origin);
    }
}

function openPost(post, origin) {
    const overlayVisible = elements.overlay.classList.contains('is-visible');

    if (overlayVisible && state.currentSlug === post.slug) {
        elements.overlayScroll?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    state.currentSlug = post.slug;

    const didStartSwap = overlayVisible && startOverlaySwap();

    if (!overlayVisible) {
        elements.overlayTitle.textContent = post.title || post.slug;
        if (elements.overlayMeta) {
            elements.overlayMeta.textContent = buildMetaText(post);
        }
        elements.overlayContent.innerHTML = `<p class="overlay-loading">${i18n[currentLang].loadingArticle}</p>`;
    }

    showOverlay(origin);
    updateNavigationButtons();

    ensurePostContent(post)
        .then((content) => {
            finishOverlaySwap(() => {
                elements.overlayTitle.textContent = post.title || post.slug;
                const html = marked.parse(content, { gfm: true, breaks: true });
                elements.overlayContent.innerHTML = html;
                const leadingHeading = elements.overlayContent.querySelector('h1');
                if (leadingHeading) {
                    const headingText = leadingHeading.textContent.trim().toLowerCase();
                    const titleText = (post.title || post.slug).trim().toLowerCase();
                    if (headingText === titleText) {
                        leadingHeading.remove();
                    }
                }
                Prism.highlightAllUnder(elements.overlayContent);
                updateOverlayMeta();
                updateNavigationButtons();
            });
        })
        .catch(() => {
            finishOverlaySwap(() => {
                elements.overlayTitle.textContent = post.title || post.slug;
                elements.overlayContent.innerHTML = `<p class="overlay-error">${i18n[currentLang].errorArticle}</p>`;
                updateOverlayMeta();
            });
        });

    if (!didStartSwap) {
        updateOverlayMeta();
    }

    history.replaceState(null, '', `${window.location.pathname}${window.location.search}#post=${encodeURIComponent(post.slug)}`);
}

function getCurrentPost() {
    if (!state.currentSlug) {
        return null;
    }
    return state.posts.find((post) => post.slug === state.currentSlug) || null;
}

function updateOverlayMeta() {
    const post = getCurrentPost();
    if (!post) {
        elements.overlayMeta.textContent = '';
        return;
    }
    elements.overlayMeta.textContent = buildMetaText(post);
}

function updateNavigationButtons() {
    const order = state.filtered.length ? state.filtered : state.posts;
    const pointer = order.findIndex((post) => post.slug === state.currentSlug);
    const prev = pointer > 0 ? order[pointer - 1] : null;
    const next = pointer >= 0 && pointer < order.length - 1 ? order[pointer + 1] : null;

    elements.prevPost.disabled = !prev;
    elements.nextPost.disabled = !next;

    elements.prevPost.onclick = prev ? () => openPost(prev) : null;
    elements.nextPost.onclick = next ? () => openPost(next) : null;
}

function getSwapMinimumDuration() {
    try {
        return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 0 : 220;
    } catch (error) {
        return 220;
    }
}

function startOverlaySwap() {
    if (!elements.overlay || !elements.overlayScroll) {
        ui.swapActive = false;
        return false;
    }
    if (!elements.overlay.classList.contains('is-visible')) {
        ui.swapActive = false;
        return false;
    }

    ui.swapActive = true;
    ui.swapStartedAt = performance.now();
    clearTimeout(ui.swapTimer);

    const targets = [elements.overlayScroll, elements.overlayTitle, elements.overlayMeta, elements.articleDialog];
    targets.forEach((node) => {
        if (node) {
            node.classList.add('is-swapping');
        }
    });

    return true;
}

function finishOverlaySwap(applyChanges) {
    const targets = [elements.overlayScroll, elements.overlayTitle, elements.overlayMeta, elements.articleDialog];

    const finalize = () => {
        if (typeof applyChanges === 'function') {
            applyChanges();
        }
        if (elements.overlayScroll) {
            elements.overlayScroll.scrollTo({ top: 0, behavior: 'auto' });
        }
        requestAnimationFrame(() => {
            targets.forEach((node) => node?.classList.remove('is-swapping'));
        });
        ui.swapActive = false;
        ui.swapStartedAt = 0;
        ui.swapTimer = null;
    };

    if (!ui.swapActive) {
        finalize();
        return;
    }

    const minDuration = getSwapMinimumDuration();
    if (minDuration === 0) {
        finalize();
        return;
    }

    const elapsed = performance.now() - ui.swapStartedAt;
    if (elapsed >= minDuration) {
        finalize();
        return;
    }

    clearTimeout(ui.swapTimer);
    ui.swapTimer = setTimeout(finalize, minDuration - elapsed);
}

function cancelOverlaySwap() {
    clearTimeout(ui.swapTimer);
    ui.swapTimer = null;
    ui.swapActive = false;
    ui.swapStartedAt = 0;
    [elements.overlayScroll, elements.overlayTitle, elements.overlayMeta, elements.articleDialog]
        .forEach((node) => node?.classList.remove('is-swapping'));
}

function showOverlay(origin) {
    if (elements.overlay.classList.contains('is-visible')) {
        return;
    }
    elements.overlay.hidden = false;
    elements.overlay.classList.remove('is-leaving');
    document.body.classList.add('is-overlay-open');

    requestAnimationFrame(() => {
        if (origin && elements.articleDialog) {
            const dialogRect = elements.articleDialog.getBoundingClientRect();
            if (dialogRect.width && dialogRect.height) {
                const clamp = (value) => Math.max(0, Math.min(100, value));
                const originX = clamp(((origin.x - dialogRect.left) / dialogRect.width) * 100);
                const originY = clamp(((origin.y - dialogRect.top) / dialogRect.height) * 100);
                elements.articleDialog.style.setProperty('--origin-x', `${originX}%`);
                elements.articleDialog.style.setProperty('--origin-y', `${originY}%`);
            }
        } else if (elements.articleDialog) {
            elements.articleDialog.style.removeProperty('--origin-x');
            elements.articleDialog.style.removeProperty('--origin-y');
        }

        elements.overlay.classList.add('is-visible');
        requestAnimationFrame(() => {
            elements.closeOverlay.focus({ preventScroll: true });
        });
    });
}

function closeOverlay() {
    if ((elements.overlay.hidden && !elements.overlay.classList.contains('is-visible')) || elements.overlay.classList.contains('is-leaving')) {
        return;
    }
    cancelOverlaySwap();
    elements.overlay.classList.add('is-leaving');
    elements.overlay.classList.remove('is-visible');
    const finalize = () => {
        elements.overlay.hidden = true;
        elements.overlay.classList.remove('is-leaving');
        if (elements.articleDialog) {
            elements.articleDialog.style.removeProperty('--origin-x');
            elements.articleDialog.style.removeProperty('--origin-y');
        }
    };

    if (elements.articleDialog) {
        const handleTransitionEnd = (event) => {
            if (event.target !== elements.articleDialog) {
                return;
            }
            if (event.propertyName !== 'transform' && event.propertyName !== 'opacity') {
                return;
            }
            if (!elements.overlay.classList.contains('is-leaving')) {
                return;
            }
            elements.articleDialog.removeEventListener('transitionend', handleTransitionEnd);
            finalize();
        };
        elements.articleDialog.addEventListener('transitionend', handleTransitionEnd);
        setTimeout(() => {
            if (!elements.overlay.hidden && elements.overlay.classList.contains('is-leaving')) {
                elements.articleDialog.removeEventListener('transitionend', handleTransitionEnd);
                finalize();
            }
        }, 700);
    } else {
        finalize();
    }

    document.body.classList.remove('is-overlay-open');
    state.currentSlug = null;
    history.replaceState(null, '', window.location.pathname + window.location.search);
}

function getSlugFromHash() {
    const hash = window.location.hash;
    if (!hash.startsWith('#post=')) {
        return null;
    }
    return decodeURIComponent(hash.slice(6));
}

function handleHashNavigation() {
    const slug = getSlugFromHash();
    if (!slug) {
        closeOverlay();
        return;
    }
    if (!state.loaded) {
        pendingSlug = slug;
        return;
    }
    openPostBySlug(slug);
}

async function fetchLocalMetadataEntries() {
    try {
        const response = await fetch(METADATA_URL, { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        const payload = await response.json();
        const posts = Array.isArray(payload?.posts) ? payload.posts : [];
        if (!posts.length) {
            return null;
        }
        return posts.map((item) => ({
            slug: item.slug || null,
            filename: item.filename || item.name || null,
            title: item.title || null,
            published: item.published || null,
            updated: item.updated || null,
            summary: item.summary || null,
            origin: 'local',
            url: item.filename ? buildPostUrl(item.filename, item.updated || item.published || null) : null
        })).filter((entry) => entry.filename && entry.slug && entry.url);
    } catch (error) {
        console.warn('Failed to read local metadata manifest:', error);
        return null;
    }
}

async function fetchCdnManifestEntries() {
    const response = await fetch(CDN_MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Failed to fetch CDN posts manifest');
    }
    const manifest = await response.json();
    const files = Array.isArray(manifest?.files) ? manifest.files : [];
    const postsDirectory = files.find((entry) => entry.type === 'directory' && entry.name === POSTS_DIR);
    if (!postsDirectory || !Array.isArray(postsDirectory.files)) {
        throw new Error('Posts directory missing in CDN manifest');
    }
    return postsDirectory.files
        .filter((file) => file.type === 'file' && file.name.endsWith('.md'))
        .map((file) => ({
            slug: file.name.replace(/\.md$/, ''),
            filename: file.name,
            title: null,
            published: null,
            updated: null,
            summary: null,
            origin: 'cdn',
            url: buildCdnFileUrl(file.name, file.hash)
        }));
}

async function loadPosts() {
    try {
        showEmptyState('loading');
        let manifestEntries = await fetchLocalMetadataEntries();
        if (!manifestEntries || !manifestEntries.length) {
            manifestEntries = await fetchCdnManifestEntries();
        }
        if (!manifestEntries || !manifestEntries.length) {
            throw new Error('No posts found in manifest');
        }

        const posts = manifestEntries.map((entry) => {
            const slug = entry.slug || (entry.filename ? entry.filename.replace(/\.md$/, '') : '');
            const filename = entry.filename || `${slug}.md`;
            const fetchUrl = entry.url || buildPostUrl(filename, entry.updated || entry.published || null);
            const title = entry.title || slug;
            const summary = entry.summary ? entry.summary.trim() : '';
            const createdAt = entry.published || null;
            const updatedAt = entry.updated || createdAt || null;

            const post = {
                slug,
                filename,
                title,
                summary,
                createdAt,
                updatedAt,
                fetchUrl,
                content: null,
                contentLoaded: false,
                loadingPromise: null,
                searchText: ''
            };

            post.searchText = buildSearchableText(post);
            return post;
        });

        posts.sort((a, b) => {
            const toTime = (value) => {
                if (!value) {
                    return 0;
                }
                const time = Date.parse(value);
                return Number.isNaN(time) ? 0 : time;
            };
            const aTime = toTime(a.updatedAt) || toTime(a.createdAt);
            const bTime = toTime(b.updatedAt) || toTime(b.createdAt);
            if (bTime !== aTime) {
                return bTime - aTime;
            }
            const aTitle = a.title || '';
            const bTitle = b.title || '';
            const titleCompare = aTitle.localeCompare(bTitle, undefined, { sensitivity: 'base' });
            if (titleCompare !== 0) {
                return titleCompare;
            }
            return a.slug.localeCompare(b.slug);
        });

        posts.forEach((post, index) => {
            post.index = index;
        });

        state.posts = posts;
        state.loaded = true;
        hideEmptyState();
        renderYearFilter();
        applyFilters();

        if (pendingSlug) {
            openPostBySlug(pendingSlug);
            pendingSlug = null;
        }
    } catch (error) {
        console.error(error);
        state.loaded = false;
        showEmptyState('error');
    }
}

function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const handleSearchInput = debounce((value) => {
    state.filters.query = value;
    applyFilters();
}, 200);

function initObservers() {
    ui.previewObserver = new IntersectionObserver(handleCardPreview, {
        root: null,
        rootMargin: '120px 0px',
        threshold: 0.1
    });

    ui.sentinelObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                renderNextPage();
            }
        });
    }, {
        root: null,
        rootMargin: '200px 0px',
        threshold: 0
    });
}

function updateAllVisibleCards() {
    ui.cardRefs.forEach((refs, slug) => {
        const post = state.posts.find((item) => item.slug === slug);
        if (post) {
            updateCardUI(post);
        }
    });
}

function setLanguage(lang) {
    currentLang = lang;
    const t = i18n[lang];
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    document.title = t.pageTitle;
    elements.blogTitle.textContent = t.blogTitle;
    elements.blogSubtitle.textContent = t.blogSubtitle;
    elements.searchInput.placeholder = t.searchPlaceholder;
    elements.backHomeLabel.textContent = t.backHome;
    elements.languageToggle.querySelector('span').textContent = t.langToggle;
    elements.themeToggle.title = t.themeTitle;
    elements.languageToggle.title = t.langTitle;
    elements.scrollTopLabel.textContent = t.scrollTop;
    elements.scrollBottomLabel.textContent = t.scrollBottom;
    elements.prevPostLabel.textContent = t.prevPost;
    elements.nextPostLabel.textContent = t.nextPost;
    elements.closeOverlay.title = t.close;
    elements.yearAllBtn.textContent = t.yearAll;
    elements.yearFilter.setAttribute('aria-label', t.yearFilterLabel);
    elements.loadMoreBtn.textContent = t.loadMore;
    elements.loadMoreBtn.setAttribute('aria-label', t.loadMore);
    updateEmptyStateText();
    renderStats();
    updateAllVisibleCards();
    updateOverlayMeta();
    localStorage.setItem('language', lang);
}

function initLanguage() {
    const savedLang = localStorage.getItem('language');
    const browserLang = navigator.language || navigator.userLanguage || '';
    const defaultLang = savedLang === 'zh' || savedLang === 'en'
        ? savedLang
        : (browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en');
    setLanguage(defaultLang);
}

function initLanguageToggle() {
    elements.languageToggle.addEventListener('click', () => {
        const next = currentLang === 'zh' ? 'en' : 'zh';
        setLanguage(next);
    });
}

function initTheme() {
    const themeIcon = elements.themeToggle.querySelector('i');
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    elements.themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });
}

window.addEventListener('hashchange', handleHashNavigation);

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeOverlay();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    initObservers();
    initLanguage();
    initLanguageToggle();
    initTheme();
    refreshRevealSurfaces();

    elements.yearAllBtn.addEventListener('click', () => setYearFilter('all'));
    elements.loadMoreBtn.addEventListener('click', () => renderNextPage());
    elements.searchInput.addEventListener('input', (event) => {
        handleSearchInput(event.target.value.trim());
    });
    elements.closeOverlay.addEventListener('click', () => {
        closeOverlay();
    });
    elements.overlay.addEventListener('click', (event) => {
        if (event.target === elements.overlay) {
            closeOverlay();
        }
    });
    elements.scrollTopBtn.addEventListener('click', () => {
        elements.overlayScroll.scrollTo({ top: 0, behavior: 'smooth' });
    });
    elements.scrollBottomBtn.addEventListener('click', () => {
        elements.overlayScroll.scrollTo({ top: elements.overlayScroll.scrollHeight, behavior: 'smooth' });
    });

    loadPosts();
    handleHashNavigation();
});
