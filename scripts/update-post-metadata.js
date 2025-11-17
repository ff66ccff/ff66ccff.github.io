#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, 'posts');

if (!fs.existsSync(postsDir)) {
    console.error('No posts directory found, skipping metadata update.');
    process.exit(0);
}

const postFiles = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md') && file !== 'metadata.json');

if (postFiles.length === 0) {
    console.log('No markdown posts found, skipping metadata update.');
    process.exit(0);
}

function getCommitDates(relativePath) {
    try {
        const logOutput = execFileSync('git', ['log', '--follow', '--format=%H%x09%aI%x09%s', '--', relativePath], {
            cwd: repoRoot,
            encoding: 'utf8'
        }).trim();

        if (!logOutput) {
            return { first: null, last: null };
        }

        const entries = logOutput.split(/\r?\n/).filter(Boolean).map((line) => {
            const [hash, isoDate, ...subjectParts] = line.split('\t');
            const subject = subjectParts.join('\t');
            return { hash, isoDate: isoDate || null, subject: subject.trim() };
        });

        if (!entries.length) {
            return { first: null, last: null };
        }

        const isMetadataCommit = (subject) => /^chore:\s*refresh post metadata$/i.test(subject);
        const meaningful = entries.filter((entry) => entry.isoDate && !isMetadataCommit(entry.subject));

        const lastEntry = meaningful[0] || entries[0];
        const firstEntry = meaningful.length ? meaningful[meaningful.length - 1] : entries[entries.length - 1];

        return {
            first: firstEntry?.isoDate || null,
            last: lastEntry?.isoDate || null
        };
    } catch (error) {
        console.warn(`Unable to read commit history for ${relativePath}:`, error.message);
        return { first: null, last: null };
    }
}

function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*(?:\r?\n)([\s\S]*?)(?:\r?\n)---\s*(?:\r?\n)?/;
    const match = content.match(frontMatterRegex);
    if (!match) {
        return { data: {}, body: content };
    }

    const raw = match[1];
    const lines = raw.split(/\r?\n/);
    const data = {};

    lines.forEach((line) => {
        if (!line.trim()) {
            return;
        }
        const delimiterIndex = line.indexOf(':');
        if (delimiterIndex === -1) {
            return;
        }
        const key = line.slice(0, delimiterIndex).trim();
        const value = line.slice(delimiterIndex + 1).trim().replace(/^["']|["']$/g, '');
        data[key] = value;
    });

    const body = content.slice(match[0].length);
    return { data, body };
}

const metadataEntries = [];

postFiles.forEach((fileName) => {
    const relativePath = path.posix.join('posts', fileName);
    const absolutePath = path.join(postsDir, fileName);
    const originalContent = fs.readFileSync(absolutePath, 'utf8');

    const { data: frontMatter, body } = parseFrontMatter(originalContent);

    const cleanedBody = body.replace(/^\s*/, '');
    const slug = path.basename(fileName, path.extname(fileName));
    const titleFromFrontMatter = frontMatter.title ? frontMatter.title.trim() : '';
    const headingMatch = cleanedBody.match(/^#\s+(.+)$/m);
    const derivedTitle = headingMatch ? headingMatch[1].trim() : '';
    const title = titleFromFrontMatter || derivedTitle || slug;

    const { first, last } = getCommitDates(relativePath);

    const published = first || frontMatter.published || null;
    const updated = last || frontMatter.updated || published || null;

    // simple summary extractor: strip code blocks and basic markdown, take first paragraph
    function extractSummary(text) {
        if (!text) return '';
        const withoutCode = text.replace(/```[\s\S]*?```/g, '');
        const withoutInline = withoutCode.replace(/`[^`]+`/g, '');
        const withoutTags = withoutInline.replace(/<[^>]+>/g, '');
        const lines = withoutTags.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) return '';
        const first = lines[0];
        return first.length > 160 ? `${first.slice(0, 160)}...` : first;
    }

    const summary = extractSummary(body).trim() || (frontMatter.summary ? String(frontMatter.summary).trim() : '');

    metadataEntries.push({
        slug,
        filename: fileName,
        title,
        published,
        updated,
        summary
    });
});

metadataEntries.sort((a, b) => {
    const aTime = a.updated ? Date.parse(a.updated) : (a.published ? Date.parse(a.published) : 0);
    const bTime = b.updated ? Date.parse(b.updated) : (b.published ? Date.parse(b.published) : 0);
    if (bTime !== aTime) {
        return bTime - aTime;
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) || a.slug.localeCompare(b.slug);
});

const metadataPayload = {
    generatedAt: new Date().toISOString(),
    posts: metadataEntries
};

const metadataPath = path.join(postsDir, 'metadata.json');
const metadataJson = `${JSON.stringify(metadataPayload, null, 2)}\n`;
let existingMetadata = '';
try {
    existingMetadata = fs.readFileSync(metadataPath, 'utf8');
} catch (error) {
    if (error.code !== 'ENOENT') {
        console.warn('Unable to read existing metadata manifest:', error.message);
    }
}

if (existingMetadata !== metadataJson) {
    fs.writeFileSync(metadataPath, metadataJson, 'utf8');
    console.log('Updated posts metadata manifest.');
}

// Also write a lightweight search index to speed up client-side search
try {
    const searchIndex = metadataEntries.map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary || '',
        filename: entry.filename
    }));
    const searchPath = path.join(postsDir, 'search-index.json');
    const searchJson = `${JSON.stringify({ generatedAt: new Date().toISOString(), items: searchIndex }, null, 2)}\n`;
    let existingSearch = '';
    try { existingSearch = fs.readFileSync(searchPath, 'utf8'); } catch (e) { /* ignore */ }
    if (existingSearch !== searchJson) {
        fs.writeFileSync(searchPath, searchJson, 'utf8');
        console.log('Wrote posts/search-index.json for client search.');
    }
} catch (error) {
    console.warn('Unable to write search-index.json:', error && error.message);
}
