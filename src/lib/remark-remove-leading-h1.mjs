/**
 * 文章页面已经用 {@link PostLayout} 的 h1 展示标题，
 * 而历史文章正文开头还有重复的 “# 标题”。这里在渲染阶段去掉，
 * 保证磁盘上的 Markdown 正文保持原样。
 */
export default function remarkRemoveLeadingH1() {
  return (tree) => {
    const children = tree.children ?? [];
    for (let index = 0; index < Math.min(children.length, 6); index += 1) {
      const node = children[index];
      if (!node || node.type !== 'heading') continue;
      if (node.depth === 1) children.splice(index, 1);
      return;
    }
  };
}
