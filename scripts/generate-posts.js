const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(process.cwd(), 'posts');
const OUTPUT_FILE = path.join(process.cwd(), 'posts.json');

function isMarkdown(filename) {
    return filename.toLowerCase().endsWith('.md');
}

function extractTitle(content, fallback) {
    const lines = content.split(/\r?\n/);
    const heading = lines.find((line) => line.trim().startsWith('# '));
    if (!heading) {
        return fallback;
    }
    return heading.replace(/^#\s+/, '').trim() || fallback;
}

function extractDate(filename, stats) {
    const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-.+/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    const date = stats.birthtime instanceof Date ? stats.birthtime : new Date();
    return date.toISOString().split('T')[0];
}

function stripMarkdown(text) {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[_*~>#-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildSnippet(content) {
    const plain = stripMarkdown(content);
    return plain.slice(0, 100);
}

function collectPosts() {
    if (!fs.existsSync(POSTS_DIR)) {
        return [];
    }
    const entries = fs.readdirSync(POSTS_DIR);
    return entries
        .filter(isMarkdown)
        .map((file) => {
            const fullPath = path.join(POSTS_DIR, file);
            const stats = fs.statSync(fullPath);
            const raw = fs.readFileSync(fullPath, 'utf8');
            return {
                title: extractTitle(raw, file.replace(/\.md$/i, '')),
                date: extractDate(file, stats),
                path: path.posix.join('posts', file),
                snippet: buildSnippet(raw)
            };
        })
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function writeOutput(posts) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

function main() {
    try {
        const posts = collectPosts();
        writeOutput(posts);
        console.log('Successfully generated posts.json');
    } catch (error) {
        console.error('Failed to generate posts.json:', error);
        process.exitCode = 1;
    }
}

main();
