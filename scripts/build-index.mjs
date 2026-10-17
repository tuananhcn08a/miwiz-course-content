#!/usr/bin/env node
// Sinh index.json từ catalog.json + courses/*.json. Kiểm tra lỗi hay gặp trước khi phát hành.
// Dùng: node scripts/build-index.mjs            → ghi index.json
//       node scripts/build-index.mjs --check    → chỉ kiểm, lỗi nếu index.json cũ (dùng trong CI)
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const errors = [];
const fail = (m) => errors.push(m);

const catalog = JSON.parse(readFileSync(resolve(ROOT, "catalog.json"), "utf8"));
if (catalog.schemaVersion !== 1) fail("catalog.schemaVersion phải = 1");
if (!Array.isArray(catalog.courses) || catalog.courses.length === 0) fail("catalog.courses rỗng");

const seen = new Set();
const courses = [];
for (const [i, entry] of (catalog.courses ?? []).entries()) {
  const id = entry?.id;
  if (!id || !/^[a-z0-9-]+$/.test(id)) { fail(`courses[${i}]: id không hợp lệ (chỉ a-z 0-9 -): ${id}`); continue; }
  if (seen.has(id)) { fail(`id trùng trong catalog: ${id}`); continue; }
  seen.add(id);
  const file = resolve(ROOT, "courses", `${id}.json`);
  if (!existsSync(file)) { fail(`${id}: thiếu file courses/${id}.json`); continue; }
  const raw = readFileSync(file);
  let m;
  try { m = JSON.parse(raw.toString("utf8")); } catch (e) { fail(`${id}: JSON hỏng — ${e.message}`); continue; }
  if (m.id !== id) fail(`${id}: trường id trong file (${m.id}) khác tên file`);
  for (const k of ["title", "language", "level", "days"]) if (m[k] == null) fail(`${id}: thiếu trường ${k}`);
  if (!Array.isArray(m.days) || m.days.length === 0) fail(`${id}: days phải là mảng không rỗng`);
  const dayNums = new Set();
  let items = 0;
  for (const d of m.days ?? []) {
    if (dayNums.has(d.day)) fail(`${id}: ngày ${d.day} bị lặp`);
    dayNums.add(d.day);
    items += (d.items ?? []).length;
  }
  if (Array.isArray(m.topics)) {
    const tids = new Set();
    for (const t of m.topics) {
      if (tids.has(t.id)) fail(`${id}: topic id trùng ${t.id}`);
      tids.add(t.id);
      if (!Array.isArray(t.items) || t.items.length === 0) fail(`${id}: topic ${t.id} không có items`);
    }
  }
  const sha256 = createHash("sha256").update(raw).digest("hex");
  courses.push({
    id,
    enabled: entry.enabled !== false,
    order: i + 1,
    title: m.title,
    subtitle: m.subtitle ?? null,
    language: m.language,
    level: m.level,
    icon_text: m.icon_text ?? null,
    icon_color: m.icon_color ?? null,
    thumbnail: m.thumbnail ?? null,
    days: m.days?.length ?? 0,
    topics: Array.isArray(m.topics) ? m.topics.length : 0,
    items,
    version: sha256.slice(0, 12),
    sha256,
    bytes: raw.length,
    manifestUrl: `courses/${id}.json`,
  });
}

// File khoá có trong thư mục nhưng quên khai báo → nhắc (không lỗi).
for (const f of readdirSync(resolve(ROOT, "courses")).filter((f) => f.endsWith(".json"))) {
  const id = f.replace(/\.json$/, "");
  if (!seen.has(id)) console.warn(`⚠ courses/${f} chưa có trong catalog.json → app sẽ KHÔNG thấy khoá này`);
}

if (errors.length) {
  console.error("✗ Lỗi nội dung:\n - " + errors.join("\n - "));
  process.exit(1);
}

const prev = existsSync(resolve(ROOT, "index.json")) ? JSON.parse(readFileSync(resolve(ROOT, "index.json"), "utf8")) : null;
const stable = JSON.stringify(courses);
const unchanged = prev && JSON.stringify(prev.courses) === stable;
const index = {
  schemaVersion: 1,
  generatedAt: unchanged ? prev.generatedAt : new Date().toISOString(),
  minAppVersion: catalog.minAppVersion ?? null,
  courses,
};
const out = JSON.stringify(index, null, 2) + "\n";

if (CHECK) {
  if (!unchanged) { console.error("✗ index.json chưa cập nhật — chạy: node scripts/build-index.mjs"); process.exit(1); }
  console.log(`✓ index.json khớp (${courses.length} khoá, ${courses.filter((c) => c.enabled).length} đang bật)`);
} else {
  writeFileSync(resolve(ROOT, "index.json"), out);
  console.log(`✓ index.json: ${courses.length} khoá — ${courses.map((c) => `${c.order}.${c.id}${c.enabled ? "" : " (ẩn)"}`).join(", ")}`);
}
