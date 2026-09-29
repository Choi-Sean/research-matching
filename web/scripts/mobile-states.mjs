// Touch-emulated screenshots of the interactive mobile states the plain page audit cannot see:
// menu drawer, dropdowns, filters, bottom-sheet dialogs, signed-in dashboards.
//   node scripts/mobile-states.mjs <outDir> [--w 390] [--h 844] [--locale en] [--theme light] [--pos 2] [--only home,drawer,discover,position,student,dialog,apply,pages,professor]
// Needs the dev server on :3000 and the API on :8000 with the demo data from api/seed.py.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const outDir = args[0] ?? "shots-states";
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
};
const W = Number(flag("w", 390));
const H = Number(flag("h", 844));
const locale = String(flag("locale", "en"));
const theme = String(flag("theme", "light"));
const only = flag("only", null) ? String(flag("only")).split(",") : null;
const pos = Number(flag("pos", 2)); // position id used for the position-page states
const base = "http://localhost:3000";
const api = "http://localhost:8000";
mkdirSync(outDir, { recursive: true });

const CREDS = { student: ["student@mit.edu", "password123"], professor: ["prof1@mit.edu", "password123"] };
async function token(who) {
  const [username, password] = CREDS[who];
  const res = await fetch(`${api}/auth/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ username, password }) });
  return (await res.json()).access_token;
}

const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });

async function session(who) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: theme === "dark" ? "dark" : "light",
    locale: locale === "zh" ? "zh-CN" : locale,
  });
  await ctx.addInitScript((t) => { try { localStorage.setItem("labora-theme", t); } catch {} }, theme);
  if (who) {
    const tok = await token(who);
    await ctx.addInitScript((t) => localStorage.setItem("labora_token", t), tok);
  }
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  pageerror:", e.message.slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error") console.log("  console.error:", m.text().slice(0, 160)); });
  return { ctx, page };
}
const go = async (page, path) => {
  await page.goto(`${base}/${locale}${path === "/" ? "" : path}`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
};
const snap = async (page, name, opts = {}) => {
  await page.waitForTimeout(opts.settle ?? 450);
  const file = join(outDir, `${locale}-${theme}-${W}-${name}.png`);
  await page.screenshot({ path: file, fullPage: opts.full ?? false });
  console.log("wrote", file);
};
const want = (n) => !only || only.includes(n);

// --- public -----------------------------------------------------------------------------------------------------------
{
  const { ctx, page } = await session(null);
  if (want("home")) {
    await go(page, "/");
    await snap(page, "home");
  }
  if (want("drawer")) {
    await go(page, "/");
    // Selectors avoid visible text so the script works in every language.
    await page.locator('header button[aria-haspopup="dialog"]').first().tap();
    await snap(page, "drawer");
    // language dropdown from inside the drawer
    await page.locator('[role="dialog"] button[aria-haspopup="menu"]').first().tap().catch(() => {});
    await snap(page, "drawer-language");
  }
  if (want("discover")) {
    await go(page, "/discover?q=neuroscience");
    await page.waitForSelector("article", { timeout: 20000 }).catch(() => {});
    await snap(page, "discover");
    const filters = page.locator("main button[aria-expanded]").first();
    if (await filters.count()) {
      await filters.tap();
      await snap(page, "discover-filters");
    }
  }
  if (want("position")) {
    await go(page, `/positions/${pos}`);
    await snap(page, "position");
  }
  await ctx.close();
}

// --- student ----------------------------------------------------------------------------------------------------------
if (want("student") || want("apply") || want("dialog")) {
  const { ctx, page } = await session("student");
  if (want("student")) {
    await go(page, "/dashboard");
    await snap(page, "student-dashboard");
    await go(page, "/dashboard/profile");
    await snap(page, "student-profile");
  }
  if (want("dialog")) {
    // Dialogs are bottom sheets on phones.
    await go(page, "/feedback");
    // The "new post" trigger is the Radix dialog trigger inside <main>; wait for auth to load it (guests see a sign-in link instead).
    const open = page.locator('main button[aria-haspopup="dialog"]').first();
    await open.waitFor({ timeout: 8000 }).catch(() => {});
    if (await open.count()) {
      await open.tap();
      await snap(page, "feedback-dialog", { settle: 700 });
    } else console.log("  (no dialog trigger found)");
  }
  if (want("apply")) {
    // The sticky "Apply" bar (phones only) jumps to the inline form; pick a position the student has not applied to yet.
    await go(page, `/positions/${pos}`);
    await snap(page, "apply-bar");
    const bar = page.locator("div.fixed.bottom-0 button").first();
    await bar.waitFor({ timeout: 8000 }).catch(() => {});
    if (await bar.count()) {
      await bar.tap();
      await snap(page, "apply-form", { settle: 1200 });
    } else console.log("  (no sticky Apply bar found — maybe already applied to this position)");
  }
  await ctx.close();
}

// --- list-style pages (avatar + text + actions rows) ---------------------------------------------------------------------
if (want("pages")) {
  const student = await session("student");
  await go(student.page, "/dashboard/matches");
  // The "find my matches" button is the brand-coloured one inside the tab panel.
  const run = student.page.locator('main [role="tabpanel"] button').first();
  if (await run.count()) {
    await run.tap();
    await student.page.waitForTimeout(4000);
  }
  await student.page.evaluate(() => window.scrollTo(0, 260));
  await snap(student.page, "s-matches");
  await student.page.evaluate(() => window.scrollBy(0, 760));
  await snap(student.page, "s-matches-2");
  for (const [p, name] of [["/dashboard/applications", "applications"], ["/dashboard/outreach", "outreach"], ["/dashboard/invitations", "invitations"]]) {
    await go(student.page, p);
    await snap(student.page, `s-${name}`);
  }
  await student.ctx.close();

  const prof = await session("professor");
  for (const [p, name] of [["/dashboard/positions", "positions"], ["/dashboard/positions/1", "applicants"], ["/dashboard/talent", "talent"]]) {
    await go(prof.page, p);
    await snap(prof.page, `p-${name}`);
  }
  await prof.ctx.close();

  const guest = await session(null);
  await go(guest.page, "/professors/A5132943478");
  await snap(guest.page, "professor-profile");
  await guest.ctx.close();
}

// --- professor --------------------------------------------------------------------------------------------------------
if (want("professor")) {
  const { ctx, page } = await session("professor");
  await go(page, "/dashboard");
  await snap(page, "professor-dashboard");
  await go(page, "/dashboard/positions/new");
  await snap(page, "professor-new-position");
  await ctx.close();
}

await browser.close();
