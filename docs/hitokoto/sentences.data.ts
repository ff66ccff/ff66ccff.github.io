import fs from 'node:fs'
import path from 'node:path'

export default {
    watch: ['./sentences.md'],
    load() {
        // 尝试从项目根目录解析路径
        const filePath = path.resolve(process.cwd(), 'docs/hitokoto/sentences.md')
        try {
            const content = fs.readFileSync(filePath, 'utf-8')
            return content
                .split(/\r?\n/)
                .filter(line => line.trim().startsWith('- '))
                .map(line => line.trim().replace(/^- /, '').trim())
                .filter(line => line.length > 0)
        } catch (e) {
            console.error('Failed to load sentences.md:', e)
            return []
        }
    }
}