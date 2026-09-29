// Mobile usability audit: opens pages in an emulated phone and reports horizontal overflow, small tap targets,
// inputs that make iOS zoom, tiny text, text squeezed into narrow columns and console errors.
//   node scripts/mobile-audit.mjs [--locales en,de] [--widths 360,390] [--set public|student|professor|all|none] [--only /pricing,/login] [--extra /professors/A5132943478] [--drawer] [--details]
// (Git Bash rewrites a bare "/" argument into a Windows path — prefix the command with MSYS_NO_PATHCONV=1 when passing "/".)
// Auth sets need the API on :8000 with the demo data from api/seed.py (student@mit.edu / prof1@mit.edu).
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true;
};
const locales = String(flag("locales", "en")).split(",");
const widths = String(flag("widths", "390")).split(",").map(Number);
const set = String(flag("set", "public"));
const only = flag("only", null);
const details = flag("details", false) === true;
const drawer = flag("drawer", false) === true; // also open the menu drawer and check it for overflow
const base = flag("base", "http://localhost:3000");
const api = flag("api", "http://localhost:8000");

const PUBLIC = ["/", "/discover?q=neuroscience", "/positions", "/positions/1", "/labs/1", "/pricing", "/ai-match", "/how-it-works", "/tools/email-checker", "/tools/follow-up", "/framework", "/examples", "/fields", "/fields/neuroscience", "/blog", "/blog/how-to-cold-email-a-professor", "/playbook", "/feedback", "/contact", "/login", "/register", "/privacy", "/terms"];
const STUDENT = ["/dashboard", "/dashboard/profile", "/dashboard/matches", "/dashboard/applications", "/dashboard/invitations", "/dashboard/outreach", "/dashboard/saved", "/dashboard/billing", "/dashboard/settings"];
const PROFESSOR = ["/dashboard", "/dashboard/lab", "/dashboard/positions", "/dashboard/positions/new", "/dashboard/positions/1", "/dashboard/positions/1/edit", "/dashboard/talent"];
// Extra public paths, e.g. --extra /professors/A5132943478 (a live OpenAlex author, so it needs network access)
const extra = flag("extra", null);

const plan = [];
if (set === "public" || set === "all") for (const p of PUBLIC) plan.push({ p, who: null });
if (extra && extra !== true) for (const p of String(extra).split(",")) plan.push({ p, who: null, extra: true });
if (set === "student" || set === "all") for (const p of STUDENT) plan.push({ p, who: "student" });
if (set === "professor" || set === "all") for (const p of PROFESSOR) plan.push({ p, who: "professor" });
const wanted = only ? String(only).split(",") : null;

const CREDS = { student: ["student@mit.edu", "password123"], professor: ["prof1@mit.edu", "password123"] };
const tokens = {};
async function tokenFor(who) {
  if (!who) return null;
  if (tokens[who]) return tokens[who];
  const [email, password] = CREDS[who];
  const res = await fetch(`${api}/auth/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ username: email, password }) });
  tokens[who] = (await res.json()).access_token;
  return tokens[who];
}

const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });

// Runs inside the page.
function measure(vw) {
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".") : "";
    const txt = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 26);
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${txt ? ` “${txt}”` : ""}`;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if (r.width <= 1 && r.height <= 1) return false; // sr-only (e.g. the skip link until it is focused)
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };
  const clippedByScroller = (el) => {
    for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const o = getComputedStyle(a).overflowX;
      if (["auto", "scroll", "hidden", "clip"].includes(o) && a.getBoundingClientRect().right <= vw + 1 && a.getBoundingClientRect().left >= -1) return true;
    }
    return false;
  };
  const overflow = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed" || clippedByScroller(el)) continue;
      overflow.push(`${describe(el)} [${Math.round(r.left)}→${Math.round(r.right)}]`);
    }
  }
  const tap = [];
  const inputs = [];
  const sel = 'a[href], button, [role="button"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"], [role="radio"], select, summary, input:not([type="hidden"]), textarea';
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el) || el.disabled) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (el.matches("input, textarea, select") && parseFloat(cs.fontSize) < 16) inputs.push(`${describe(el)} ${cs.fontSize}`);
    if (el.tagName === "A" && cs.display === "inline") continue; // in-text links
    // A control inside a <label> is tapped through the label, so the label's box is the real target.
    const label = el.matches("input, textarea, select") ? el.closest("label") : null;
    if (label) {
      const lr = label.getBoundingClientRect();
      if (Math.min(lr.width, lr.height) >= 40) continue;
    }
    if (el.matches('input[type="checkbox"], input[type="radio"]') && el.closest("label")) continue;
    // Some controls carry an invisible absolutely-positioned ::after that widens the touch area (switches, chip ×); count it.
    let w = r.width, hgt = r.height;
    const a = getComputedStyle(el, "::after");
    if (a.position === "absolute" && a.content !== "none") {
      w = Math.max(w, parseFloat(a.width) || 0);
      hgt = Math.max(hgt, parseFloat(a.height) || 0);
    }
    // A short word ("Blog") makes a link narrow but perfectly tappable; only icon-only controls need width as well as height.
    const hasText = (el.textContent || "").trim().length > 0 && !el.matches("input, textarea, select");
    if (hgt < 40 || (!hasText && w < 40)) tap.push(`${describe(el)} ${Math.round(w)}×${Math.round(hgt)}`);
  }
  const small = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || !visible(el) || el.closest("script,style,noscript")) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 11.5) small.push(`${describe(el)} ${fs}px`);
  }
  // Text squeezed into a sliver: a flex/grid item so narrow that a sentence wraps every word or two.
  // (Decorative aria-hidden mock-ups and single-line truncated text are ignored.)
  const narrow = [];
  const seen = new Set();
  const walker2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  // Phones only: on tablets and desktops multi-column layouts are supposed to have narrow columns.
  for (let n = vw <= 480 ? walker2.nextNode() : null; n; n = walker2.nextNode()) {
    if (n.textContent.replace(/\s+/g, " ").trim().length < 28) continue;
    let el = n.parentElement;
    if (!el || !visible(el) || el.closest('script,style,noscript,[aria-hidden="true"],.truncate,[class*="line-clamp"]')) continue;
    while (el && getComputedStyle(el).display === "inline") el = el.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const w = el.getBoundingClientRect().width;
    if (w > 0 && w < Math.max(96, vw * 0.33)) narrow.push(`${describe(el)} ${Math.round(w)}px`);
  }
  const doc = document.documentElement;
  return { scrollDelta: doc.scrollWidth - doc.clientWidth, overflow, tap, inputs, small, narrow, title: document.title, h: doc.scrollHeight };
}

// Runs inside the page after the menu drawer has been opened (--drawer): anything wider than the drawer itself is a problem.
function measureDrawer() {
  const d = document.querySelector('[role="dialog"]');
  if (!d) return { missing: true, hScroll: 0, out: [] };
  const dr = d.getBoundingClientRect();
  const out = [];
  for (const el of d.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > dr.right + 1 || r.left < dr.left - 1) {
      const txt = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
      out.push(`${el.tagName.toLowerCase()} “${txt}” [${Math.round(r.left)}→${Math.round(r.right)}] in drawer [${Math.round(dr.left)}→${Math.round(dr.right)}]`);
    }
  }
  return { missing: false, hScroll: d.scrollWidth - d.clientWidth, out };
}

const totals = { pages: 0, overflowPages: 0, tap: new Map(), inputs: new Map(), small: new Map(), overflow: new Map(), errors: 0 };
const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);

for (const locale of locales) {
  for (const W of widths) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: locale === "zh" ? "zh-CN" : locale });
    await ctx.addInitScript(() => { try { localStorage.setItem("labora-theme", "light"); } catch {} });
    for (const { p, who, extra: isExtra } of plan) {
      if (wanted && !isExtra && !wanted.includes(p)) continue; // --only narrows the built-in sets; --extra paths always run
      const page = await ctx.newPage();
      const errs = [];
      page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
      page.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 160)));
      const tok = await tokenFor(who);
      if (tok) await page.addInitScript((t) => localStorage.setItem("labora_token", t), tok);
      try {
        await page.goto(`${base}/${locale}${p === "/" ? "" : p}`, { waitUntil: "load", timeout: 45000 });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(900);
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < h; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(90); }
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(400);
        const m = await page.evaluate(measure, W);
        totals.pages++;
        if (m.scrollDelta > 0 || m.overflow.length) totals.overflowPages++;
        totals.errors += errs.length;
        for (const o of m.overflow) bump(totals.overflow, o.replace(/\[.*$/, "").trim());
        for (const o of m.tap) bump(totals.tap, o.replace(/ \d+×\d+$/, ""));
        for (const o of m.inputs) bump(totals.inputs, o.replace(/ [\d.]+px$/, ""));
        for (const o of m.small) bump(totals.small, o.replace(/ [\d.]+px$/, ""));
        const flags = [m.scrollDelta > 0 ? `OVERFLOW+${m.scrollDelta}` : "", m.overflow.length ? `out:${m.overflow.length}` : "", m.tap.length ? `tap<40:${m.tap.length}` : "", m.inputs.length ? `input<16:${m.inputs.length}` : "", m.narrow.length ? `narrow:${m.narrow.length}` : "", m.small.length ? `small:${m.small.length}` : "", errs.length ? `err:${errs.length}` : ""].filter(Boolean);
        console.log(`${locale.padEnd(5)} ${String(W).padEnd(4)} ${p.padEnd(28)} ${flags.length ? flags.join(" ") : "ok"}   (${m.h}px)`);
        if (drawer) {
          await page.locator('header button[aria-haspopup="dialog"]').first().tap().catch(() => {});
          await page.waitForTimeout(500);
          const d = await page.evaluate(measureDrawer);
          if (d.missing) console.log("      drawer: could not open");
          else if (d.hScroll > 0 || d.out.length) {
            totals.overflowPages++;
            console.log(`      DRAWER OVERFLOW +${d.hScroll}`);
            for (const o of d.out.slice(0, 4)) console.log("      drawer", o);
          }
        }
        if (details) {
          for (const o of m.overflow.slice(0, 4)) console.log("      out  ", o);
          for (const o of [...new Set(m.tap)].slice(0, 6)) console.log("      tap  ", o);
          for (const o of [...new Set(m.inputs)].slice(0, 3)) console.log("      input", o);
          for (const o of m.narrow.slice(0, 4)) console.log("      narrow", o);
          for (const o of errs.slice(0, 2)) console.log("      err  ", o);
        }
      } catch (e) {
        console.log(`${locale.padEnd(5)} ${String(W).padEnd(4)} ${p.padEnd(28)} FAILED ${String(e.message).slice(0, 80)}`);
      }
      await page.close();
    }
    await ctx.close();
  }
}
const top = (m, n = 12) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `   ${String(v).padStart(3)}× ${k}`).join("\n");
console.log(`\n${totals.pages} page loads, ${totals.overflowPages} with horizontal overflow, ${totals.errors} console errors`);
if (totals.overflow.size) console.log("\nMost frequent overflowing elements:\n" + top(totals.overflow));
if (totals.tap.size) console.log("\nMost frequent small tap targets (<40px):\n" + top(totals.tap, 18));
if (totals.inputs.size) console.log("\nInputs under 16px (iOS zooms on focus):\n" + top(totals.inputs, 8));
if (totals.small.size) console.log("\nText under 11.5px:\n" + top(totals.small, 8));
await browser.close();
