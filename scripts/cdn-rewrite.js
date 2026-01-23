'use strict';

const CDN_ROOT = 'https://cdn.jsdelivr.net/gh/ff66ccff/ff66ccff.github.io@main';

// Keep local image paths during `hexo server`; rewrite to CDN for generate/deploy.
hexo.extend.filter.register('after_render:html', (html) => {
    const isLocalPreview = hexo && hexo.env && hexo.env.cmd === 'server';
    if (isLocalPreview) return html;
    if (typeof html !== 'string') return html;

    const pattern = /src=(['"])\/(photos|images)\/([^"']+)\1/g;
    return html.replace(pattern, (match, quote, folder, rest) => `src=${quote}${CDN_ROOT}/${folder}/${rest}${quote}`);
});
