// Renders the Labora mark into the PNG icons that phones need (home-screen icon, PWA manifest, maskable).
//   node scripts/make-icons.mjs
// The favicon itself is src/app/icon.svg; this only produces the raster sizes.
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const BG = "#0f1320";
const mark = `
  <defs><clipPath id="l"><circle cx="25" cy="32" r="14"/></clipPath></defs>
  <circle cx="25" cy="32" r="14" fill="none" stroke="#ffffff" stroke-width="4"/>
  <circle cx="39" cy="32" r="14" fill="none" stroke="#7f8fff" stroke-width="4"/>
  <circle cx="39" cy="32" r="14" fill="#7f8fff" clip-path="url(#l)"/>`;
// "rounded" is the normal icon; "bleed" fills the whole square so the OS (iOS, Android adaptive icons) can apply its own mask.
// The mark spans a ~23 unit radius from the centre, which stays inside the 80 % maskable safe zone.
const svg = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" ${rounded ? 'rx="16"' : ""} fill="${BG}"/>${mark}</svg>`;

const jobs = [
  { file: "public/icons/icon-192.png", size: 192, rounded: true },
  { file: "public/icons/icon-512.png", size: 512, rounded: true },
  { file: "public/icons/maskable-512.png", size: 512, rounded: false },
  { file: "src/app/apple-icon.png", size: 180, rounded: false },
];

await mkdir("public/icons", { recursive: true });
const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });
for (const { file, size, rounded } of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg(rounded)}`);
  await page.screenshot({ path: file, omitBackground: true });
  await page.close();
  console.log("wrote", file, `${size}×${size}`);
}
await browser.close();
