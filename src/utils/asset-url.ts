const REMOTE_ASSET_PATTERN = /^(?:https?:)?\/\//i;

export function isRemoteAssetUrl(value: string): boolean {
	return (
		REMOTE_ASSET_PATTERN.test(value) ||
		value.startsWith("data:") ||
		value.startsWith("blob:")
	);
}

export function resolveAssetUrl(value: string): string {
	if (!value || isRemoteAssetUrl(value) || value.startsWith("/")) {
		return value;
	}
	return `/${value}`;
}
