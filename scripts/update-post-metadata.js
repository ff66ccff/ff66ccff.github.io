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

const postFiles = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

if (postFiles.length === 0) {
    console.log('No markdown posts found, skipping metadata update.');
    process.exit(0);
}

function getCommitDates(relativePath) {
    try {
        const logOutput = execFileSync('git', ['log', '--follow', '--format=%aI', '--', relativePath], {
            cwd: repoRoot,
            encoding: 'utf8'
        }).trim();

        if (!logOutput) {
            return { first: null, last: null };
        }

        const entries = logOutput.split(/\r?\n/).filter(Boolean);
        const last = entries[0] || null;
        const first = entries[entries.length - 1] || last;
        return { first, last };
    } catch (error) {
        console.warn(`Unable to read commit history for ${relativePath}:`, error.message);
        return { first: null, last: null };
    }
}

function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*(?:\r?\n)([\s\S]*?)(?:\r?\n)---\s*(?:\r?\n)?/;
    const match = content.match(frontMatterRegex);
    if (!match) {
        return { data: {}, order: [], body: content };
    }

    const raw = match[1];
    const lines = raw.split(/\r?\n/);
    const data = {};
    const order = [];

    lines.forEach((line) => {
        if (!line.trim()) {
            return;
        }
        const delimiterIndex = line.indexOf(':');
        if (delimiterIndex === -1) {
            return;
        }
        const key = line.slice(0, delimiterIndex).trim();
        const value = line.slice(delimiterIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        data[key] = value;
        order.push(key);
    });

    const body = content.slice(match[0].length);
    return { data, order, body };
}

function formatValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const stringValue = String(value);
    const escaped = stringValue
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
    return `"${escaped}"`;
}

function buildFrontMatter(data, order, newline) {
    const baseOrder = ['title', 'published', 'updated'];
    const existing = order.filter((key) => !baseOrder.includes(key));
    const seen = new Set();
    const finalOrder = [...baseOrder, ...existing];

    Object.keys(data).forEach((key) => {
        if (!finalOrder.includes(key)) {
            finalOrder.push(key);
        }
    });

    const lines = finalOrder
        .filter((key) => data[key] !== undefined && data[key] !== null && String(data[key]).length > 0)
        .map((key) => `${key}: ${formatValue(data[key])}`);

    if (lines.length === 0) {
        return '';
    }

    return ['---', ...lines, '---'].join(newline);
}

let updatedCount = 0;

postFiles.forEach((fileName) => {
    const relativePath = path.posix.join('posts', fileName);
    const absolutePath = path.join(postsDir, fileName);
    const originalContent = fs.readFileSync(absolutePath, 'utf8');
    const newline = originalContent.includes('\r\n') ? '\r\n' : '\n';

    const { data: frontMatter, order, body } = parseFrontMatter(originalContent);

    const cleanedBody = body.replace(/^\s*/, '');
    const slug = path.basename(fileName, path.extname(fileName));
    const headingMatch = cleanedBody.match(/^#\s+(.+)$/m);
    const title = headingMatch ? headingMatch[1].trim() : slug;

    const { first, last } = getCommitDates(relativePath);

    const metadata = { ...frontMatter };
    metadata.title = title;
    if (first) {
        metadata.published = first;
    }
    if (last) {
        metadata.updated = last;
    }

    const frontMatterBlock = buildFrontMatter(metadata, order, newline);
    if (!frontMatterBlock) {
        return;
    }

    const pieces = [frontMatterBlock];
    if (cleanedBody) {
        pieces.push('', cleanedBody);
    }
    const newContent = pieces.join(newline);
    const normalizedNewContent = newContent.endsWith(newline) ? newContent : newContent + newline;

    if (normalizedNewContent !== originalContent) {
        fs.writeFileSync(absolutePath, normalizedNewContent, 'utf8');
        updatedCount += 1;
        console.log(`Updated metadata for ${relativePath}`);
    }
});

if (updatedCount === 0) {
    console.log('Post metadata already up to date.');
} else {
    console.log(`Metadata updated for ${updatedCount} file(s).`);
}
