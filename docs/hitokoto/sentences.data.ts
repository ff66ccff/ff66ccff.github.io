import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
    watch: ['./sentences.md'],
    load() {
        const filePath = path.resolve(__dirname, 'sentences.md')
        try {
            const content = fs.readFileSync(filePath, 'utf-8')
            return content
                .split(/\r?\n/)
                .filter(line => line.trim().startsWith('- '))
                .map(line => line.trim().replace(/^- /, '').trim())
                .filter(line => line.length > 0)
        } catch (e) {
            return []
        }
    }
}
