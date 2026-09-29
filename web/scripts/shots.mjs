// Visual QA helper: screenshots pages with the system Edge (no browser download needed).
//   node scripts/shots.mjs <outDir> <path> [--w 1440] [--h 900] [--theme dark] [--locale ko] [--full] [--steps 4] [--auth student|professor|admin] [--wait 1500]
// Example: node scripts/shots.mjs shots / --theme dark --steps 5
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const outDir = args[0];
const path = args[1] ?? "/";
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
};
const W = Number(flag("w", 1440));
const H = Number(flag("h", 900));
const theme = flag("theme", "light");
const locale = flag("locale", "en");
const steps = Number(flag("steps", 1));
const full = flag("full", false) === true;
const auth = flag("auth", null);
const wait = Number(flag("wait", 1500));
const base = flag("base", "http://localhost:3000");
const api = flag("api", "http://localhost:8000");

const CREDS = {
  student: ["student@mit.edu", "password123"],
  professor: ["prof1@mit.edu", "password123"],
  admin: ["admin@labora.edu", "password123"],
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  colorScheme: theme === "dark" ? "dark" : "light",
  locale: locale === "zh" ? "zh-CN" : locale,
});
await context.addInitScript(([t]) => {
  try { localStorage.setItem("labora-theme", t); } catch {}
}, [theme]);

if (auth) {
  const [email, password] = CREDS[auth];
  const res = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  const { access_token } = await res.json();
  await context.addInitScript(([tok]) => localStorage.setItem("labora_token", tok), [access_token]);
}

const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 300)}`));

const url = `${base}/${locale}${path === "/" ? "" : path}`;
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(wait);
const name = `${locale}-${theme}-${path.replace(/[^a-z0-9]+/gi, "_") || "home"}-${W}`;

if (full) {
  await page.screenshot({ path: join(outDir, `${name}-full.png`), fullPage: true });
} else {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * (H - 80));
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(outDir, `${name}-${i + 1}.png`) });
  }
  console.log(`page height ${total}px`);
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
console.log(`${url}  overflow-x: ${overflow}  console errors: ${errors.length}`);
for (const e of errors.slice(0, 6)) console.log("  !", e);
await browser.close();
