'use strict';

/**
 * 自动为 hexo-generator-feed 生成的 atom.xml 与 rss2.xml 注入 XSL 样式表引用
 * 使得用户在浏览器中直接打开 https://ff66ccff.github.io/atom.xml 时展示现代友好的订阅引导页
 */
hexo.extend.filter.register('after_generate', async () => {
  const feedFiles = ['atom.xml', 'rss2.xml'];

  for (const file of feedFiles) {
    const stream = hexo.route.get(file);
    if (!stream) continue;

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    let xml = Buffer.concat(chunks).toString('utf8');

    if (!xml.includes('xml-stylesheet')) {
      const xmlDecl = '<?xml version="1.0" encoding="utf-8"?>';
      const stylesheetPi = '<?xml-stylesheet type="text/xsl" href="/atom.xsl"?>';
      if (xml.includes(xmlDecl)) {
        xml = xml.replace(xmlDecl, `${xmlDecl}\n${stylesheetPi}`);
      } else {
        xml = `${stylesheetPi}\n${xml}`;
      }
      hexo.route.set(file, xml);
    }
  }
});
