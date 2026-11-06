#!/usr/bin/env node
// 迁移留档：Hexo -> Astro 的一次性内容迁移脚本。
// 运行前提：仓库中仍存在 Hexo 时代的 source/_posts、source/_data、source/hitokoto 目录
// （这些文件已在迁移完成后删除，可在 git 历史中找回，例如 git show eb2f92e:_config.yml）。
// 正常开发不需要运行此脚本；日常写作请直接编辑 src/content/posts/ 与 src/data/。
/**
 * Hexo -> Astro content migration
 * ---------------------------------
 * Reproducible, idempotent migration of the legacy Hexo sources into the
 * Astro data layer:
 *
 *   source/_posts/*.md              -> src/content/posts/*.md   (body byte-exact)
 *   source/hitokoto/sentences.md    -> src/data/quotes.json
 *   source/_data/friends.yml        -> src/data/friends.json
 *   _config.yml                     -> src/data/profile.json
 *   source/avatar.jpg               -> public/avatar.jpg
 *   source/photos/*                 -> public/photos/*
 *
 * Rules:
 *   - The markdown body (everything after the frontmatter block) is copied
 *     verbatim, byte for byte. Only frontmatter is rewritten.
 *   - Frontmatter keeps title / date / updated / categories / tags, drops the
 *     Hexo-only "published" field, and emits valid YAML with ISO date strings.
 *   - Re-running the script produces byte-identical output (idempotent).
 *
 * Run: node scripts/migrate-hexo-content.mjs
 */

import { readFile, writeFile, mkdir, copyFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SRC_POSTS = path.join(ROOT, "source", "_posts");
const DST_POSTS = path.join(ROOT, "src", "content", "posts");
const SRC_QUOTES = path.join(ROOT, "source", "hitokoto", "sentences.md");
const DST_QUOTES = path.join(ROOT, "src", "data", "quotes.json");
const SRC_FRIENDS = path.join(ROOT, "source", "_data", "friends.yml");
const DST_FRIENDS = path.join(ROOT, "src", "data", "friends.json");
const SRC_CONFIG = path.join(ROOT, "_config.yml");
const DST_PROFILE = path.join(ROOT, "src", "data", "profile.json");
const SRC_AVATAR = path.join(ROOT, "source", "avatar.jpg");
const DST_AVATAR = path.join(ROOT, "public", "avatar.jpg");
const SRC_PHOTOS = path.join(ROOT, "source", "photos");
const DST_PHOTOS = path.join(ROOT, "public", "photos");

const UTF8 = "utf8";
const FRONTMATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const YAML_SCALAR_ORDER = ["title", "date", "updated", "categories", "tags"];

const failures = [];
const report = { posts: [], quotes: null, friends: null, profile: null, assets: [] };

function fail(msg) {
  failures.push(msg);
  console.error("FAIL: " + msg);
}
function assert(cond, msg) {
  if (!cond) fail(msg);
  return cond;
}
function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
async function readUtf8(file) {
  const buf = await readFile(file);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    fail(file + ": unexpected UTF-8 BOM in input");
  }
  return { buf, text: buf.toString(UTF8) };
}
function bodyByteSlice(buf, text) {
  const m = FRONTMATTER_RE.exec(text);
  if (!m) throw new Error("missing frontmatter block");
  return buf.subarray(Buffer.byteLength(text.slice(0, m[0].length), UTF8));
}
function yamlString(value) {
  // JSON double-quoted strings are valid YAML double-quoted scalars.
  return JSON.stringify(value);
}
function emitFrontmatter(fm, eol) {
  const lines = [];
  for (const key of YAML_SCALAR_ORDER) {
    const value = fm[key];
    if (value === undefined) continue;
    if (key === "categories" || key === "tags") {
      if (!Array.isArray(value) || value.length === 0) {
        fail("frontmatter field " + key + " must be a non-empty array");
        continue;
      }
      lines.push(key + ":");
      for (const item of value) {
        if (typeof item !== "string") {
          fail("frontmatter field " + key + " contains a non-string item");
          continue;
        }
        lines.push("  - " + yamlString(item));
      }
    } else {
      if (typeof value !== "string") {
        fail("frontmatter field " + key + " must be a string");
        continue;
      }
      if ((key === "date" || key === "updated") && !ISO_RE.test(value)) {
        fail("frontmatter field " + key + " is not an ISO datetime with timezone: " + value);
      }
      lines.push(key + ": " + yamlString(value));
    }
  }
  return ["---", ...lines, "---"].join(eol);
}
async function writeIfChanged(file, content, _label) {
  let existing = null;
  try {
    existing = await readFile(file, UTF8);
  } catch {
    existing = null;
  }
  if (existing === content) {
    report.changed = report.changed || [];
    return "unchanged";
  }
  await writeFile(file, content, UTF8);
  return existing === null ? "created" : "updated";
}

async function migratePosts() {
  await mkdir(DST_POSTS, { recursive: true });
  const names = (await readdir(SRC_POSTS)).filter((n) => n.toLowerCase().endsWith(".md")).sort();
  assert(names.length > 0, "no posts found in " + SRC_POSTS);

  for (const name of names) {
    const srcFile = path.join(SRC_POSTS, name);
    const dstFile = path.join(DST_POSTS, name);
    const { buf: srcBuf, text: srcText } = await readUtf8(srcFile);
    const m = FRONTMATTER_RE.exec(srcText);
    if (!assert(!!m, name + ": frontmatter block missing")) continue;

    // 1. Parse and normalize frontmatter.
    let srcFm;
    try {
      srcFm = parseYaml(m[1]) ?? {};
    } catch (err) {
      fail(name + ": source frontmatter is not valid YAML: " + err.message);
      continue;
    }
    for (const key of ["title", "date", "categories"]) {
      if (srcFm[key] === undefined) fail(name + ": source frontmatter is missing required field " + key);
    }
    const fm = {
      title: srcFm.title,
      date: srcFm.date,
      updated: srcFm.updated,
      categories: srcFm.categories,
      tags: srcFm.tags,
    };
    // Normalize date-ish values that a YAML parser may hand back as Date objects.
    for (const key of ["date", "updated"]) {
      if (fm[key] instanceof Date) fm[key] = fm[key].toISOString();
    }
    for (const key of ["title", "date", "updated"]) {
      if (fm[key] !== undefined && typeof fm[key] !== "string") {
        fail(name + ": frontmatter field " + key + " is not a string");
      }
    }

    // 2. Body = raw text after the frontmatter block, byte for byte.
    const srcBody = srcText.slice(m[0].length);
    const srcBodyBytes = bodyByteSlice(srcBuf, srcText);
    const eol = srcBody.includes("\r\n") ? "\r\n" : "\n";
    const outText = emitFrontmatter(fm, eol) + eol + srcBody;

    // 3. Write.
    const status = await writeIfChanged(dstFile, outText, name);

    // 4. Strict verification against the file on disk.
    const { buf: dstBuf, text: dstText } = await readUtf8(dstFile);
    const dm = FRONTMATTER_RE.exec(dstText);
    const dstBody = dm ? dstText.slice(dm[0].length) : null;
    const bodyOk = dstBody !== null && dstBody === srcBody;
    const bodyBytesOk = dstBody !== null && bodyByteSlice(dstBuf, dstText).equals(srcBodyBytes);
    if (!bodyOk) fail(name + ": BODY MISMATCH (text)");
    if (!bodyBytesOk) fail(name + ": BODY MISMATCH (bytes)");

    let parsed = null;
    try {
      parsed = dm ? parseYaml(dm[1]) : null;
    } catch (err) {
      fail(name + ": generated frontmatter is invalid YAML: " + err.message);
    }
    const metaOk =
      !!parsed &&
      parsed.title === srcFm.title &&
      parsed.date === srcFm.date &&
      parsed.updated === srcFm.updated &&
      JSON.stringify(parsed.categories) === JSON.stringify(srcFm.categories) &&
      JSON.stringify(parsed.tags) === JSON.stringify(srcFm.tags) &&
      !Object.prototype.hasOwnProperty.call(parsed, "published");
    if (!metaOk) fail(name + ": frontmatter normalization mismatch");

    report.posts.push({
      file: name,
      result: bodyOk && bodyBytesOk && metaOk ? "PASS" : "FAIL",
      status,
      sourceBytes: srcBuf.length,
      outputBytes: dstBuf.length,
      bodyBytes: srcBodyBytes.length,
      bodyTextEqual: bodyOk,
      bodyBytesEqual: bodyBytesOk,
      frontmatterValid: metaOk,
      dropped: srcFm.published !== undefined ? ["published"] : [],
    });
  }
}

async function migrateQuotes() {
  const { text } = await readUtf8(SRC_QUOTES);
  const lines = text.split(/\r?\n/);
  const entries = lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
  assert(entries.length > 0, "quotes: no '- ' entries found");
  assert(entries.every((e) => e.length > 0), "quotes: an entry is empty after trimming");

  const content = JSON.stringify(entries, null, 2) + "\n";
  const status = await writeIfChanged(DST_QUOTES, content, "quotes.json");

  const roundTrip = JSON.parse(await readFile(DST_QUOTES, UTF8));
  assert(Array.isArray(roundTrip) && roundTrip.length === entries.length, "quotes: round-trip length mismatch");
  assert(JSON.stringify(roundTrip) === JSON.stringify(entries), "quotes: round-trip content mismatch");

  const duplicates = entries.length - new Set(entries).size;
  report.quotes = {
    result: "PASS",
    status,
    lines: lines.length - (text.endsWith("\n") ? 1 : 0),
    entries: entries.length,
    duplicates,
  };
}

async function migrateFriends() {
  const { text } = await readUtf8(SRC_FRIENDS);
  const groups = parseYaml(text);
  assert(Array.isArray(groups), "friends: YAML root must be a sequence");
  const out = groups.map((group) => {
    assert(typeof group.group === "string", "friends: group name missing");
    assert(typeof group.description === "string", "friends: group description missing");
    assert(Array.isArray(group.items), "friends: items must be an array");
    return {
      group: group.group,
      description: group.description,
      items: group.items.map((item) => {
        for (const field of ["title", "url", "avatar", "description", "color"]) {
          assert(typeof item[field] === "string", "friends: item field " + field + " must be a string");
        }
        assert(Array.isArray(item.keywords), "friends: item keywords must be an array");
        assert(item.keywords.every((k) => typeof k === "string"), "friends: keywords must be strings");
        return {
          title: item.title,
          url: item.url,
          avatar: item.avatar,
          description: item.description,
          keywords: item.keywords,
          color: item.color,
        };
      }),
    };
  });

  const content = JSON.stringify(out, null, 2) + "\n";
  const status = await writeIfChanged(DST_FRIENDS, content, "friends.json");
  const roundTrip = JSON.parse(await readFile(DST_FRIENDS, UTF8));
  assert(JSON.stringify(roundTrip) === JSON.stringify(out), "friends: round-trip mismatch");
  const itemCount = out.reduce((n, g) => n + g.items.length, 0);
  assert(
    out.every((g) => g.items.every((i) => typeof i.color === "string" && i.color.startsWith("#"))),
    "friends: color must stay a string like '#0f766e'"
  );
  report.friends = { result: "PASS", status, groups: out.length, items: itemCount };
}

function iconSemantic(faClass) {
  const match = /fa-([a-z0-9-]+)$/.exec(faClass.trim());
  const raw = match ? match[1] : faClass.trim();
  const overrides = { "headphones-alt": "music", headphones: "music" };
  return overrides[raw] ?? raw;
}
function socialLabel(icon) {
  const labels = { rss: "RSS", github: "GitHub", music: "网易云音乐" };
  return labels[icon] ?? icon;
}

async function migrateProfile() {
  const { text } = await readUtf8(SRC_CONFIG);
  const cfg = parseYaml(text);
  assert(cfg && typeof cfg === "object", "profile: _config.yml must parse to a mapping");

  const authorData = parseYaml(await readFile(path.join(ROOT, "source", "_data", "author.yml"), UTF8));
  const authorKey = Object.keys(authorData)[0];
  const author = authorData[authorKey];

  const socialRaw = cfg?.theme_config?.sidebar?.widget_library?.blogger?.social;
  assert(Array.isArray(socialRaw) && socialRaw.length === 3, "profile: expected 3 social entries");
  const social = (socialRaw ?? []).map((entry) => {
    const icon = iconSemantic(String(entry.icon ?? ""));
    return { label: socialLabel(icon), icon, url: String(entry.url ?? "") };
  });

  const giscus = cfg?.theme_config?.comments?.giscus ?? {};
  const profile = {
    name: author.name,
    avatar: author.avatar,
    url: author.url,
    title: cfg.title,
    subtitle: cfg.subtitle ?? "",
    description: cfg.description,
    language: cfg.language,
    siteUrl: cfg.url,
    social,
    comments: {
      repo: giscus.repo,
      "repo-id": giscus["repo-id"],
      category: giscus.category,
      "category-id": giscus["category-id"],
      mapping: giscus.mapping,
      theme: giscus.theme,
      lang: giscus.lang,
    },
  };

  assert(profile.name === "ff66ccff", "profile: name mismatch");
  assert(profile.avatar === "/avatar.jpg", "profile: avatar mismatch");
  assert(profile.url === "/", "profile: url mismatch");
  assert(profile.siteUrl === "https://ff66ccff.github.io", "profile: siteUrl mismatch");
  assert(profile.language === "zh-CN", "profile: language mismatch");
  assert(typeof profile.subtitle === "string", "profile: subtitle must be a string");
  assert(profile.subtitle !== (cfg?.theme_config?.cover?.subtitle ?? null), "profile: subtitle must not reuse the cover placeholder");
  for (const key of ["repo", "repo-id", "category", "category-id", "mapping", "theme", "lang"]) {
    assert(typeof profile.comments[key] === "string", "profile: comments." + key + " must be a string");
  }

  const content = JSON.stringify(profile, null, 2) + "\n";
  const status = await writeIfChanged(DST_PROFILE, content, "profile.json");
  const roundTrip = JSON.parse(await readFile(DST_PROFILE, UTF8));
  assert(roundTrip.title === cfg.title, "profile: round-trip title mismatch");
  report.profile = { result: "PASS", status, social: social.length };
}

async function migrateAssets() {
  await mkdir(path.dirname(DST_AVATAR), { recursive: true });
  await mkdir(DST_PHOTOS, { recursive: true });

  const copies = [[SRC_AVATAR, DST_AVATAR]];
  for (const name of (await readdir(SRC_PHOTOS)).sort()) {
    const src = path.join(SRC_PHOTOS, name);
    if ((await stat(src)).isFile()) copies.push([src, path.join(DST_PHOTOS, name)]);
  }

  for (const [src, dst] of copies) {
    const srcBuf = await readFile(src);
    await copyFile(src, dst);
    const dstBuf = await readFile(dst);
    const ok = srcBuf.equals(dstBuf);
    if (!ok) fail("asset mismatch: " + dst);
    report.assets.push({
      source: path.relative(ROOT, src).replace(/\\/g, "/"),
      dest: path.relative(ROOT, dst).replace(/\\/g, "/"),
      bytes: dstBuf.length,
      sha256: sha256(dstBuf),
      result: ok ? "PASS" : "FAIL",
    });
  }
}

async function main() {
  console.log("Hexo -> Astro content migration");
  console.log("root: " + ROOT + "\n");

  await mkdir(path.dirname(DST_QUOTES), { recursive: true });
  await mkdir(DST_POSTS, { recursive: true });

  await migratePosts();
  await migrateQuotes();
  await migrateFriends();
  await migrateProfile();
  await migrateAssets();

  console.log("POSTS (" + report.posts.length + ")");
  for (const post of report.posts) {
    console.log(
      "  [" + post.result + "] " + post.file +
      " | body " + post.bodyBytes + " B | text=" + post.bodyTextEqual +
      " bytes=" + post.bodyBytesEqual + " yaml=" + post.frontmatterValid +
      " | " + post.status
    );
  }
  console.log("\nQUOTES: " + report.quotes.entries + " entries (" + report.quotes.duplicates + " duplicate lines kept)");
  console.log("FRIENDS: " + report.friends.groups + " group(s), " + report.friends.items + " item(s)");
  console.log("PROFILE: title=" + JSON.stringify(parseYaml(await readFile(SRC_CONFIG, UTF8)).title) + ", social=" + report.profile.social);
  console.log("ASSETS: " + report.assets.length + " file(s) copied");
  for (const asset of report.assets) {
    console.log("  [" + asset.result + "] " + asset.dest + " | " + asset.bytes + " B");
  }

  const failed = failures.length;
  console.log("\n" + (failed === 0 ? "VALIDATION PASSED" : "VALIDATION FAILED (" + failed + " error(s))"));
  if (failed > 0) {
    for (const message of failures) console.error("  - " + message);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
