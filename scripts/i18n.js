export const translations = {
    home: {
        zh: {
            pageTitle: "ff66ccff - 主页",
            headerNote: "记录代码、音乐与故事，分享我的学习旅程。",
            name: "ff66ccff",
            subtitle: "四川大学 25级计算机学生",
            interestsTitle: "我的兴趣",
            codingTitle: "编程",
            codingSubtitle: "Programming",
            vocaloidTitle: "中文 VOCALOID",
            vocaloidSubtitle: "Chinese Vocaloid",
            scifiTitle: "科幻小说",
            scifiSubtitle: "Sci-Fi Novels",
            placeholderTitle: "[数据删除]",
            placeholderSubtitle: "[数据删除]",
            tagline: "记录代码、音乐与故事,分享我的学习旅程。",
            viewProfile: "查看我的 GitHub",
            viewBlog: "进入博客",
            langToggle: "中",
            themeTitle: "切换主题",
            langTitle: "切换语言"
        },
        en: {
            pageTitle: "ff66ccff - Home",
            headerNote: "Notes on code, music, and stories from my learning journey.",
            name: "ff66ccff",
            subtitle: "Computer Science Student, Sichuan University (Class of 2025)",
            interestsTitle: "My Interests",
            codingTitle: "Programming",
            codingSubtitle: "Code & Dev",
            vocaloidTitle: "Chinese VOCALOID",
            vocaloidSubtitle: "Music & Voice Synth",
            scifiTitle: "Sci-Fi Novels",
            scifiSubtitle: "Science Fiction",
            placeholderTitle: "[DATA EXPUNGED]",
            placeholderSubtitle: "Content removed",
            tagline: "Notes on coding, music, and stories from my learning journey.",
            viewProfile: "View My GitHub",
            viewBlog: "Visit Blog",
            langToggle: "EN",
            themeTitle: "Toggle Theme",
            langTitle: "Switch Language"
        }
    },
    blog: {
        zh: {
            headerNote: "记录代码、音乐与故事，分享我的学习旅程。",
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
            errorArticle: "文章加载失败，请稍后再试。",
            backToList: "返回列表",
            prevPage: "上一页",
            nextPage: "下一页",
            pageIndicator: "第 {current} / {total} 页"
        },
        en: {
            headerNote: "Notes on code, music, and stories from my learning journey.",
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
            errorArticle: "Failed to load the article. Please try again later.",
            backToList: "Back to list",
            prevPage: "Previous",
            nextPage: "Next",
            pageIndicator: "Page {current} of {total}"
        }
    }
};

export function getLang() {
    let saved = null;
    try {
        saved = localStorage.getItem('language') || localStorage.getItem('lang');
    } catch (e) { }
    if (saved === 'zh' || saved === 'en') {
        return saved;
    }
    const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return browserLang.includes('zh') ? 'zh' : 'en';
}

export function getTranslations(section, lang = getLang()) {
    const dictionary = translations[section] || {};
    return dictionary[lang] || dictionary.zh || dictionary.en || {};
}
