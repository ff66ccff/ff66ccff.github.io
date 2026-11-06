import path from "node:path";

const imageFiles = import.meta.glob<ImageMetadata>(
	"../**/*.{avif,gif,jpeg,jpg,png,svg,webp}",
	{ import: "default" },
);

function normalizeKey(value: string): string {
	return value.replace(/\\/g, "/");
}

export function isRemoteImageSource(src: string): boolean {
	return /^(?:https?:)?\/\//.test(src) || src.startsWith("data:");
}

export function publicImageUrl(src: string): string {
	if (isRemoteImageSource(src)) return src;
	if (!src.startsWith("/")) return src;
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	return `${base}${src}` || "/";
}

export async function resolveImageMetadata(
	src: string,
	basePath = "/",
): Promise<ImageMetadata | undefined> {
	if (isRemoteImageSource(src)) return undefined;

	const key = src.startsWith("/")
		? `../assets/public/${src.replace(/^\/+/, "")}`
		: `../${path.posix.join(basePath.replace(/^\/+/, ""), src)}`;
	const loader = imageFiles[normalizeKey(path.posix.normalize(key))];

	return loader ? await loader() : undefined;
}
