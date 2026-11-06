import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");
const MAX_CUSTOM_FONT_BYTES = 8 * 1024 * 1024;
const ASTRO_ASSET_SEGMENT = "/_astro/";
const FONT_REFERENCE_PATTERN =
	/[^\s"'()<>]+?\.(?:woff2?|ttf|otf)(?:[?#][^\s"'()<>]*)?/gi;
const CUSTOM_FONT_VARIABLE_PATTERN =
	/--font-(?:body|cjk|jetbrains-mono)\s*:/;
const STYLE_BLOCK_PATTERN = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

async function collectFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await collectFiles(path)));
		} else {
			files.push(path);
		}
	}

	return files;
}

function resolveAstroAssetPath(reference) {
	let pathname = reference;
	if (/^(?:https?:)?\/\//i.test(reference)) {
		try {
			pathname = new URL(reference, "https://assets.invalid").pathname;
		} catch {
			return undefined;
		}
	} else {
		pathname = reference.split(/[?#]/, 1)[0];
	}

	try {
		pathname = decodeURIComponent(pathname).replace(/\\/g, "/");
	} catch {
		return undefined;
	}

	const segmentIndex = pathname.indexOf(ASTRO_ASSET_SEGMENT);
	const relativePath =
		segmentIndex >= 0
			? pathname.slice(segmentIndex + 1)
			: pathname.startsWith("_astro/")
				? pathname
				: undefined;
	if (!relativePath) return undefined;

	return join(distDir, ...relativePath.split("/"));
}

function getCustomFontBlocks(path, content) {
	if (extname(path) === ".css") {
		return CUSTOM_FONT_VARIABLE_PATTERN.test(content) ? [content] : [];
	}

	return [...content.matchAll(STYLE_BLOCK_PATTERN)]
		.map((match) => match[1])
		.filter((block) => CUSTOM_FONT_VARIABLE_PATTERN.test(block));
}

const outputFiles = await collectFiles(distDir);
const searchableFiles = outputFiles.filter((path) =>
	[".html", ".css"].includes(extname(path)),
);
const customFontReferences = [];

for (const path of searchableFiles) {
	const content = await readFile(path, "utf8");
	for (const block of getCustomFontBlocks(path, content)) {
		for (const match of block.matchAll(FONT_REFERENCE_PATTERN)) {
			const assetPath = resolveAstroAssetPath(match[0]);
			if (assetPath) {
				customFontReferences.push({ path, url: match[0], assetPath });
			}
		}
	}
}

const ttfReferences = customFontReferences.filter(({ url }) =>
	/\.ttf(?:$|[?#])/i.test(url),
);
if (ttfReferences.length > 0) {
	throw new Error(
		`Custom TTF references are not allowed:\n${ttfReferences
			.map(({ path, url }) => `- ${path}: ${url}`)
			.join("\n")}`,
	);
}

const referencedFontFiles = new Map();
for (const reference of customFontReferences) {
	referencedFontFiles.set(reference.assetPath, reference.url);
}

let customFontBytes = 0;
for (const [path, url] of referencedFontFiles) {
	try {
		const file = await stat(path);
		if (!file.isFile()) {
			throw new Error(`Referenced custom font is not a file: ${url}`);
		}
		customFontBytes += file.size;
	} catch (error) {
		if (error?.code === "ENOENT") {
			throw new Error(`Referenced custom font asset was not emitted: ${url}`);
		}
		throw error;
	}
}

if (customFontBytes > MAX_CUSTOM_FONT_BYTES) {
	throw new Error(
		`Custom font output is ${customFontBytes} bytes; budget is ${MAX_CUSTOM_FONT_BYTES} bytes.`,
	);
}

if (
	process.env.MIZUKI_FONT_MODE === "system" &&
	customFontReferences.length > 0
) {
	throw new Error("System font mode must not emit Astro custom font references.");
}

console.log(
	`Font loading check passed: ${customFontReferences.length} references, ${referencedFontFiles.size} files, ${customFontBytes} bytes.`,
);
