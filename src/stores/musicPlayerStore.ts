import Key from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";

import {
	DEFAULT_COVER_URL,
	DEFAULT_SONG,
	LOCAL_PLAYLIST,
	SKIP_ERROR_DELAY,
	STORAGE_KEY_VOLUME,
} from "@/components/widgets/music-player/constants";
import type { RepeatMode, Song } from "@/components/widgets/music-player/types";
import { musicPlayerConfig } from "@/config";
import { resolveAssetUrl } from "@/utils/asset-url";

export interface MusicPlayerState {
	currentSong: Song;
	playlist: Song[];
	currentIndex: number;
	isPlaying: boolean;
	isLoading: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMuted: boolean;
	isShuffled: boolean;
	isRepeating: RepeatMode;
	showPlaylist: boolean;
	errorMessage: string;
	showError: boolean;
	isExpanded: boolean;
	isHidden: boolean;
	autoplayFailed: boolean;
	willAutoPlay: boolean;
}

class MusicPlayerStore {
	private audio: HTMLAudioElement | null = null;
	private state: MusicPlayerState;
	private isInitialized = false;
	private unregisterInteraction: (() => void) | undefined;
	private listeners = new Set<(state: MusicPlayerState) => void>();
	private loadedSourceUrl = "";
	private pendingSeekTime: number | null = null;
	private playbackErrorCount = 0;
	private errorRetryTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.state = this.createInitialState();
	}

	private createInitialState(): MusicPlayerState {
		return {
			currentSong: { ...DEFAULT_SONG },
			playlist: [],
			currentIndex: 0,
			isPlaying: false,
			isLoading: false,
			currentTime: 0,
			duration: 0,
			volume: 0.7,
			isMuted: false,
			isShuffled: false,
			isRepeating: 0,
			showPlaylist: false,
			errorMessage: "",
			showError: false,
			isExpanded: false,
			isHidden: false,
			autoplayFailed: false,
			willAutoPlay: false,
		};
	}

	private createSnapshot(): MusicPlayerState {
		return {
			...this.state,
			currentSong: { ...this.state.currentSong },
			playlist: this.state.playlist.map((song) => ({ ...song })),
		};
	}

	getState(): MusicPlayerState {
		return this.createSnapshot();
	}

	getAudio(): HTMLAudioElement | null {
		return this.audio;
	}

	subscribe(listener: (state: MusicPlayerState) => void): () => void {
		this.listeners.add(listener);
		listener(this.createSnapshot());
		return () => {
			this.listeners.delete(listener);
		};
	}

	async initialize(): Promise<void> {
		if (typeof window === "undefined" || this.isInitialized) {
			return;
		}
		this.isInitialized = true;

		if (!musicPlayerConfig.enable) {
			return;
		}

		this.audio = new Audio();
		this.audio.preload = "none";
		this.setupAudioListeners();
		this.loadVolumeFromStorage();
		this.registerInteractionHandler();
		await this.loadPlaylist();
	}

	private setupAudioListeners(): void {
		if (!this.audio) {
			return;
		}

		this.audio.volume = this.state.volume;
		this.audio.muted = this.state.isMuted;

		this.audio.addEventListener("play", () => {
			this.state.isPlaying = true;
			this.state.autoplayFailed = false;
			this.broadcastState();
		});

		this.audio.addEventListener("pause", () => {
			this.state.isPlaying = false;
			this.broadcastState();
		});

		this.audio.addEventListener("timeupdate", () => {
			if (this.audio) {
				this.state.currentTime = this.audio.currentTime;
				this.broadcastState();
			}
		});

		this.audio.addEventListener("ended", () => {
			this.handleAudioEnded();
		});

		this.audio.addEventListener("error", () => {
			this.handleAudioError();
		});

		this.audio.addEventListener("loadeddata", () => {
			this.handleAudioLoaded();
		});

		this.audio.addEventListener("loadstart", () => {
			this.state.isLoading = true;
			this.broadcastState();
		});
	}

	private handleAudioEnded(): void {
		if (this.state.isRepeating === 1) {
			if (this.audio) {
				this.audio.currentTime = 0;
				this.audio.play().catch(() => {});
			}
			this.broadcastState();
		} else {
			this.next(true);
		}
	}

	private handleAudioError(): void {
		this.state.isLoading = false;
		this.state.isPlaying = false;
		this.showError(i18n(Key.musicPlayerErrorSong));
		if (this.errorRetryTimer !== null) {
			return;
		}

		this.playbackErrorCount += 1;
		const maxAttempts = Math.max(1, this.state.playlist.length);
		if (
			this.state.willAutoPlay &&
			this.state.playlist.length > 1 &&
			this.playbackErrorCount < maxAttempts
		) {
			this.errorRetryTimer = setTimeout(() => {
				this.errorRetryTimer = null;
				if (!this.state.willAutoPlay) {
					return;
				}
				this.advanceToNext(true);
			}, SKIP_ERROR_DELAY);
		} else {
			this.state.willAutoPlay = false;
		}
		this.broadcastState();
	}

	private handleAudioLoaded(): void {
		this.state.isLoading = false;
		if (this.audio?.duration && this.audio.duration > 1) {
			this.state.duration = Math.floor(this.audio.duration);
			this.state.currentSong = {
				...this.state.currentSong,
				duration: this.state.duration,
			};
		}

		if (this.audio && this.pendingSeekTime !== null) {
			const seekTime = Math.min(this.pendingSeekTime, this.state.duration);
			this.audio.currentTime = seekTime;
			this.state.currentTime = seekTime;
			this.pendingSeekTime = null;
		}
		this.broadcastState();
	}

	private loadVolumeFromStorage(): void {
		if (typeof localStorage !== "undefined") {
			const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
			if (savedVolume) {
				const volume = Number.parseFloat(savedVolume);
				if (!Number.isNaN(volume) && volume >= 0 && volume <= 1) {
					this.state.volume = volume;
					this.state.isMuted = volume === 0;
					if (this.audio) {
						this.audio.volume = volume;
						this.audio.muted = this.state.isMuted;
					}
				}
			}
		}
	}

	private registerInteractionHandler(): void {
		const handler = () => {
			if (this.state.autoplayFailed) {
				this.requestPlayback(false);
			}
		};
		document.addEventListener("click", handler, { once: true });
		document.addEventListener("keydown", handler, { once: true });
		this.unregisterInteraction = () => {
			document.removeEventListener("click", handler);
			document.removeEventListener("keydown", handler);
		};
	}

	private async loadPlaylist(): Promise<void> {
		const mode = musicPlayerConfig.mode ?? "meting";
		const meting_api =
			musicPlayerConfig.meting_api ??
			"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
		const meting_id = musicPlayerConfig.id ?? "14164869977";
		const meting_server = musicPlayerConfig.server ?? "netease";
		const meting_type = musicPlayerConfig.type ?? "playlist";

		if (mode === "meting") {
			await this.fetchMetingPlaylist(
				meting_api,
				meting_server,
				meting_type,
				meting_id,
			);
		} else {
			this.loadLocalPlaylist();
		}
	}

	private async fetchMetingPlaylist(
		api: string,
		server: string,
		type: string,
		id: string,
	): Promise<void> {
		if (!api || !id) {
			return;
		}

		this.state.isLoading = true;
		this.broadcastState();

		const apiUrl = api
			.replace(":server", server)
			.replace(":type", type)
			.replace(":id", id)
			.replace(":auth", "")
			.replace(":r", Date.now().toString());

		try {
			const res = await fetch(apiUrl);
			if (!res.ok) {
				throw new Error("meting api error");
			}
			const list: Record<string, unknown>[] = await res.json();
			this.state.playlist = list.map((song) => this.convertMetingSong(song));
			this.state.isLoading = false;

			if (this.state.playlist.length > 0) {
				this.selectSong(this.state.playlist[0], false);
			}
		} catch (_e) {
			this.showError(i18n(Key.musicPlayerErrorPlaylist));
			this.state.isLoading = false;
		}
		this.broadcastState();
	}

	private convertMetingSong(song: Record<string, unknown>): Song {
		const name = typeof song.name === "string" ? song.name : undefined;
		const songTitle = typeof song.title === "string" ? song.title : undefined;
		const title = name ?? songTitle ?? i18n(Key.unknownSong);
		const artistField =
			typeof song.artist === "string" ? song.artist : undefined;
		const author = typeof song.author === "string" ? song.author : undefined;
		const artist = artistField ?? author ?? i18n(Key.unknownArtist);
		let dur = (song.duration as number | undefined) ?? 0;
		if (typeof dur === "string") {
			dur = Number.parseInt(dur, 10);
		}
		if (dur > 10000) {
			dur = Math.floor(dur / 1000);
		}
		if (!Number.isFinite(dur) || dur <= 0) {
			dur = 0;
		}

		return {
			id:
				typeof song.id === "string"
					? Number.parseInt(song.id, 10)
					: ((song.id as number | undefined) ?? 0),
			title,
			artist,
			cover: (song.pic as string | undefined) || DEFAULT_COVER_URL,
			url: (song.url as string | undefined) ?? "",
			duration: dur,
		};
	}

	private loadLocalPlaylist(): void {
		this.state.playlist = [...LOCAL_PLAYLIST];
		if (this.state.playlist.length === 0) {
			this.showError("本地播放列表为空");
		} else {
			this.selectSong(this.state.playlist[0], false);
		}
	}

	private selectSong(song: Song, autoPlay = true): void {
		if (!song.url) {
			return;
		}
		const songChanged = song.url !== this.state.currentSong.url;
		if (songChanged) {
			this.releaseAudioSource();
			this.state.currentSong = { ...song };
			this.state.currentTime = 0;
			this.state.duration = song.duration;
			this.state.isLoading = false;
			this.pendingSeekTime = null;
		}
		this.state.willAutoPlay = autoPlay;
		if (autoPlay) {
			this.requestPlayback(false);
		}
		this.broadcastState();
	}

	private releaseAudioSource(): void {
		if (!this.audio || !this.loadedSourceUrl) {
			return;
		}
		this.audio.pause();
		this.audio.removeAttribute("src");
		this.audio.load();
		this.loadedSourceUrl = "";
	}

	private ensureAudioSource(): boolean {
		if (!this.audio || !this.state.currentSong.url) {
			return false;
		}

		const sourceUrl = resolveAssetUrl(this.state.currentSong.url);
		if (sourceUrl === this.loadedSourceUrl) {
			return true;
		}

		this.loadedSourceUrl = sourceUrl;
		this.state.isLoading = true;
		this.audio.src = sourceUrl;
		this.audio.load();
		return true;
	}

	private requestPlayback(resetErrorBudget: boolean): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		if (resetErrorBudget) {
			this.resetErrorRetryBudget();
		}
		this.state.willAutoPlay = true;
		if (!this.ensureAudioSource()) {
			return;
		}

		const playPromise = this.audio.play();
		if (playPromise !== undefined) {
			playPromise.catch((error: unknown) => {
				if (error instanceof Error && error.name === "NotAllowedError") {
					this.state.autoplayFailed = true;
					this.state.isPlaying = false;
					this.broadcastState();
				}
			});
		}
	}

	private resetErrorRetryBudget(): void {
		this.playbackErrorCount = 0;
		if (this.errorRetryTimer !== null) {
			clearTimeout(this.errorRetryTimer);
			this.errorRetryTimer = null;
		}
	}

	private showError(message: string): void {
		this.state.errorMessage = message;
		this.state.showError = true;
		setTimeout(() => {
			this.state.showError = false;
			this.broadcastState();
		}, 3000);
		this.broadcastState();
	}

	hideError(): void {
		this.state.showError = false;
		this.broadcastState();
	}

	toggle(): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		if (this.state.isPlaying) {
			this.state.willAutoPlay = false;
			this.resetErrorRetryBudget();
			this.audio.pause();
		} else {
			this.requestPlayback(true);
		}
	}

	play(): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		this.requestPlayback(true);
	}

	pause(): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		this.state.willAutoPlay = false;
		this.resetErrorRetryBudget();
		this.audio.pause();
	}

	next(autoPlay = true): void {
		this.resetErrorRetryBudget();
		this.advanceToNext(autoPlay);
	}

	private advanceToNext(autoPlay: boolean): void {
		if (this.state.playlist.length <= 1) {
			return;
		}

		let newIndex: number;
		if (this.state.isShuffled) {
			do {
				newIndex = Math.floor(Math.random() * this.state.playlist.length);
			} while (
				newIndex === this.state.currentIndex &&
				this.state.playlist.length > 1
			);
		} else {
			newIndex =
				this.state.currentIndex < this.state.playlist.length - 1
					? this.state.currentIndex + 1
					: 0;
		}

		this.state.currentIndex = newIndex;
		this.selectSong(this.state.playlist[newIndex], autoPlay);
	}

	prev(): void {
		if (this.state.playlist.length <= 1) {
			return;
		}
		this.resetErrorRetryBudget();
		const newIndex =
			this.state.currentIndex > 0
				? this.state.currentIndex - 1
				: this.state.playlist.length - 1;
		this.state.currentIndex = newIndex;
		this.selectSong(this.state.playlist[newIndex], true);
	}

	playIndex(index: number): void {
		if (index < 0 || index >= this.state.playlist.length) {
			return;
		}
		this.resetErrorRetryBudget();
		this.state.currentIndex = index;
		this.selectSong(this.state.playlist[index], true);
	}

	seek(time: number): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		if (time >= 0 && time <= this.state.duration) {
			this.pendingSeekTime = time;
			this.ensureAudioSource();
			if (this.audio.readyState >= 1) {
				this.audio.currentTime = time;
				this.pendingSeekTime = null;
			}
			this.state.currentTime = time;
			this.broadcastState();
		}
	}

	setVolume(volume: number): void {
		const clampedVolume = Math.max(0, Math.min(1, volume));
		this.state.volume = clampedVolume;
		this.state.isMuted = clampedVolume === 0;
		if (this.audio) {
			this.audio.volume = clampedVolume;
			this.audio.muted = this.state.isMuted;
		}
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(STORAGE_KEY_VOLUME, String(clampedVolume));
		}
		this.broadcastState();
	}

	toggleMute(): void {
		this.state.isMuted = !this.state.isMuted;
		if (this.audio) {
			this.audio.muted = this.state.isMuted;
		}
		this.broadcastState();
	}

	toggleShuffle(): void {
		this.state.isShuffled = !this.state.isShuffled;
		if (this.state.isShuffled) {
			this.state.isRepeating = 0;
		}
		this.broadcastState();
	}

	toggleRepeat(): void {
		this.state.isRepeating = ((this.state.isRepeating + 1) % 3) as RepeatMode;
		if (this.state.isRepeating !== 0) {
			this.state.isShuffled = false;
		}
		this.broadcastState();
	}

	toggleMode(): void {
		if (this.state.isShuffled) {
			this.toggleShuffle();
			return;
		}
		if (this.state.isRepeating === 2) {
			this.toggleRepeat();
			this.toggleShuffle();
			return;
		}
		this.toggleRepeat();
	}

	togglePlaylist(): void {
		this.state.showPlaylist = !this.state.showPlaylist;
		this.broadcastState();
	}

	toggleExpanded(): void {
		this.state.isExpanded = !this.state.isExpanded;
		// 保持与原先 usePlayerState.toggleExpandedUI 一致的联动行为：
		// 展开时强制取消隐藏，并关闭播放列表，避免状态组合异常
		if (this.state.isExpanded) {
			this.state.showPlaylist = false;
			this.state.isHidden = false;
		}
		this.broadcastState();
	}

	toggleHidden(): void {
		this.state.isHidden = !this.state.isHidden;
		// 保持与原先 usePlayerState.toggleHiddenUI 一致的联动行为：
		// 隐藏时收起播放器并关闭播放列表，防止展开 UI 悬挂在小球旁边
		if (this.state.isHidden) {
			this.state.isExpanded = false;
			this.state.showPlaylist = false;
		}
		this.broadcastState();
	}

	canSkip(): boolean {
		return this.state.playlist.length > 1;
	}

	setProgress(percent: number): void {
		if (!this.audio || !this.state.currentSong.url) {
			return;
		}
		const newTime = percent * this.state.duration;
		this.seek(newTime);
	}

	private broadcastState(): void {
		const snapshot = this.createSnapshot();

		for (const listener of this.listeners) {
			listener(snapshot);
		}

		if (typeof window === "undefined") {
			return;
		}
		window.dispatchEvent(
			new CustomEvent("music-sidebar:state", {
				detail: snapshot,
			}),
		);
	}

	destroy(): void {
		if (this.unregisterInteraction) {
			this.unregisterInteraction();
		}
		this.resetErrorRetryBudget();
		if (this.audio) {
			this.audio.pause();
			this.audio.removeAttribute("src");
			this.audio = null;
		}
		this.loadedSourceUrl = "";
		this.pendingSeekTime = null;
		this.isInitialized = false;
	}
}

export const musicPlayerStore = new MusicPlayerStore();
