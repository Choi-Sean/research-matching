// Validate translations against English: missing keys, stray keys, placeholder and tag mismatches.
// Run: node scripts/i18n-check.mjs [--strict]   (--strict also fails on missing keys)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../src/messages/", import.meta.url));
const strict = process.argv.includes("--strict");
const PLURAL_EXTRA = /_(zero|one|two|few|many)$/; // only some languages need these forms
// Plural forms each language really uses at runtime (CLDR `many` for es/fr/it/pt only applies to millions).
// A missing `_one` would silently fall back to the English string, so these are enforced.
const PLURALS = {
  ko: [], ja: [], zh: [], "zh-TW": [], vi: [], id: [],
  es: ["one"], fr: ["one"], de: ["one"], pt: ["one"], it: ["one"], tr: ["one"], hi: ["one"],
  ru: ["one", "few", "many"],
  ar: ["zero", "one", "two", "few", "many"],
};
const flatten = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[p + k, v]] : flatten(v, p + k + ".")));
const en = new Map(flatten(JSON.parse(readFileSync(join(dir, "en.json"), "utf8"))));
const tokens = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const tags = (s) => [...s.matchAll(/<\/?[a-zA-Z][\w-]*\s*\/?>/g)].map((m) => m[0].replace(/\s+/g, "")).sort().join("");

let errors = 0;
let warnings = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "en.json").sort()) {
  const loc = file.replace(".json", "");
  const tr = new Map(flatten(JSON.parse(readFileSync(join(dir, file), "utf8"))));
  const missing = [];
  const stray = [];
  const bad = [];
  for (const [k, v] of en) {
    const t = tr.get(k);
    if (t === undefined) {
      if (!PLURAL_EXTRA.test(k)) missing.push(k);
      continue;
    }
    if (!t.trim()) { if (v.trim()) bad.push(`${k}: empty`); }
    else if (tokens(t) !== tokens(v)) bad.push(`${k}: placeholders {${tokens(v)}} → {${tokens(t)}}`);
    else if (tags(t) !== tags(v)) bad.push(`${k}: tags ${tags(v)} → ${tags(t)}`);
  }
  for (const k of en.keys()) {
    if (!k.endsWith("_other")) continue;
    for (const cat of PLURALS[loc] ?? []) if (!tr.has(k.replace(/_other$/, "_" + cat)) && tr.has(k)) bad.push(`${k.replace(/_other$/, "_" + cat)}: plural form required for ${loc}`);
  }
  for (const [k, t] of tr) {
    if (en.has(k)) continue;
    // extra plural categories (e.g. Russian `_few`) are legal; they must reuse the English `_other` placeholders
    if (PLURAL_EXTRA.test(k)) {
      const base = en.get(k.replace(PLURAL_EXTRA, "_other"));
      if (base === undefined) stray.push(k);
      else if (tokens(t) !== tokens(base)) bad.push(`${k}: placeholders differ from _other`);
    } else stray.push(k);
  }
  const pct = Math.round(((en.size - missing.length) / en.size) * 100);
  console.log(`${loc.padEnd(6)} ${String(pct).padStart(3)}%  missing ${missing.length}  stray ${stray.length}  problems ${bad.length}`);
  for (const b of bad.slice(0, 12)) console.log("   ✗", b);
  for (const s of stray.slice(0, 5)) console.log("   ? stray", s);
  if (missing.length && missing.length <= 8) for (const m of missing) console.log("   – missing", m);
  errors += bad.length;
  warnings += missing.length + stray.length;
}
console.log(errors ? `\n${errors} problem(s)` : "\nno placeholder/tag problems");
process.exit(errors || (strict && warnings) ? 1 : 0);
