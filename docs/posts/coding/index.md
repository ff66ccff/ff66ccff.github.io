<script setup>
import { data } from '../../posts.data.ts'

const codingPosts = data.filter((post) => post.url.startsWith('/posts/coding/'))
</script>

# 编程

这里是关于编程的文章。

<ul class="post-list">
	<li v-for="post in codingPosts" :key="post.url" class="post-item">
		<a :href="post.url" class="post-link">{{ post.title }}</a>
		<span class="post-date">{{ post.date.string }}</span>
	</li>
</ul>

<style>
.post-list {
	list-style: none;
	padding: 0;
	margin: 16px 0 0;
	display: grid;
	gap: 12px;
}

.post-item {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	padding: 12px 16px;
	border-radius: 10px;
	background: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-bg-soft);
	transition: border-color 0.2s ease, transform 0.2s ease;
}

.post-item:hover {
	border-color: var(--vp-c-brand-1);
	transform: translateY(-2px);
}

.post-link {
	color: var(--vp-c-text-1);
	font-weight: 600;
	text-decoration: none;
}

.post-link:hover {
	color: var(--vp-c-brand-1);
}

.post-date {
	color: var(--vp-c-text-3);
	font-size: 0.9rem;
	white-space: nowrap;
}
</style>
