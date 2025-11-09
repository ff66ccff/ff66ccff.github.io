# 让网页拥有 WinUI 风格的光影效果

这篇文章记录了我在这个站点上实现“光晕追随”效果的过程，灵感来自 WinUI 的亚克力材质和 Fluent Design。

## 场景需求

1. 鼠标悬停在卡片上时，表面应该出现柔和的光晕。
2. 光晕同时受鼠标位置影响，让动效看起来更有层次感。
3. 非悬停区域需要做全局追随，营造空间感。

## 样式准备

```css
.hover-surface::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
        220px circle at var(--pointer-x, -100px) var(--pointer-y, -100px),
        rgba(255, 255, 255, 0.35),
        transparent 70%
    );
    opacity: 0;
    transition: opacity 0.25s ease;
    pointer-events: none;
    border-radius: inherit;
    mix-blend-mode: screen;
}
```

这段 CSS 的核心是利用自定义属性传递鼠标位置，然后用 `radial-gradient` 得到柔和光圈。

## JavaScript 逻辑

```javascript
const surfaces = document.querySelectorAll('.hover-surface');

surfaces.forEach(surface => {
    surface.addEventListener('pointermove', event => {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        surface.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    });
});
```

这段代码让每个卡片都能知道指针在其内部的相对位置，并即时更新。

## 收获

- CSS 自定义属性可以天然地实现“父子通信”。
- `mix-blend-mode: screen` 是调出柔光质感的小诀窍。
- 在移动端要注意 `touchmove` 的性能，记得加上 `{ passive: true }`。

下一步想把这个效果包装成一个小型组件，方便在其他页面复用。
