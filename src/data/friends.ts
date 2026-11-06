// 友情链接数据（从 Hexo 时代的 source/_data/friends.yml 迁移）
// 友链的标题、站点、头像、描述与关键词均保持不变。

export interface FriendItem {
	id: number;
	title: string;
	imgurl: string;
	desc: string;
	siteurl: string;
	tags: string[];
}

export const friendsData: FriendItem[] = [
	{
		id: 1,
		title: "The Medical Field of Astepluver",
		imgurl: "https://astepluver.github.io/favicon.svg",
		desc: "基础医学（病原生物学）大四在读：记录细菌耐药性研究路上的学习动态与文献笔记。",
		siteurl: "https://astepluver.github.io/",
		tags: ["基础医学", "病原生物学", "细菌耐药性"],
	},
	{
		id: 2,
		title: "Valproate",
		imgurl: "https://lingyu061126.github.io/images/Image_165853659272824.jpg",
		desc: "一名普通的人类观察员 · 电气专业本科生的学习笔记与碎碎念。",
		siteurl: "https://lingyu061126.github.io/",
		tags: ["电气", "数学", "人类观察"],
	},
	{
		id: 3,
		title: "lalala 的小站",
		imgurl: "https://avatars.githubusercontent.com/u/79189174?v=4",
		desc: "个人知识库与技术小 Wiki · 记录 Rust、C++、开源贡献与极客思考。",
		siteurl: "https://wiki.lalala-233.top/",
		tags: ["Wiki", "Rust", "开源"],
	},
	{
		id: 4,
		title: "Fat Old Eight’s Blog",
		imgurl: "https://avatars.githubusercontent.com/u/87306476?v=4",
		desc: "算法竞赛、数学物理与生活闲话 · OI / Codeforces 题解 / 中文 VOCALOID 同好。",
		siteurl: "https://fat-old-eight.github.io/",
		tags: ["OI", "算法竞赛", "VOCALOID"],
	},
];

export function getFriendsList(): FriendItem[] {
	return friendsData;
}

export function getShuffledFriendsList(): FriendItem[] {
	const shuffled = [...friendsData];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
