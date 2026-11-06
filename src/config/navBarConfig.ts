import type { NavBarConfig } from "../types/config";
import { LinkPreset } from "../types/config";

// 导航栏：保持旧站的核心入口（首页 / 归档 / 友链 / 关于）
export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.Friends,
		LinkPreset.About,
	],
};
