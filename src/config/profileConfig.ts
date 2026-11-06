import type { ProfileConfig } from "../types/config";

// 个人资料配置（与迁移前保持一致）
export const profileConfig: ProfileConfig = {
	avatar: "/avatar.webp",
	name: "ff66ccff",
	bio: "代码 · VOCALOID · 科幻。四川大学计算机，记录技术与生活。",
	typewriter: {
		enable: true,
		speed: 60,
	},
	links: [
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/ff66ccff",
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/atom.xml",
		},
		{
			name: "网易云音乐",
			icon: "fa7-solid:headphones",
			url: "https://music.163.com/#/playlist?id=3061115045",
		},
	],
};
