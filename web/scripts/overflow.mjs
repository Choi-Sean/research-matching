// Find elements that stick out past the viewport (the usual cause of horizontal scroll).
//   node scripts/overflow.mjs <path> [--w 390] [--locale en]
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const path = args[0] ?? "/";
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};
const W = Number(flag("w", 390));
const locale = flag("locale", "en");

const b = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });
const p = await (await b.newContext({ viewport: { width: W, height: 800 } })).newPage();
await p.goto(`http://localhost:3000/${locale}${path === "/" ? "" : path}`, { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
// scroll through the page so scroll-reveal / lazy content has rendered
const height = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < height; y += 600) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(120);
}
await p.waitForTimeout(600);
console.log("scrollWidth", await p.evaluate(() => document.documentElement.scrollWidth), "clientWidth", await p.evaluate(() => document.documentElement.clientWidth), "body", await p.evaluate(() => document.body.scrollWidth));
const offenders = await p.evaluate((vw) => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed") continue;
      out.push(`${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ").slice(0, 3).join(".") : ""}  left=${Math.round(r.left)} right=${Math.round(r.right)}`);
    }
  }
  return out.slice(0, 15);
}, W);
console.log(`viewport ${W}px — ${offenders.length} elements outside`);
for (const o of offenders) console.log("  ", o);
await b.close();
