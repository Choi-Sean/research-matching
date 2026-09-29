// Build src/messages/<locale>.json from messages-src/.
//   messages-src/en/<namespace>.json   — English source, ONE FILE PER NAMESPACE (the file name is the namespace)
//   messages-src/<locale>/*.json       — translations; each file is a partial object of namespaces, deep-merged
// Missing locale files are created empty so imports never fail (English is the fallback for any missing key).
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const srcRoot = join(root, "messages-src");
const outDir = join(root, "src", "messages");
mkdirSync(outDir, { recursive: true });

const LOCALES = ["ko", "ja", "zh", "zh-TW", "es", "fr", "de", "pt", "it", "ru", "ar", "hi", "vi", "tr", "id"];
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const deepMerge = (a, b) => {
  for (const [k, v] of Object.entries(b)) {
    a[k] = typeof v === "object" && v && typeof a[k] === "object" && a[k] ? deepMerge(a[k], v) : v;
  }
  return a;
};
const count = (o) => Object.values(o).reduce((n, v) => n + (typeof v === "string" ? 1 : count(v)), 0);

// English
const en = {};
const enDir = join(srcRoot, "en");
for (const file of readdirSync(enDir).filter((f) => f.endsWith(".json")).sort()) en[basename(file, ".json")] = readJson(join(enDir, file));
writeFileSync(join(outDir, "en.json"), JSON.stringify(en, null, 2) + "\n");
console.log(`en      ${count(en)} strings`);

// Translations
for (const loc of LOCALES) {
  const dir = join(srcRoot, loc);
  const merged = {};
  if (existsSync(dir) && statSync(dir).isDirectory()) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      try {
        deepMerge(merged, readJson(join(dir, file)));
      } catch (e) {
        console.error(`!! ${loc}/${file}: ${e.message}`);
        process.exitCode = 1;
      }
    }
  }
  writeFileSync(join(outDir, `${loc}.json`), JSON.stringify(merged, null, 2) + "\n");
  if (count(merged)) console.log(`${loc.padEnd(7)} ${count(merged)} strings`);
}
