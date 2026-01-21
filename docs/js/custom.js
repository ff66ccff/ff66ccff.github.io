(() => {
    const CDN = {
        css: 'https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/5.0.33/fancybox/fancybox.css',
        js: 'https://cdnjs.cloudflare.com/ajax/libs/fancyapps-ui/5.0.33/fancybox/fancybox.umd.min.js'
    };

    const ensureFancybox = () => {
        if (typeof Fancybox !== 'undefined') return Promise.resolve();

        if (!document.querySelector(`link[data-fancybox="true"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = CDN.css;
            link.setAttribute('data-fancybox', 'true');
            document.head.appendChild(link);
        }

        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[data-fancybox="true"]`)) return resolve();
            const script = document.createElement('script');
            script.src = CDN.js;
            script.defer = true;
            script.setAttribute('data-fancybox', 'true');
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Fancybox'));
            document.body.appendChild(script);
        });
    };

    const wrapImages = () => {
        const containers = document.querySelectorAll('#post-body, [itemprop="articleBody"], .post .md, .article .md, .article-entry');
        if (!containers.length) return [];

        const groups = [];
        containers.forEach((container, index) => {
            const groupName = `post-${index + 1}`;
            const images = container.querySelectorAll('img');
            if (!images.length) return;

            images.forEach(img => {
                if (img.closest('a[data-fancybox]')) return;
                const src = img.getAttribute('data-src') || img.getAttribute('data-srcset') || img.getAttribute('src') || '';
                if (!src) return;
                const link = document.createElement('a');
                link.href = src;
                link.setAttribute('data-fancybox', groupName);
                if (img.alt) link.setAttribute('data-caption', img.alt);
                img.parentNode.insertBefore(link, img);
                link.appendChild(img);
            });

            groups.push(groupName);
        });

        return groups;
    };

    const init = async () => {
        try {
            await ensureFancybox();
        } catch (error) {
            return;
        }

        const groups = wrapImages();
        if (!groups.length || typeof Fancybox === 'undefined') return;

        groups.forEach(groupName => {
            Fancybox.bind(`[data-fancybox="${groupName}"]`, {
                Hash: false,
                groupAll: false,
                Thumbs: { showOnStart: false }
            });
        });
    };

    document.addEventListener('DOMContentLoaded', init);
    window.addEventListener('load', init);
})();
