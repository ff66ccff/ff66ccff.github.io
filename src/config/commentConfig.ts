import type { CommentConfig } from "../types/config";
import { SITE_LANG } from "./siteConfig";

// 评论系统：沿用旧站的 giscus 配置（repo / category / pathname mapping 不变）
export const commentConfig: CommentConfig = {
	enable: true,
	system: "giscus",
	giscus: {
		repo: "ff66ccff/ff66ccff.github.io",
		repoId: "R_kgDOQRU2HQ",
		category: "Announcements",
		categoryId: "DIC_kwDOQRU2Hc4C0foj",
		mapping: "pathname",
		strict: "0",
		reactionsEnabled: "1",
		emitMetadata: "0",
		inputPosition: "bottom",
		theme: "preferred_color_scheme",
		lang: SITE_LANG,
		loading: "lazy",
	},
};
