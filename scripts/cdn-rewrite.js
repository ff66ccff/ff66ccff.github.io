'use strict';

// CDN rewrite disabled: keep local image paths for all environments.
hexo.extend.filter.register('after_render:html', (html) => html);
