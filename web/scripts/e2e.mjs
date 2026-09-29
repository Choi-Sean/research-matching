// End-to-end smoke test of the main user journeys against the running dev servers.
//   1) reseed the API first (fresh quotas):  cd ../api && del dev.db && .venv\Scripts\python seed.py  (then restart the API)
//   2) node scripts/e2e.mjs
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const API = "http://localhost:8000";
const results = [];
const ANON_ONLY = process.argv.includes("--anon");
const step = async (name, fn) => {
  try {
    await fn();
    results.push(["ok", name]);
    console.log("  ✓", name);
  } catch (e) {
    results.push(["FAIL", name, e.message.split("\n")[0]]);
    console.log("  ✗", name, "-", e.message.split("\n")[0]);
  }
};

const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });

async function session(email, password = "password123") {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ username: email, password }) });
  const { access_token } = await res.json();
  await ctx.addInitScript(([t]) => localStorage.setItem("labora_token", t), [access_token]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  return page;
}

console.log("\nAnonymous visitor");
{
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await step("home redirects to a locale and shows the hero", async () => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    if (!/\/en\/?$/.test(page.url())) throw new Error("no locale redirect: " + page.url());
    await page.getByRole("heading", { level: 1 }).waitFor();
  });
  await step("hero search leads to discover results", async () => {
    await page.getByPlaceholder("e.g. computational neuroscience").first().fill("neuroscience");
    await page.getByPlaceholder("e.g. MIT, Stanford…").first().fill("MIT");
    await page.getByRole("button", { name: "Find professors" }).first().click();
    await page.waitForURL(/\/en\/discover\?/);
    await page.locator("article").first().waitFor({ timeout: 30000 });
    if ((await page.locator("article").count()) < 3) throw new Error("too few results");
  });
  await step("professor profile loads and locks the summary for visitors", async () => {
    await page.locator("article h3 a").first().click();
    await page.waitForURL(/\/en\/professors\/A\d+/);
    await page.getByText("Sign in to read the summary").waitFor();
  });
  await step("positions board lists seeded positions", async () => {
    await page.goto(`${BASE}/en/positions`, { waitUntil: "networkidle" });
    await page.locator("article").first().waitFor();
    if ((await page.locator("article").count()) < 8) throw new Error("expected the seeded positions");
  });
  await step("pricing shows four plans", async () => {
    await page.goto(`${BASE}/en/pricing`, { waitUntil: "networkidle" });
    await page.getByText("Semester pass").first().waitFor();
    await page.getByText("Best value").waitFor();
  });
  await step("language switch to Korean keeps the page and sets lang", async () => {
    await page.goto(`${BASE}/en/pricing`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Language" }).first().click();
    await page.getByRole("menuitemradio", { name: /한국어/ }).click();
    await page.waitForURL(/\/ko\/pricing/);
    const lang = await page.evaluate(() => document.documentElement.lang);
    if (lang !== "ko") throw new Error("html lang is " + lang);
  });
  await step("Arabic switches the document to right-to-left", async () => {
    await page.goto(`${BASE}/ar`, { waitUntil: "networkidle" });
    const dir = await page.evaluate(() => document.documentElement.dir);
    if (dir !== "rtl") throw new Error("dir is " + dir);
  });
  await step("theme toggle sets a dark theme that survives reload", async () => {
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Appearance" }).first().click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    await page.reload({ waitUntil: "networkidle" });
    const t = await page.evaluate(() => document.documentElement.dataset.theme);
    if (t !== "dark") throw new Error("theme after reload: " + t);
  });
  await step("no uncaught page errors", async () => {
    if (errors.length) throw new Error(errors[0]);
  });
  await ctx.close();
}

if (!ANON_ONLY) {
console.log("\nStudent (Jamie)");
{
  const page = await session("student@mit.edu");
  await step("plain-English summary unlocks for a signed-in student", async () => {
    await page.goto(`${BASE}/en/professors/A5081808595`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Explain their work" }).click();
    await page.getByText("What they study").waitFor({ timeout: 30000 });
    await page.getByText("of 2 free summaries used").waitFor();
  });
  await step("email finder is locked on the free plan", async () => {
    await page.getByRole("tab", { name: "Contact" }).click();
    await page.getByText("Unlock the email finder and responsiveness").first().waitFor();
  });
  await step("saving a researcher toggles the bookmark", async () => {
    await page.getByRole("button", { name: "Save" }).first().click();
    await page.getByRole("button", { name: "Saved" }).first().waitFor();
  });
  await step("tracker entry can be created from the profile", async () => {
    await page.getByRole("button", { name: "Add to tracker" }).click();
    await page.getByText("Status", { exact: true }).waitFor();
  });
  await step("email checker flags a weak email and highlights phrases", async () => {
    await page.goto(`${BASE}/en/tools/email-checker`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Try a flawed example" }).click();
    await page.getByRole("button", { name: "Check my email" }).click();
    await page.getByText("What to fix").waitFor({ timeout: 30000 });
    await page.getByText("Flattery").first().waitFor();
    if ((await page.locator("mark").count()) < 2) throw new Error("expected highlighted phrases");
  });
  await step("second email check hits the free limit with an upgrade prompt", async () => {
    await page.getByRole("button", { name: "Check my email" }).click();
    await page.getByText("You've used your free check").waitFor({ timeout: 15000 });
  });
  await step("profile saves with discoverability on", async () => {
    await page.goto(`${BASE}/en/dashboard/profile`, { waitUntil: "networkidle" });
    await page.getByRole("switch").check().catch(() => {});
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.getByText("Profile saved").waitFor();
  });
  await step("AI Match ranks open positions with reasons", async () => {
    await page.goto(`${BASE}/en/dashboard/matches`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Find my matches" }).first().click();
    await page.getByText("Why it fits").first().waitFor({ timeout: 30000 });
    await page.getByText("Undergraduate RA: Self-supervised Vision").first().waitFor();
  });
  await step("AI Match finds professors worldwide", async () => {
    await page.getByRole("tab", { name: /Professors worldwide/ }).click();
    await page.getByRole("button", { name: "Find my matches" }).last().click();
    await page.getByText(/Searched for:/).waitFor({ timeout: 45000 });
    await page.locator("h3 a").first().waitFor({ timeout: 30000 });
  });
  await step("outreach tracker shows the researcher", async () => {
    await page.goto(`${BASE}/en/dashboard/outreach`, { waitUntil: "networkidle" });
    await page.getByText("Evelina G. Fedorenko").waitFor();
  });
  await step("follow-up planner builds two dated messages", async () => {
    await page.goto(`${BASE}/en/tools/follow-up`, { waitUntil: "networkidle" });
    await page.locator("textarea").first().fill("Hi Professor Rivera,\n\nI read your paper on depth estimation and built a small replication over the summer. Would it be possible to help in your group this fall for about ten hours a week?\n\nThank you,\nSam");
    await page.getByRole("button", { name: "Plan my follow-ups" }).click();
    await page.getByText("Follow-up 2").waitFor({ timeout: 20000 });
  });
  await page.context().close();
}

console.log("\nProfessor (Elena Vasquez)");
{
  const page = await session("prof1@mit.edu");
  await step("AI talent search: draft persona, find students, invite one", async () => {
    await page.goto(`${BASE}/en/dashboard/talent`, { waitUntil: "networkidle" });
    await page.locator("select").first().selectOption({ label: "Undergraduate RA: Self-supervised Vision" });
    await page.getByRole("button", { name: /Build the profile|Draft the profile with AI/ }).click();
    await page.getByText("Must have").first().waitFor({ timeout: 30000 });
    await page.getByRole("button", { name: "Find students" }).last().click();
    await page.getByText(/opted in to be discovered/).waitFor({ timeout: 30000 });
    const invite = page.getByRole("button", { name: "Invite to apply" }).first();
    await invite.waitFor({ timeout: 15000 });
    await invite.click();
    await page.getByRole("button", { name: "Send invitation" }).click();
    await page.getByText("Invited").first().waitFor({ timeout: 15000 });
  });
  await step("applicants can be reviewed and accepted", async () => {
    await page.goto(`${BASE}/en/dashboard/positions/1`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Accept" }).first().click();
    await page.getByText("Accepted").first().waitFor();
  });
  await page.context().close();
}

console.log("\nStudent receives the invitation");
{
  const page = await session("diego@mit.edu");
  await step("invitation appears and can be accepted", async () => {
    await page.goto(`${BASE}/en/dashboard/invitations`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Accept & apply/ }).first().click();
    await page.getByText("Accepted").first().waitFor({ timeout: 15000 });
  });
  await page.context().close();
}

console.log("\nAdmin");
{
  const page = await session("admin@labora.edu");
  await step("admin overview and professor list render", async () => {
    await page.goto(`${BASE}/en/admin`, { waitUntil: "networkidle" });
    await page.getByText("Professor verification").waitFor();
    await page.getByText("Prof. Marcus Lee").waitFor();
  });
  await page.context().close();
}

}
await browser.close();
const failed = results.filter((r) => r[0] === "FAIL");
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
