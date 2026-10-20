#!/usr/bin/env node
// Validates offline/index.json (offline courses taught at Miwiz Mind Hub). Exit 1 on any error.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isFormUrl, FORM_URL_MSG } from "./form-url.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (m) => errors.push(m);
const file = resolve(ROOT, "offline/index.json");
if (!existsSync(file)) { console.log("offline/index.json not present, skipped"); process.exit(0); }
const d = JSON.parse(readFileSync(file, "utf8"));
const cover = (what, v) => {
  if (v == null) return;
  if (typeof v !== "string" || !v.startsWith("offline/covers/") || !existsSync(resolve(ROOT, v))) fail(`${what}: cover missing or not under offline/covers/: ${v}`);
};
if (d.schemaVersion !== 1) fail("schemaVersion must be 1");
const ids = (arr, what) => {
  const s = new Set();
  for (const x of arr ?? []) { if (!x.id) fail(`${what}: entry without id`); else if (s.has(x.id)) fail(`${what}: duplicate id ${x.id}`); s.add(x.id); }
  return s;
};
const providers = ids(d.providers, "providers");
const textbooks = ids(d.textbooks, "textbooks");
ids(d.courses, "courses");
const instructors = ids(d.instructors, "instructors");
for (const i of d.instructors ?? []) {
  if (typeof i.display_name !== "string" || !i.display_name.trim()) fail(`instructor ${i.id}: display_name missing`);
  if (typeof i.bio === "string" && i.bio.length > 400) fail(`instructor ${i.id}: bio is ${i.bio.length} chars (max 400)`);
  if (i.photo != null && (typeof i.photo !== "string" || !i.photo.startsWith("offline/instructors/") || !existsSync(resolve(ROOT, i.photo)))) fail(`instructor ${i.id}: photo missing or not under offline/instructors/: ${i.photo}`);
}
if (!d.courses?.length) fail("courses is empty");
for (const p of d.providers ?? []) {
  const c = p.contact ?? {};
  if ("form_url" in c && !isFormUrl(c.form_url)) fail(`provider ${p.id}: ${FORM_URL_MSG} (đang là: ${JSON.stringify(c.form_url)})`);
}
for (const t of d.textbooks ?? []) { cover(`textbook ${t.id}`, t.cover); cover(`textbook ${t.id} cover_square`, t.cover_square); (t.extra_covers ?? []).forEach((c) => cover(`textbook ${t.id} extra`, c)); }
for (const c of d.courses ?? []) {
  if (c.visibility !== "public") fail(`course ${c.id}: only visibility "public" allowed (got ${c.visibility})`);
  if (c.delivery !== "offline") fail(`course ${c.id}: delivery must be "offline"`);
  if (!providers.has(c.provider)) fail(`course ${c.id}: unknown provider ${c.provider}`);
  for (const m of c.materials ?? []) if (!textbooks.has(m)) fail(`course ${c.id}: unknown material ${m}`);
  for (const iid of c.instructor_ids ?? []) if (!instructors.has(iid)) fail(`course ${c.id}: unknown instructor ${iid}`);
  cover(`course ${c.id}`, c.cover); cover(`course ${c.id} cover_square`, c.cover_square);
  if (!c.location?.address) fail(`course ${c.id}: location.address missing`);
}
if (errors.length) { console.error("offline check failed:\n - " + errors.join("\n - ")); process.exit(1); }
console.log(`offline/index.json ok (${d.courses.length} courses, ${d.textbooks.length} textbooks)`);
