import clCover from "../../../assets/music/cover/cl.webp?url";
import dazbeeCover from "../../../assets/music/cover/dazbee.webp?url";
import hitoriCover from "../../../assets/music/cover/hitori.webp?url";
import xryxCover from "../../../assets/music/cover/xryx.webp?url";
import type { Song } from "./types";

export const STORAGE_KEY_VOLUME = "music-player-volume";

export const DEFAULT_VOLUME = 0.7;

export const DEFAULT_COVER_URL = "/favicon/favicon.png";

export const LOCAL_PLAYLIST: Song[] = [
	{
		id: 1,
		title: "口笛で愛は歌えない",
		artist: "Dazbee",
		cover: dazbeeCover,
		url: "assets/music/url/dazbee.mp3",
		duration: 241,
	},
	{
		id: 2,
		title: "ひとり上手",
		artist: "Kaya",
		cover: hitoriCover,
		url: "assets/music/url/hitori.mp3",
		duration: 253,
	},
	{
		id: 3,
		title: "眩耀夜行",
		artist: "ス리즈ブーケ",
		cover: xryxCover,
		url: "assets/music/url/xryx.mp3",
		duration: 245,
	},
	{
		id: 4,
		title: "春雷の頃",
		artist: "22/7",
		cover: clCover,
		url: "assets/music/url/cl.mp3",
		duration: 242,
	},
];

export const DEFAULT_SONG: Song = {
	title: "Sample Song",
	artist: "Sample Artist",
	cover: DEFAULT_COVER_URL,
	url: "",
	duration: 0,
	id: 0,
};

export const DEFAULT_METING_API =
	"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
export const DEFAULT_METING_ID = "14164869977";
export const DEFAULT_METING_SERVER = "netease";
export const DEFAULT_METING_TYPE = "playlist";

export const ERROR_DISPLAY_DURATION = 3000;
export const SKIP_ERROR_DELAY = 1000;
