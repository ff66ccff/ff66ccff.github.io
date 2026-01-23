'use strict';

const CDN_ROOT = 'https://cdn.jsdelivr.net/gh/ff66ccff/ff66ccff.github.io@main/source';

// Keep local image paths during `hexo server`; rewrite to CDN for generate/deploy.
hexo.extend.filter.register('after_render:html', (html) => {
    const isLocalPreview = hexo && hexo.env && hexo.env.cmd === 'server';
    if (isLocalPreview) return html;
    if (typeof html !== 'string') return html;

    const rewritePath = (url) => {
        if (typeof url !== 'string') return url;
        if (url.startsWith('/photos/') || url.startsWith('/images/')) {
            return `${CDN_ROOT}${url}`;
        }
        return url;
    };

    const rewriteSrcset = (value) => {
        return value
            .split(',')
            .map((item) => {
                const trimmed = item.trim();
                if (!trimmed) return item;
                const parts = trimmed.split(/\s+/);
                const url = parts[0];
                const rest = parts.slice(1).join(' ');
                const rewritten = rewritePath(url);
                return rest ? `${rewritten} ${rest}` : rewritten;
            })
            .join(', ');
    };

    const attrPattern = /\b(src|data-src|data-original|data-bg|data-background|poster|srcset|data-srcset)\s*=\s*(['"])([^"']+)\2/gi;
    return html.replace(attrPattern, (match, attr, quote, value) => {
        const lower = attr.toLowerCase();
        const rewritten = (lower === 'srcset' || lower === 'data-srcset')
            ? rewriteSrcset(value)
            : rewritePath(value);
        return `${attr}=${quote}${rewritten}${quote}`;
    });
});
