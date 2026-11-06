import type { SiteConfig } from "../types/config";

export type FontMode = "custom" | "system";

export function resolveFontMode(
	config: SiteConfig,
	environmentMode = process.env.MIZUKI_FONT_MODE,
): FontMode {
	const mode = environmentMode ?? config.font?.mode ?? "custom";

	if (mode !== "custom" && mode !== "system") {
		throw new Error(
			`Invalid font mode "${mode}". Expected "custom" or "system".`,
		);
	}

	return mode;
}
