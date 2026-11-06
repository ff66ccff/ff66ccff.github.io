import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Font, ttftowoff2, woff2 } from "fonteditor-core";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fonts = [
	["ZenMaruGothic-Medium.ttf", "ZenMaruGothic-Medium.woff2"],
	["loli.ttf", "loli.woff2"],
];

function exactArrayBuffer(buffer) {
	return buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength,
	);
}

function glyphDigest(font) {
	const hash = createHash("sha256");
	for (const glyph of font.glyf) hash.update(JSON.stringify(glyph));
	return hash.digest("hex");
}

function assertEquivalentFont(source, output, targetName) {
	const readOptions = { hinting: true, kerning: true };
	const original = Font.create(source, { ...readOptions, type: "ttf" }).get();
	const compressed = Font.create(output, {
		...readOptions,
		type: "woff2",
	}).get();

	if (
		original.glyf.length !== compressed.glyf.length ||
		original.head.unitsPerEm !== compressed.head.unitsPerEm ||
		JSON.stringify(original.name) !== JSON.stringify(compressed.name) ||
		glyphDigest(original) !== glyphDigest(compressed)
	) {
		throw new Error(`${targetName} changed font names, metrics, or glyph data`);
	}
}

await woff2.init();

for (const [sourceName, targetName] of fonts) {
	const sourcePath = resolve(projectRoot, "src", "assets", "fonts", sourceName);
	const targetPath = resolve(projectRoot, "src", "assets", "fonts", targetName);
	const source = await readFile(sourcePath);
	const output = Buffer.from(ttftowoff2(exactArrayBuffer(source)));

	if (output.subarray(0, 4).toString("ascii") !== "wOF2") {
		throw new Error(`${targetName} does not have a valid WOFF2 signature`);
	}
	if (output.length >= source.length) {
		throw new Error(`${targetName} is not smaller than its TTF source`);
	}

	assertEquivalentFont(source, output, targetName);

	await writeFile(targetPath, output);
	console.log(
		`${sourceName} -> ${targetName}: ${source.length} -> ${output.length} bytes`,
	);
}
