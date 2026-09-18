import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Optional browser QA: npm install --no-save --package-lock=false playwright
// Then: npx playwright install chromium && node scripts/visual-check.mjs
// REPO_METRO_PLAYWRIGHT and REPO_METRO_BROWSER can reuse an existing local installation.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.REPO_METRO_PLAYWRIGHT || "playwright");
const output = resolve(".artifacts");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.REPO_METRO_BROWSER ? { executablePath: process.env.REPO_METRO_BROWSER } : {}),
});
const errors = [];
const requests = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, colorScheme: "light", reducedMotion: "reduce" });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
const url = pathToFileURL(resolve("docs/index.html")).href;
const results = [];

async function noOverflow() {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "page must not overflow horizontally");
}
async function skin(name) {
  if (!await page.locator("#appearance").evaluate((node) => node.open)) await page.locator("#appearance summary").click();
  await page.locator('[data-skin-choice="' + name + '"]').click();
  assert.equal(await page.locator("html").getAttribute("data-skin"), name);
  assert.equal(await page.locator('[data-skin-choice="' + name + '"]').getAttribute("aria-pressed"), "true");
}
async function mode(name) {
  for (let i = 0; i < 3 && await page.locator("html").getAttribute("data-theme") !== name; i++) {
    await page.locator("#theme-toggle").click();
  }
  assert.equal(await page.locator("html").getAttribute("data-theme"), name);
}
async function closeAppearance() {
  await page.locator("#theme-toggle").focus();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#appearance").evaluate((node) => node.open), false);
}
function contrast(a, b) {
  const luminance = (hex) => {
    const rgb = hex.trim().slice(1).match(/../g).map((part) => parseInt(part, 16) / 255)
      .map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
try {
  await page.goto(url);
  assert.equal(await page.locator(".station").count(), 14);
  assert.ok((await page.locator("#detail-subject").textContent()).includes("Release"));
  const originalHash = await page.locator("#detail-hash").textContent();
  const loadedArt = await page.evaluate(async () => {
    const style = getComputedStyle(document.documentElement);
    return Promise.all(["starry", "sunflowers", "pearl"].map(async (name) => {
      const image = new Image();
      image.src = style.getPropertyValue("--art-" + name).trim().slice(4, -1).replaceAll('"', "");
      await image.decode();
      return { name, width: image.naturalWidth, height: image.naturalHeight };
    }));
  });
  assert.ok(loadedArt.every((image) => image.width >= 1000 && image.height > 0), "all embedded paintings decode offline");
  const geometries = await page.locator(".metro-edge").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d")));
  for (const name of ["studio", "paper", "dusk", "starry", "sunflowers", "pearl"]) {
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width: 1440, height: 1100 });
      await skin(name);
      await mode(theme);
      await closeAppearance();
      await page.locator("h1").click();
      await noOverflow();
      const colors = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return Object.fromEntries(["bg", "surface", "text", "muted", "accent", "accent-text"].map((name) => [name, style.getPropertyValue("--" + name).trim()]));
      });
      for (const background of ["bg", "surface"]) {
        assert.ok(contrast(colors.text, colors[background]) >= 4.5, name + "/" + theme + " text contrast");
        assert.ok(contrast(colors.muted, colors[background]) >= 4.5, name + "/" + theme + " secondary text contrast");
      }
      assert.ok(contrast(colors.accent, colors["accent-text"]) >= 4.5, name + "/" + theme + " button contrast");
      assert.equal(await page.locator("#detail-hash").textContent(), originalHash);
      assert.deepEqual(await page.locator(".metro-edge").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d"))), geometries);
      await page.screenshot({ path: resolve(output, name + "-" + theme + ".png"), fullPage: true });
      if (process.argv.includes("--update-docs") && (name === "starry" && theme === "dark" || name === "sunflowers" && theme === "light" || name === "pearl" && theme === "dark")) {
        await page.screenshot({ path: resolve("docs/painted-" + name + ".jpg"), type: "jpeg", quality: 85, fullPage: true });
      }
      if (process.argv.includes("--update-docs") && name === "studio" && theme === "light") {
        await page.screenshot({ path: resolve("docs/repo-metro-desktop.png"), fullPage: true });
      }
      if (process.argv.includes("--update-docs") && name === "dusk" && theme === "dark") {
        await page.screenshot({ path: resolve("docs/repo-metro-dusk.png"), fullPage: true });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await noOverflow();
      await page.screenshot({ path: resolve(output, name + "-" + theme + "-mobile.png"), fullPage: true });
      if (process.argv.includes("--update-docs") && name === "studio" && theme === "light") {
        await page.screenshot({ path: resolve("docs/repo-metro-mobile.png"), fullPage: true });
      }
      results.push(name + "/" + theme + ": desktop + mobile");
    }
  }
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-skin"), "pearl");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await skin("studio");
  await mode("auto");
  await closeAppearance();
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction((previous) => getComputedStyle(document.body).backgroundColor !== previous, lightBg);
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), lightBg);
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 320, height: 740 });
  await skin("paper");
  await noOverflow();
  const popup = await page.locator(".appearance-popover").boundingBox();
  assert.ok(popup.x >= 0 && popup.x + popup.width <= 320, "appearance panel fits narrow screens");
  await closeAppearance();
  await page.locator("#list-view-button").click();
  assert.equal(await page.locator("#map-panel").isVisible(), false);
  assert.equal(await page.locator("#list-panel").isVisible(), true);
  const listButtons = page.locator(".commit-list-item button");
  await listButtons.nth(1).click();
  await listButtons.nth(1).press("ArrowDown");
  assert.equal(await listButtons.nth(2).getAttribute("aria-pressed"), "true");
  assert.equal(await listButtons.nth(2).evaluate((node) => node === document.activeElement), true);
  await page.locator("#search-input").fill("Merge");
  await page.locator("#search-input").press("Enter");
  assert.ok((await page.locator("#search-status").textContent()).includes("Match 1 of"));
  assert.ok((await page.locator("#detail-subject").textContent()).includes("Merge"));
  await page.locator("#search-input").fill("no-such-commit");
  assert.ok((await page.locator("#search-status").textContent()).startsWith("0 matches"));
  await page.locator("#search-input").press("Escape");
  await page.locator("#map-view-button").click();
  await page.locator("#branch-select").selectOption("feature/dark-theme");
  assert.ok(await page.locator(".station.is-outside-focus").count() > 0);
  await page.locator("#branch-select").selectOption("all");
  await page.locator(".commit-label").nth(2).locator(".subject-label").click();
  assert.ok((await page.locator("#detail-subject").textContent()).includes("dark theme"));
  await page.reload();
  assert.ok((await page.locator("#detail-subject").textContent()).includes("dark theme"));
  await page.evaluate(() => { localStorage.setItem("repo-metro-skin", "invalid"); localStorage.setItem("repo-metro-theme", "invalid"); });
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-skin"), "starry");
  assert.equal(await page.locator("html").getAttribute("data-theme"), "auto");
  await page.locator("#search-input").fill("theme");
  await page.locator("#branch-select").selectOption("feature/dark-theme");
  const beforeSwitch = await page.locator("#detail-hash").textContent();
  await page.locator('[data-gallery-choice="sunflowers"]').click();
  assert.equal(await page.locator("#art-title").textContent(), "Sunflowers");
  assert.equal(await page.locator("#search-input").inputValue(), "theme");
  assert.equal(await page.locator("#branch-select").inputValue(), "feature/dark-theme");
  assert.equal(await page.locator("#detail-hash").textContent(), beforeSwitch);
  assert.equal(await page.locator('[data-skin-choice="sunflowers"]').getAttribute("aria-pressed"), "true");
  await noOverflow();
  const noStorage = await browser.newContext();
  await noStorage.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Disabled", "SecurityError"); } }));
  const offline = await noStorage.newPage();
  offline.on("pageerror", (error) => errors.push(error.message));
  await offline.goto(url);
  await offline.locator("#appearance summary").click();
  await offline.locator('[data-skin-choice="dusk"]').click();
  assert.equal(await offline.locator("html").getAttribute("data-skin"), "dusk");
  assert.ok((await offline.locator("#detail-subject").textContent()).includes("Release"));
  await noStorage.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(JSON.stringify({ screenshots: results, checks: "Persistence, system mode, disabled storage, narrow layout, search, focus, list navigation, selection, deep links, no external requests", errors }, null, 2));
} finally {
  await browser.close();
}
