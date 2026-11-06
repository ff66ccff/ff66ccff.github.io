# Third-Party Notices

This project includes portions adapted from the following open-source project.

## Firefly

- Source: https://github.com/CuteLeaf/Firefly
- License: MIT License
- Usage: Markdown code groups, Wiki Link processing, PlantUML rendering and related interaction/styles were adapted and modified for Mizuki.

The affected files are:

- `src/components/features/markdown/CodeGroupManager.astro`
- `src/components/features/markdown/DiagramManager.astro`
- `src/plugins/remark-wiki-link.mjs`
- `src/plugins/plantuml-encoder.mjs`
- `src/plugins/remark-plantuml.mjs`
- `src/plugins/rehype-plantuml.mjs`
- The `rehype-code-group` section in `src/styles/expressive-code.css`

### Firefly MIT License

MIT License

Copyright (c) 2024 saicaca  
Copyright (c) 2025 CuteLeaf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
