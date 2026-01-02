/**
 * 自动为缺少 frontmatter 的 Markdown 文章添加元数据
 * 在 GitHub Actions 构建之前运行
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const POSTS_DIR = path.join(process.cwd(), 'docs', 'posts')

// 递归获取所有 .md 文件
function getAllMarkdownFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            getAllMarkdownFiles(fullPath, files)
        } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
            files.push(fullPath)
        }
    }

    return files
}

// 检查文件是否有 frontmatter
function hasFrontmatter(content) {
    return content.trimStart().startsWith('---')
}

// 检查 frontmatter 是否有 published 字段
function hasPublishedField(content) {
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/)
    if (!frontmatterMatch) return false
    return /^published:/m.test(frontmatterMatch[1])
}

// 从文件名提取标题（去掉扩展名和特殊字符标记如 [BGM]）
function extractTitle(filePath) {
    const fileName = path.basename(filePath, '.md')
    // 移除类似 [BGM] 这样的标记作为显示标题
    return fileName.replace(/\[.*?\]/g, '').trim() || fileName
}

// 获取文件的 git 首次提交时间，如果没有则使用当前时间
function getPublishDate(filePath) {
    try {
        // 尝试获取文件首次被 git 追踪的时间
        const gitDate = execSync(
            `git log --follow --format=%aI --diff-filter=A -- "${filePath}"`,
            { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim()

        if (gitDate) {
            return gitDate.split('\n').pop() // 获取最早的日期
        }
    } catch (e) {
        // git 命令失败，使用文件修改时间
    }

    // 回退：使用文件修改时间或当前时间
    try {
        const stats = fs.statSync(filePath)
        return stats.mtime.toISOString()
    } catch (e) {
        return new Date().toISOString()
    }
}

// 为文件添加或补充 frontmatter
function addFrontmatter(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8')
    const title = extractTitle(filePath)
    const publishDate = getPublishDate(filePath)

    if (!hasFrontmatter(content)) {
        // 没有 frontmatter，添加完整的
        const frontmatter = `---
title: "${title}"
published: "${publishDate}"
---

`
        content = frontmatter + content
        fs.writeFileSync(filePath, content, 'utf-8')
        console.log(`✅ 添加 frontmatter: ${path.relative(POSTS_DIR, filePath)}`)
        return true
    } else if (!hasPublishedField(content)) {
        // 有 frontmatter 但缺少 published 字段，添加它
        content = content.replace(
            /^(---\s*\n)/,
            `$1title: "${title}"\npublished: "${publishDate}"\n`
        )
        fs.writeFileSync(filePath, content, 'utf-8')
        console.log(`✅ 补充 published 字段: ${path.relative(POSTS_DIR, filePath)}`)
        return true
    }

    return false
}

// 主函数
function main() {
    console.log('🔍 扫描文章目录...')

    if (!fs.existsSync(POSTS_DIR)) {
        console.log('❌ 文章目录不存在:', POSTS_DIR)
        process.exit(1)
    }

    const files = getAllMarkdownFiles(POSTS_DIR)
    console.log(`📄 找到 ${files.length} 篇文章`)

    let updated = 0
    for (const file of files) {
        if (addFrontmatter(file)) {
            updated++
        }
    }

    if (updated > 0) {
        console.log(`\n✨ 共更新 ${updated} 篇文章的 frontmatter`)
    } else {
        console.log('\n✨ 所有文章都已有完整的 frontmatter')
    }
}

main()
