<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title><xsl:value-of select="atom:feed/atom:title | rss/channel/title"/> - RSS / Atom 订阅源</title>
        <link rel="shortcut icon" href="/avatar.jpg"/>
        <style>
          <![CDATA[
          :root {
            --primary: #ff66cc;
            --primary-hover: #e04bb0;
            --primary-bg: #fff2fa;
            --secondary: #30ad91;
            --bg: #f7f8fa;
            --card-bg: #ffffff;
            --text-main: #2d3748;
            --text-muted: #718096;
            --border: #e2e8f0;
            --tag-bg: #edf2f7;
            --tag-text: #4a5568;
            --shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --primary: #ff77d4;
              --primary-hover: #ff94e0;
              --primary-bg: #301729;
              --secondary: #3dd9b6;
              --bg: #121316;
              --card-bg: #1c1e24;
              --text-main: #edf2f7;
              --text-muted: #a0aec0;
              --border: #2d3748;
              --tag-bg: #2d3748;
              --tag-text: #cbd5e0;
              --shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
            background: var(--bg);
            color: var(--text-main);
            line-height: 1.6;
            padding: 30px 16px 80px;
          }
          .container {
            max-width: 860px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
          }
          .avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 2px solid var(--primary);
            object-fit: cover;
          }
          .header-info h1 {
            font-size: 1.6rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .badge {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;
            background: var(--primary-bg);
            color: var(--primary);
            border: 1px solid var(--primary);
          }
          .header-info p {
            font-size: 0.95rem;
            color: var(--text-muted);
            margin-top: 4px;
          }
          .guide-box {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-left: 5px solid var(--primary);
            border-radius: 12px;
            padding: 22px 24px;
            margin-bottom: 32px;
            box-shadow: var(--shadow);
          }
          .guide-box h2 {
            font-size: 1.15rem;
            margin-bottom: 8px;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .guide-box p {
            font-size: 0.92rem;
            color: var(--text-muted);
            margin-bottom: 16px;
          }
          .copy-bar {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .url-input {
            flex: 1;
            min-width: 260px;
            padding: 10px 14px;
            font-family: monospace;
            font-size: 0.9rem;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-main);
            outline: none;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 18px;
            font-size: 0.9rem;
            font-weight: 600;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .btn-primary {
            background: var(--primary);
            color: #ffffff;
          }
          .btn-primary:hover {
            background: var(--primary-hover);
          }
          .btn-outline {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-main);
          }
          .btn-outline:hover {
            border-color: var(--primary);
            color: var(--primary);
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .posts-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .post-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px 24px;
            box-shadow: var(--shadow);
            transition: transform 0.15s ease, border-color 0.15s ease;
          }
          .post-card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
          }
          .post-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 8px;
          }
          .post-title {
            font-size: 1.15rem;
            font-weight: 600;
            color: var(--text-main);
            text-decoration: none;
          }
          .post-title:hover {
            color: var(--primary);
          }
          .post-date {
            font-size: 0.85rem;
            color: var(--text-muted);
            white-space: nowrap;
          }
          .post-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 10px;
          }
          .tag {
            font-size: 0.75rem;
            padding: 2px 8px;
            border-radius: 4px;
            background: var(--tag-bg);
            color: var(--tag-text);
          }
          .post-summary {
            font-size: 0.9rem;
            color: var(--text-muted);
            line-height: 1.6;
          }
          .footer {
            margin-top: 48px;
            text-align: center;
            font-size: 0.85rem;
            color: var(--text-muted);
          }
          .footer a {
            color: var(--primary);
            text-decoration: none;
          }
          ]]>
        </style>
      </head>
      <body>
        <div class="container">
          <header class="header">
            <img src="/avatar.jpg" alt="Avatar" class="avatar"/>
            <div class="header-info">
              <h1>
                <xsl:value-of select="atom:feed/atom:title | rss/channel/title"/>
                <span class="badge">RSS / Atom Feed</span>
              </h1>
              <p>
                <xsl:value-of select="atom:feed/atom:subtitle | rss/channel/description"/>
              </p>
            </div>
          </header>

          <section class="guide-box">
            <h2>💡 如何订阅本站？</h2>
            <p>这是一个网络订阅源（Web Feed）。请将下方链接复制到你的 RSS 阅读器（例如 Follow、NetNewsWire、Feedly、Inoreader 或 Reeder）中，即可在发布新文章时自动获取提醒。</p>
            <div class="copy-bar">
              <input type="text" id="feedUrl" class="url-input" readonly="readonly" value="https://ff66ccff.github.io/atom.xml"/>
              <button class="btn btn-primary" id="copyBtn" onclick="copyFeedUrl()">复制订阅地址</button>
              <a href="/" class="btn btn-outline">返回博客首页</a>
            </div>
          </section>

          <main>
            <div class="section-title">
              <span>最新文章</span>
              <span style="font-size: 0.85rem; font-weight: normal; color: var(--text-muted);">
                共 <xsl:value-of select="count(atom:feed/atom:entry | rss/channel/item)"/> 篇
              </span>
            </div>

            <div class="posts-list">
              <xsl:for-each select="atom:feed/atom:entry | rss/channel/item">
                <article class="post-card">
                  <div class="post-header">
                    <a class="post-title" target="_blank">
                      <xsl:attribute name="href">
                        <xsl:value-of select="atom:link/@href | link"/>
                      </xsl:attribute>
                      <xsl:value-of select="atom:title | title"/>
                    </a>
                    <span class="post-date">
                      <xsl:value-of select="substring(atom:published | pubDate | atom:updated, 1, 10)"/>
                    </span>
                  </div>

                  <xsl:if test="atom:category | category">
                    <div class="post-tags">
                      <xsl:for-each select="atom:category | category">
                        <span class="tag">
                          <xsl:value-of select="@term | text()"/>
                        </span>
                      </xsl:for-each>
                    </div>
                  </xsl:if>

                  <p class="post-summary">
                    <xsl:value-of select="atom:summary | description"/>
                  </p>
                </article>
              </xsl:for-each>
            </div>
          </main>

          <footer class="footer">
            <p>© <xsl:value-of select="substring(atom:feed/atom:updated | rss/channel/lastBuildDate, 1, 4)"/> <xsl:value-of select="atom:feed/atom:author/atom:name | rss/channel/title"/> · Powered by Hexo &amp; Atom Feed</p>
          </footer>
        </div>

        <script>
          <![CDATA[
          function copyFeedUrl() {
            var input = document.getElementById('feedUrl');
            input.select();
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(input.value).then(function() {
                showCopied();
              }).catch(function() {
                document.execCommand('copy');
                showCopied();
              });
            } else {
              document.execCommand('copy');
              showCopied();
            }
          }
          function showCopied() {
            var btn = document.getElementById('copyBtn');
            var originalText = btn.textContent;
            btn.textContent = '已复制！✓';
            btn.style.background = 'var(--secondary)';
            setTimeout(function() {
              btn.textContent = originalText;
              btn.style.background = '';
            }, 2000);
          }
          if (window.location.href.indexOf('http') === 0) {
            document.getElementById('feedUrl').value = window.location.href.split('?')[0].split('#')[0];
          }
          ]]>
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
