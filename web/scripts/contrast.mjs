// Quick WCAG contrast audit of the design tokens. Run: node scripts/contrast.mjs
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
// blend rgba over a solid background
const over = (fg, alpha, bg) => "#" + hex(fg).map((c, i) => Math.round(c * alpha + hex(bg)[i] * (1 - alpha)).toString(16).padStart(2, "0")).join("");
const checks = {
  light: [
    ["ink on canvas", "#0f1320", "#faf9f6", 7], ["muted on canvas", "#4d5568", "#faf9f6", 4.5], ["muted on surface-2", "#4d5568", "#f5f3ee", 4.5],
    ["faint on canvas (meta only)", "#7b8296", "#faf9f6", 3], ["brand-text on canvas", "#2c42e6", "#faf9f6", 4.5], ["brand-text on brand-soft", "#2c42e6", "#eceeff", 4.5],
    ["brand-fg on brand", "#ffffff", "#2c42e6", 4.5], ["canvas on ink (primary btn)", "#faf9f6", "#0f1320", 7],
    ["good-text on good-soft", "#086645", "#e2f5ec", 4.5], ["warn-text on warn-soft", "#9a4a05", "#fef0d9", 4.5], ["bad-text on bad-soft", "#a52a2a", "#fdeaea", 4.5],
    ["accent-text on accent-soft", "#7a4a00", "#fff2d3", 4.5],
  ],
  dark: [
    ["ink on canvas", "#eef1f8", "#090b11", 7], ["muted on canvas", "#a5adc0", "#090b11", 4.5], ["muted on surface", "#a5adc0", "#10131b", 4.5],
    ["faint on canvas (meta only)", "#71798d", "#090b11", 3], ["brand-text on canvas", "#8b99ff", "#090b11", 4.5],
    ["brand-text on brand-soft", "#8b99ff", over("#7082ff", 0.15, "#10131b"), 4.5], ["brand-fg on brand", "#ffffff", "#4f63f5", 4.5],
    ["canvas on ink (primary btn)", "#090b11", "#eef1f8", 7], ["good-text on good-soft", "#5bd6a4", over("#34c48a", 0.14, "#10131b"), 4.5],
    ["warn-text on warn-soft", "#f4b06a", over("#f2a044", 0.14, "#10131b"), 4.5], ["bad-text on bad-soft", "#f59a9a", over("#ef6b6b", 0.15, "#10131b"), 4.5],
    ["accent-text on accent-soft", "#f5c66a", over("#f2b544", 0.14, "#10131b"), 4.5],
  ],
};
let bad = 0;
for (const [theme, rows] of Object.entries(checks)) {
  console.log(`\n${theme}`);
  for (const [name, fg, bg, min] of rows) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)}  (need ${min})  ${name}`);
  }
}
process.exit(bad ? 1 : 0);
